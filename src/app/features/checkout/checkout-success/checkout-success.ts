import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-success',
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-success.html',
})
export class CheckoutSuccess implements OnInit {
  private route = inject(ActivatedRoute);

  paymentId = signal<string | null>(null);
  merchantOrderId = signal<string | null>(null);
  status = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.paymentId.set(params['payment_id'] ?? params['collection_id'] ?? null);
    this.merchantOrderId.set(params['merchant_order_id'] ?? null);
    this.status.set(params['collection_status'] ?? params['status'] ?? 'approved');
  }
}
