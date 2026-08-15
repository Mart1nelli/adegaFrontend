import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

  paymentId = signal<string | null>(null);
  status = signal<string | null>(null);
  orderId = signal<string | null>(null);
  statusDetail = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;

    const rawPaymentId = params['payment_id'] ?? params['collection_id'];
    this.paymentId.set(rawPaymentId && rawPaymentId !== 'null' ? rawPaymentId : null);

    const rawStatus = params['collection_status'] ?? params['status'] ?? 'rejected';
    this.status.set(rawStatus && rawStatus !== 'null' ? rawStatus : 'rejected');

    const rawExternalRef = params['external_reference'];
    this.orderId.set(rawExternalRef && rawExternalRef !== 'null' ? rawExternalRef : null);

    const rawDetail = params['status_detail'];
    this.statusDetail.set(rawDetail && rawDetail !== 'null' ? rawDetail : null);
  }

  get supportWhatsAppUrl(): string {
    const ref = this.orderId() ? `Pedido #${this.orderId()}` : (this.paymentId() ? `Transação #${this.paymentId()}` : 'checkout');
    const msg = encodeURIComponent(
      `Olá, Adega do Pai! Tive uma falha no pagamento do meu ${ref} e gostaria de ajuda para concluir minha compra.`,
    );
    return `https://wa.me/5511999999999?text=${msg}`;
  }
}
