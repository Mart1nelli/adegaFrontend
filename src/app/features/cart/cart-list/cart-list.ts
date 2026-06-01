import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroBuildingStorefront,
  heroMinus,
  heroPlus,
  heroShoppingBag,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import { CartItemView, CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-cart-list',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './cart-list.html',
  providers: [
    provideIcons({ heroShoppingBag, heroBuildingStorefront, heroPlus, heroMinus, heroTrash }),
  ],
})
export class CartList {
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Signals do serviço do carrinho
  cartItems = this.cartService.cartItems;
  totalItems = this.cartService.totalItems;
  totalPrice = this.cartService.totalPrice;

  // Método para aumentar quantidade
  increaseQuantity(item: CartItemView) {
    this.cartService.updateQuantity(item.product.id, item.quantity + 1);
    this.notificationService.showSuccess('Quantidade atualizada!');
  }

  // Método para diminuir quantidade
  decreaseQuantity(item: CartItemView) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product.id, item.quantity - 1);
      this.notificationService.showSuccess('Quantidade atualizada!');
    }
  }

  // Método para remover item
  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
    this.notificationService.showSuccess('Produto removido do carrinho!');
  }

  // Método para limpar carrinho
  clearCart() {
    this.cartService.clearCart();
    this.notificationService.showSuccess('Carrinho limpo!');
  }

  // Método para calcular subtotal de um item
  getItemSubtotal(item: CartItemView): number {
    return item.product.price * item.quantity;
  }

  // Método para verificar se carrinho está vazio
  isCartEmpty(): boolean {
    return this.cartItems().length === 0;
  }

  // Método para finalizar compra
  checkout() {
    this.router.navigate(['/checkout']);
  }
}
