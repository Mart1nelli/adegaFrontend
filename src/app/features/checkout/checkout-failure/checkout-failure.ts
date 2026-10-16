import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideArrowRight,
  lucideHelpCircle,
  lucideHistory,
  lucideMessageCircle,
  lucideRefreshCw,
  lucideShoppingBag,
  lucideXCircle,
} from '@ng-icons/lucide';
import { PaymentResponse } from '../../../core/models/payment.models';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-checkout-failure',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './checkout-failure.html',
  providers: [
    provideIcons({
      lucideXCircle,
      lucideAlertCircle,
      lucideRefreshCw,
      lucideHistory,
      lucideShoppingBag,
      lucideMessageCircle,
      lucideHelpCircle,
      lucideArrowRight,
    }),
  ],
})
export class CheckoutFailure implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);

  paymentId = signal<string | null>(null);
  status = signal<string | null>(null);
  orderId = signal<number | null>(null);
  paymentMethodId = signal<number | null>(null);
  statusDetail = signal<string | null>(null);
  isRetrying = signal<boolean>(false);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;

    const rawPaymentId = params['payment_id'] ?? params['collection_id'];
    this.paymentId.set(rawPaymentId && rawPaymentId !== 'null' ? rawPaymentId : null);

    const rawStatus = params['collection_status'] ?? params['status'] ?? 'rejected';
    this.status.set(rawStatus && rawStatus !== 'null' ? rawStatus : 'rejected');

    const rawExternalRef = params['external_reference'];
    if (rawExternalRef && rawExternalRef !== 'null') {
      this.resolvePaymentAndOrder(rawExternalRef);
    }

    const rawDetail = params['status_detail'];
    this.statusDetail.set(rawDetail && rawDetail !== 'null' ? rawDetail : null);
  }

  private resolvePaymentAndOrder(externalRef: string) {
    this.paymentService.getPaymentById(externalRef).subscribe({
      next: (payment: PaymentResponse) => {
        if (payment.orderId) {
          this.orderId.set(payment.orderId);
        }
        if (payment.paymentMethodId) {
          this.paymentMethodId.set(payment.paymentMethodId);
        }
      },
    });
  }

  retryPayment() {
    const orderId = this.orderId();
    if (!orderId) {
      this.router.navigate(['/checkout']);
      return;
    }

    this.isRetrying.set(true);
    const paymentMethodId = this.paymentMethodId();
    if (!paymentMethodId) {
      this.notificationService.showError(
        'Não foi possível identificar a forma de pagamento original. Tente pelo checkout.',
      );
      this.router.navigate(['/checkout']);
      return;
    }

    this.paymentService.createPayment({ orderId, paymentMethodId }).subscribe({
      next: (res: PaymentResponse) => {
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else {
          this.isRetrying.set(false);
          this.notificationService.showError(
            'Não foi possível obter a URL de pagamento do Mercado Pago.',
          );
          this.router.navigate(['/checkout']);
        }
      },
      error: () => {
        this.isRetrying.set(false);
        this.notificationService.showError(
          'Erro ao gerar novo link de pagamento. Tente novamente pelo checkout.',
        );
        this.router.navigate(['/checkout']);
      },
    });
  }

  get supportWhatsAppUrl(): string {
    const ref = this.orderId()
      ? `Pedido #${this.orderId()}`
      : this.paymentId()
        ? `Transação #${this.paymentId()}`
        : 'checkout';
    const msg = encodeURIComponent(
      `Olá, Lume Reserve! Tive uma falha no pagamento do meu ${ref} e gostaria de ajuda para concluir minha compra.`,
    );
    return `https://wa.me/5511999999999?text=${msg}`;
  }
}
