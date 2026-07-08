import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { concat } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { Cart, CartItem, LocalCartItem, Product } from '../models/product.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface CartItemView {
  product: Product;
  quantity: number;
  cartItemId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private _backendCart = signal<Cart | null>(null);
  private _localItems = signal<LocalCartItem[]>([]);

  readonly cartItems = computed<CartItemView[]>(() => {
    const backendCart = this._backendCart();

    if (backendCart) {
      return (backendCart.cartItems ?? []).map((item: CartItem) => ({
        product: item.product,
        quantity: item.quantity,
        cartItemId: item.id,
      }));
    }

    return (this._localItems() ?? []).map((item: LocalCartItem) => ({
      product: item.product,
      quantity: item.quantity,
    }));
  });

  readonly cartItems$ = this.cartItems;

  readonly totalItems = computed(() =>
    this.cartItems().reduce((sum: number, item: CartItemView) => sum + item.quantity, 0),
  );

  readonly totalPrice = computed(() =>
    this.cartItems().reduce(
      (sum: number, item: CartItemView) => sum + item.product.price * item.quantity,
      0,
    ),
  );

  constructor() {
    this._loadFromStorage();

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
      const userId = this.authService.currentUser()?.id;
      if (!userId) return;

      const cartItem = this.cartItems().find((i: CartItemView) => i.product.id === productId);
      if (cartItem) {
        this.apiService.deleteCartItem(cartItem.cartItemId!).subscribe({
          next: (cart) => this._backendCart.set(cart),
        });
      }
    } else {
      this._localItems.set(
        this._localItems().filter((i: LocalCartItem) => i.product.id !== productId),
      );
      this._saveToStorage();
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (this.authService.isAuthenticated()) {
      const userId = this.authService.currentUser()?.id;
      if (!userId) return;

      const cartItem = this.cartItems().find((i: CartItemView) => i.product.id === productId);
      if (cartItem) {
        this.apiService.updateCartItem(cartItem.cartItemId!, quantity).subscribe({
          next: (cart) => this._backendCart.set(cart),
        });
      }
    } else {
      const items = this._localItems().map((i: LocalCartItem) =>
        i.product.id === productId ? { ...i, quantity } : i,
      );
      this._localItems.set(items);
      this._saveToStorage();
    }
  }

  clearCart(): void {
    if (this.authService.isAuthenticated()) {
      const userId = this.authService.currentUser()?.id;
      if (!userId) return;

      const backendItems = this._backendCart()?.cartItems ?? [];
      if (backendItems.length === 0) return;

      this.apiService.clearCart().subscribe({
        next: () => {
          const current = this._backendCart();
          if (current) {
            this._backendCart.set({ ...current, cartItems: [] });
          }
        },
      });
    } else {
      this._localItems.set([]);
      localStorage.removeItem('cart');
    }
  }

  getCartItem(productId: number): CartItemView | undefined {
    return this.cartItems().find((i) => i.product.id === productId);
  }

  getOrderItems(): { productId: number; quantity: number }[] {
    return this.cartItems().map((i: CartItemView) => ({
      productId: i.product.id!,
      quantity: i.quantity,
    }));
  }

  // ---- Private helpers ----

  private _initBackendCart(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.apiService.getCart().subscribe({
      next: (cart: Cart) => {
        this._backendCart.set(cart);
        const localItems = this._localItems();
        if (localItems.length > 0) {
          this._migrateLocalToBackend();
        }
      },
      error: () => {
        /* backend unavailable — keep using local */
      },
    });
  }

  private _migrateLocalToBackend(): void {
    const localItems = this._localItems();
    if (localItems.length === 0) return;

    // Mapeia cada item para uma requisição de adição individual
    const requests = localItems.map((item: LocalCartItem) =>
      this.apiService.addCartItem({ productId: item.product.id!, quantity: item.quantity }),
    );

    // concat garante a execução sequencial segura para o banco de dados.
    // toArray junta os resultados de retorno.
    concat(...requests)
      .pipe(toArray())
      .subscribe({
        next: (responses: Cart[]) => {
          this._localItems.set([]);
          localStorage.removeItem('cart');

          // A última resposta emitida é o estado final e completo do carrinho no backend
          const finalCart = responses[responses.length - 1];
          if (finalCart) {
            this._backendCart.set(finalCart);
          }
        },
      });
  }

  private _addToBackend(product: Product, quantity: number): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    const existingItem = this.cartItems().find((i: CartItemView) => i.product.id === product.id);
    if (existingItem) {
      this.apiService
        .updateCartItem(existingItem.cartItemId!, existingItem.quantity + quantity)
        .subscribe({
          next: (cart) => this._backendCart.set(cart),
        });
    } else {
      this.apiService.addCartItem({ productId: product.id!, quantity }).subscribe({
        next: (cart) => this._backendCart.set(cart),
      });
    }
  }

  private _addToLocal(product: Product, quantity: number): void {
    const items = this._localItems();
    const idx = items.findIndex((i: LocalCartItem) => i.product.id === product.id);
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
    } catch {
      /* ignore storage errors */
    }
  }

  private _loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        this._localItems.set(JSON.parse(saved) as LocalCartItem[]);
      }
    } catch {
      /* ignore parse errors */
    }
  }
}
