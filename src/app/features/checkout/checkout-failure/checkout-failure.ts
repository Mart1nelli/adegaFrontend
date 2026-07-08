import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-failure',
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-failure.html',
})
export class CheckoutFailure implements OnInit {
  private route = inject(ActivatedRoute);

  paymentId = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.paymentId.set(params['payment_id'] ?? params['collection_id'] ?? null);
  }
}
