import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Cart, LocalCartItem, Product } from '../models/product.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

// CartItemView is the unified view model for the cart UI regardless of storage backend
export interface CartItemView {
  product: Product;
  quantity: number;
  cartItemId?: number; // backend cartItem.id (undefined when using localStorage)
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private _backendCart = signal<Cart | null>(null);
  private _localItems = signal<LocalCartItem[]>([]);

  /** Unified cart items — backend when authenticated, localStorage otherwise. */
  readonly cartItems = computed<CartItemView[]>(() => {
    const backendCart = this._backendCart();
    if (backendCart) {
      return backendCart.cartItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        cartItemId: item.id,
      }));
    }
    return this._localItems().map(item => ({ product: item.product, quantity: item.quantity }));
  });

  // Keep backward-compatible aliases
  readonly cartItems$ = this.cartItems;

  readonly totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  constructor() {
    this._loadFromStorage();

    // React to authentication state changes
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this._initBackendCart();
      } else {
        this._backendCart.set(null);
        this._loadFromStorage();
      }
    });
  }

  addToCart(product: Product, quantity = 1): void {
    if (this.authService.isAuthenticated()) {
      this._addToBackend(product, quantity);
    } else {
      this._addToLocal(product, quantity);
    }
  }

  removeFromCart(productId: number): void {
    if (this.authService.isAuthenticated()) {
      const cartItem = this._backendCart()?.cartItems.find(i => i.productId === productId);
      if (cartItem) {
        this.apiService.deleteCartItem(cartItem.id).subscribe({
          next: () => this._refreshCart()
        });
      }
    } else {
      this._localItems.set(this._localItems().filter(i => i.product.id !== productId));
      this._saveToStorage();
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (this.authService.isAuthenticated()) {
      const cartItem = this._backendCart()?.cartItems.find(i => i.productId === productId);
      if (cartItem) {
        this.apiService.updateCartItem(cartItem.id, { quantity }).subscribe({
          next: () => this._refreshCart()
        });
      }
    } else {
      const items = this._localItems().map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      );
      this._localItems.set(items);
      this._saveToStorage();
    }
  }

  clearCart(): void {
    if (this.authService.isAuthenticated()) {
      const backendItems = this._backendCart()?.cartItems ?? [];
      if (backendItems.length === 0) return;
      forkJoin(backendItems.map(i => this.apiService.deleteCartItem(i.id))).subscribe({
        next: () => this._refreshCart()
      });
    } else {
      this._localItems.set([]);
      localStorage.removeItem('cart');
    }
  }

  getCartItem(productId: number): CartItemView | undefined {
    return this.cartItems().find(i => i.product.id === productId);
  }

  /** Returns items in the format needed for CreateOrderRequest. */
  getOrderItems(): { productId: number; quantity: number }[] {
    return this.cartItems().map(i => ({ productId: i.product.id, quantity: i.quantity }));
  }

  // ---- Private helpers ----

  private _initBackendCart(): void {
    this.apiService.getMyCart().subscribe({
      next: (carts) => {
        const localItems = this._localItems();
        if (carts.length > 0) {
          this._backendCart.set(carts[0]);
          if (localItems.length > 0) {
            this._migrateLocalToBackend(carts[0].id);
          }
        } else {
          this.apiService.createCart().subscribe({
            next: (cart) => {
              this._backendCart.set(cart);
              if (localItems.length > 0) {
                this._migrateLocalToBackend(cart.id);
              }
            }
          });
        }
      },
      error: () => { /* backend unavailable — keep using local */ }
    });
  }

  private _migrateLocalToBackend(cartId: number): void {
    const localItems = this._localItems();
    if (localItems.length === 0) return;

    const requests = localItems.map(item =>
      this.apiService.addCartItem({ cartId, productId: item.product.id, quantity: item.quantity })
    );

    forkJoin(requests).subscribe({
      next: () => {
        this._localItems.set([]);
        localStorage.removeItem('cart');
        this._refreshCart();
      }
    });
  }

  private _refreshCart(): void {
    const cartId = this._backendCart()?.id;
    if (cartId) {
      this.apiService.getCart(cartId).subscribe({
        next: (cart) => this._backendCart.set(cart)
      });
    }
  }

  private _addToBackend(product: Product, quantity: number): void {
    const cartId = this._backendCart()?.id;
    if (!cartId) return;

    const existingItem = this._backendCart()?.cartItems.find(i => i.productId === product.id);
    if (existingItem) {
      this.apiService.updateCartItem(existingItem.id, { quantity: existingItem.quantity + quantity }).subscribe({
        next: () => this._refreshCart()
      });
    } else {
      this.apiService.addCartItem({ cartId, productId: product.id, quantity }).subscribe({
        next: () => this._refreshCart()
      });
    }
  }

  private _addToLocal(product: Product, quantity: number): void {
    const items = this._localItems();
    const idx = items.findIndex(i => i.product.id === product.id);
    if (idx > -1) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
      this._localItems.set(updated);
    } else {
      this._localItems.set([...items, { product, quantity }]);
    }
    this._saveToStorage();
  }

  private _saveToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this._localItems()));
    } catch { /* ignore storage errors */ }
  }

  private _loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        this._localItems.set(JSON.parse(saved) as LocalCartItem[]);
      }
    } catch { /* ignore parse errors */ }
  }
}
