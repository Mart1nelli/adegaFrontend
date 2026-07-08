import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-pending',
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-pending.html',
})
export class CheckoutPending implements OnInit {
  private route = inject(ActivatedRoute);

  paymentId = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.paymentId.set(params['payment_id'] ?? params['collection_id'] ?? null);
  }
}
