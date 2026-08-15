import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideHelpCircle,
  lucideHistory,
  lucideHome,
  lucideHourglass,
  lucideMessageCircle,
  lucidePackageCheck,
  lucideShoppingBag,
  lucideTruck,
} from '@ng-icons/lucide';
import { Order } from '../../../core/models/product.models';
import { PaymentResponse } from '../../../core/models/payment.models';
import { ApiService } from '../../../core/services/api.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-checkout-pending',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './checkout-pending.html',
  providers: [
    provideIcons({
      lucideClock,
      lucideHourglass,
      lucidePackageCheck,
      lucideTruck,
      lucideHome,
      lucideHistory,
      lucideShoppingBag,
      lucideMessageCircle,
      lucideHelpCircle,
    }),
  ],
})
export class CheckoutPending implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);

  paymentId = signal<string | null>(null);
  orderId = signal<number | null>(null);
  status = signal<string>('pending');
  paymentType = signal<string | null>(null);

  order = signal<Order | null>(null);
  isSyncing = signal<boolean>(false);

  ngOnInit() {
    // Garante que o carrinho foi limpo pois o pedido já foi gerado
    this.cartService.clearCart();

    const params = this.route.snapshot.queryParams;

    const rawPaymentId = params['payment_id'] ?? params['collection_id'];
    this.paymentId.set(rawPaymentId && rawPaymentId !== 'null' ? rawPaymentId : null);

    const rawStatus = params['collection_status'] ?? params['status'] ?? 'pending';
    this.status.set(rawStatus && rawStatus !== 'null' ? rawStatus : 'pending');

    const rawPaymentType = params['payment_type'];
    this.paymentType.set(rawPaymentType && rawPaymentType !== 'null' ? rawPaymentType : null);

    const rawExternalRef = params['external_reference'];
    if (rawExternalRef && rawExternalRef !== 'null') {
      this.syncAndLoad(rawExternalRef);
    }
  }

  private syncAndLoad(externalRef: string) {
    this.isSyncing.set(true);
    this.paymentService.syncPaymentStatus(externalRef).subscribe({
      next: (payment: PaymentResponse) => {
        this.isSyncing.set(false);
        if (payment.orderId) {
          this.orderId.set(payment.orderId);
          this.loadOrderDetails(payment.orderId);
        }
      },
      error: () => {
        this.isSyncing.set(false);
        const parsedId = Number(externalRef);
        if (!isNaN(parsedId)) {
          this.orderId.set(parsedId);
          this.loadOrderDetails(parsedId);
        }
      },
    });
  }

  loadOrderDetails(orderId: number) {
    this.apiService.getOrder(orderId).subscribe({
      next: (orderData: Order) => {
        this.order.set(orderData);
      },
      error: () => {
        /* fallback silencioso */
      },
    });
  }

  get paymentTypeDescription(): string {
    const type = this.paymentType();
    if (type === 'ticket') {
      return 'Boleto bancário gerado. A compensação pode levar de 1 a 3 dias úteis.';
    }
    if (type === 'bank_transfer') {
      return 'Pagamento via Pix em processamento. Normalmente confirmado em até 2 minutos.';
    }
    return 'Seu pagamento está sendo analisado pela operadora com segurança.';
  }

  get supportWhatsAppUrl(): string {
    const ref = this.orderId() ? `Pedido #${this.orderId()}` : (this.paymentId() ? `Transação #${this.paymentId()}` : 'checkout');
    const msg = encodeURIComponent(
      `Olá, Adega do Pai! Meu pagamento do ${ref} está pendente e gostaria de verificar o status.`,
    );
    return `https://wa.me/5511999999999?text=${msg}`;
  }
}
