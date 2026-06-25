import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Address, CreateOrderRequest, LocalCartItem, Order } from '../../core/models/product.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';

type CheckoutStep = 'address' | 'review' | 'done';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  step = signal<CheckoutStep>('address');
  isLoading = signal(false);
  isPlacing = signal(false);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  orderId = signal<number | null>(null);

  get cartItems() {
    return this.cartService.cartItems();
  }
  get cartTotal() {
    return this.cartService.totalPrice();
  }
  get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit() {
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    this.loadAddresses();
  }

  loadAddresses() {
    const user = this.currentUser;
    if (!user) return;

    this.isLoading.set(true);
    this.apiService.getMyAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.addresses.set(addresses);
        const def = addresses.find((a: Address) => a.isDefault);
        if (def) this.selectedAddressId.set(def.id);
        else if (addresses.length > 0) this.selectedAddressId.set(addresses[0].id);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  goToReview() {
    if (!this.selectedAddressId() && this.addresses().length > 0) {
      this.notificationService.showError('Selecione um endereço de entrega.');
      return;
    }
    this.step.set('review');
  }

  placeOrder() {
    const user = this.currentUser;
    if (!user) return;
    this.isPlacing.set(true);

    const items = this.cartItems.map((item: LocalCartItem) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));

    const body: CreateOrderRequest = {
      userId: user.id,
      addressId: this.selectedAddressId() ?? undefined,
      items,
    };

    this.apiService.createOrder(body).subscribe({
      next: (order: Order) => {
        this.orderId.set(order.id);
        this.cartService.clearCart();
        this.step.set('done');
        this.isPlacing.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao finalizar o pedido.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
      },
    });
  }

  get selectedAddress(): Address | undefined {
    return this.addresses().find((a: Address) => a.id === this.selectedAddressId());
  }
}
