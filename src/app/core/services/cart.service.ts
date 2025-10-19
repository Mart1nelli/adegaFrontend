import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.models';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems = signal<CartItem[]>([]);

  // Signals para estado reativo
  cartItems$ = this.cartItems.asReadonly();
  totalItems = signal(0);
  totalPrice = signal(0);

  constructor() {
    this.loadCartFromStorage();
  }

  addToCart(product: Product, quantity = 1): void {
    const currentItems = this.cartItems();
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      // Produto já existe no carrinho, aumenta a quantidade
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      this.cartItems.set(updatedItems);
    } else {
      // Novo produto no carrinho
      this.cartItems.set([...currentItems, { product, quantity }]);
    }

    this.updateTotals();
    this.saveCartToStorage();
  }

  removeFromCart(productId: number): void {
    const currentItems = this.cartItems();
    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    this.cartItems.set(updatedItems);
    this.updateTotals();
    this.saveCartToStorage();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentItems = this.cartItems();
    const updatedItems = currentItems.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this.cartItems.set(updatedItems);
    this.updateTotals();
    this.saveCartToStorage();
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.updateTotals();
    this.saveCartToStorage();
  }

  getCartItem(productId: number): CartItem | undefined {
    return this.cartItems().find(item => item.product.id === productId);
  }

  private updateTotals(): void {
    const items = this.cartItems();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    this.totalItems.set(totalItems);
    this.totalPrice.set(totalPrice);
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cartItems()));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }

  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart) as CartItem[];
        this.cartItems.set(items);
        this.updateTotals();
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error);
      this.cartItems.set([]);
    }
  }
}