import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface HttpMetric {
  method: string;
  status: number;
  durationMs: number;
  success: boolean;
}

export interface CheckoutMetric {
  event: 'order_created' | 'payment_submitted' | 'payment_result' | 'payment_error';
  status?: string;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly httpMetrics: HttpMetric[] = [];
  private readonly checkoutMetrics: CheckoutMetric[] = [];
  private readonly maxEntries = 100;

  recordHttp(metric: HttpMetric): void {
    this.httpMetrics.push(metric);
    this.trim(this.httpMetrics);
    this.log('http', metric);
  }

  recordCheckout(metric: CheckoutMetric): void {
    this.checkoutMetrics.push(metric);
    this.trim(this.checkoutMetrics);
    this.log('checkout', metric);
  }

  snapshot() {
    return {
      http: [...this.httpMetrics],
      checkout: [...this.checkoutMetrics],
    };
  }

  private trim<T>(entries: T[]): void {
    if (entries.length > this.maxEntries) {
      entries.splice(0, entries.length - this.maxEntries);
    }
  }

  private log(scope: string, data: unknown): void {
    if (!environment.production) {
      console.debug(`[telemetry:${scope}]`, data);
    }
  }
}
