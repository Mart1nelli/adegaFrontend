import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Address,
  CreateOrderRequest,
  LocalCartItem,
  Order,
  Payment,
  PaymentMethod,
} from '../../core/models/product.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';

type CheckoutStep = 'address' | 'review' | 'payment' | 'redirecting';

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
  paymentMethods = signal<PaymentMethod[]>([]);
  selectedPaymentMethodId = signal<number | null>(null);

  // Criados após createOrder()
  createdOrder = signal<Order | null>(null);

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
    this.loadPaymentMethods();
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

  loadPaymentMethods() {
    this.apiService.getPaymentMethods().subscribe({
      next: (methods: PaymentMethod[]) => {
        const activeMethods = methods.filter((m: PaymentMethod) => m.isActive);
        this.paymentMethods.set(activeMethods);
        if (activeMethods.length > 0) {
          this.selectedPaymentMethodId.set(activeMethods[0].id);
        }
      },
      error: () => { /* silently fail */ },
    });
  }

  goToReview() {
    if (!this.selectedAddressId() && this.addresses().length > 0) {
      this.notificationService.showError('Selecione um endereço de entrega.');
      return;
    }
    if (!this.selectedPaymentMethodId() && this.paymentMethods().length > 0) {
      this.notificationService.showError('Selecione uma forma de pagamento.');
      return;
    }
    this.step.set('review');
  }

  /**
   * Passo 1: Cria o pedido no backend.
   * Passo 2: Com o orderId retornado, chama createPayment para gerar a preferência no Mercado Pago.
   * Passo 3: Redireciona para o checkoutUrl (sandbox_init_point) retornado.
   */
  placeOrder() {
    const user = this.currentUser;
    if (!user) return;

    this.isPlacing.set(true);

    const body: CreateOrderRequest = {
      userId: user.id,
      addressId: this.selectedAddressId()!,
      paymentMethodId: this.selectedPaymentMethodId()!,
      items: this.cartItems.map((item: LocalCartItem) => ({
        productId: item.product.id!,
        quantity: item.quantity,
      })),
    };

    this.apiService.createOrder(body).subscribe({
      next: (order: Order) => {
        this.createdOrder.set(order);
        this.cartService.clearCart();
        this.startPayment(order.id, this.selectedPaymentMethodId()!);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao criar o pedido.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
      },
    });
  }

  private startPayment(orderId: number, paymentMethodId: number) {
    this.step.set('redirecting');

    this.apiService.createPayment({ orderId, paymentMethodId }).subscribe({
      next: (payment: Payment) => {
        if (payment.checkoutUrl) {
          // Redireciona para o Checkout Pro do Mercado Pago (modo Sandbox)
          window.location.href = payment.checkoutUrl;
        } else {
          this.notificationService.showError('URL de pagamento não retornada pelo gateway.');
          this.isPlacing.set(false);
          this.step.set('review');
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao iniciar o pagamento com o Mercado Pago.';
        this.notificationService.showError(msg);
        this.isPlacing.set(false);
        this.step.set('review');
      },
    });
  }

  get selectedAddress(): Address | undefined {
    return this.addresses().find((a: Address) => a.id === this.selectedAddressId());
  }

  get selectedPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethods().find((m: PaymentMethod) => m.id === this.selectedPaymentMethodId());
  }
}
