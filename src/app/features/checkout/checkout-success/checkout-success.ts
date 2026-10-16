import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCheckCircle2,
  lucideClock,
  lucideCreditCard,
  lucideHistory,
  lucideHome,
  lucideMapPin,
  lucideMessageCircle,
  lucidePackageCheck,
  lucideShoppingBag,
  lucideTruck,
} from '@ng-icons/lucide';
import { PaymentResponse } from '../../../core/models/payment.models';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-checkout-success',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './checkout-success.html',
  providers: [
    provideIcons({
      lucideCheckCircle2,
      lucidePackageCheck,
      lucideTruck,
      lucideHome,
      lucideShoppingBag,
      lucideHistory,
      lucideArrowRight,
      lucideMessageCircle,
      lucideClock,
      lucideMapPin,
      lucideCreditCard,
    }),
  ],
})
export class CheckoutSuccess implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);

  paymentId = signal<string | null>(null);
  merchantOrderId = signal<string | null>(null);
  status = signal<string>('approved');
  paymentType = signal<string | null>(null);
  orderId = signal<number | null>(null);
  paymentAmount = signal<number | null>(null);

  order = signal<Order | null>(null);
  isLoadingOrder = signal<boolean>(false);
  isSyncing = signal<boolean>(false);

  ngOnInit() {
    // 1. Garante que o carrinho fique limpo após o pagamento
    this.cartService.clearCart();

    // 2. Extrai e sanitiza os parâmetros de retorno do Mercado Pago
    const params = this.route.snapshot.queryParams;

    const rawPaymentId = params['payment_id'] ?? params['collection_id'];
    this.paymentId.set(rawPaymentId && rawPaymentId !== 'null' ? rawPaymentId : null);

    const rawMerchantOrderId = params['merchant_order_id'];
    this.merchantOrderId.set(
      rawMerchantOrderId && rawMerchantOrderId !== 'null' ? rawMerchantOrderId : null,
    );

    const rawStatus = params['collection_status'] ?? params['status'] ?? 'approved';
    this.status.set(rawStatus);

    const rawPaymentType = params['payment_type'];
    this.paymentType.set(rawPaymentType && rawPaymentType !== 'null' ? rawPaymentType : null);

    // 3. Obtém external_reference (ID do pagamento no backend) e sincroniza imediatamente com o MP
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
          this.paymentAmount.set(payment.amount);
          this.loadOrderDetails(payment.orderId);
        }
      },
      error: () => {
        this.isSyncing.set(false);
      },
    });
  }

  loadOrderDetails(orderId: number) {
    this.isLoadingOrder.set(true);
    this.apiService.getOrder(orderId).subscribe({
      next: (orderData: Order) => {
        this.order.set(orderData);
        if (orderData.totalAmount && !this.paymentAmount()) {
          this.paymentAmount.set(orderData.totalAmount);
        }
        this.isLoadingOrder.set(false);
      },
      error: () => {
        this.isLoadingOrder.set(false);
      },
    });
  }

  get paymentTypeLabel(): string {
    const type = this.paymentType();
    if (!type) return 'Mercado Pago';
    const map: Record<string, string> = {
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      bank_transfer: 'Pix',
      ticket: 'Boleto Bancário',
      account_money: 'Saldo Mercado Pago',
    };
    return map[type] ?? type;
  }

  get supportWhatsAppUrl(): string {
    const orderNum = this.orderId() ? `#${this.orderId()}` : (this.paymentId() ?? 'recente');
    const msg = encodeURIComponent(
      `Olá, Lume Reserve! Fiz o pedido ${orderNum} e gostaria de informações sobre a entrega.`,
    );
    return `https://wa.me/5511999999999?text=${msg}`;
  }
}
