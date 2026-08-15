import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideClock,
  lucideCreditCard,
  lucideExternalLink,
  lucideHistory,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { Order } from '../../../core/models/product.models';
import { PaymentResponse } from '../../../core/models/payment.models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './order-history.html',
  providers: [
    provideIcons({
      lucideHistory,
      lucideCreditCard,
      lucideRefreshCw,
      lucideExternalLink,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideClock,
    }),
  ],
})
export class OrderHistory implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  expandedOrder = signal<number | null>(null);

  payingOrderId = signal<number | null>(null);
  syncingOrderId = signal<number | null>(null);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.apiService.getMyOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar pedidos.');
        this.isLoading.set(false);
      },
    });
  }

  toggleOrder(id: number) {
    this.expandedOrder.set(this.expandedOrder() === id ? null : id);
  }

  getLatestPayment(order: Order): PaymentResponse | undefined {
    if (order.payments && order.payments.length > 0) {
      return order.payments[order.payments.length - 1] as PaymentResponse;
    }
    return undefined;
  }

  isOrderPending(order: Order): boolean {
    const s = (order.status || '').toUpperCase().trim();
    return s === 'PENDING';
  }

  paymentStatusLabel(order: Order): string {
    const payment = this.getLatestPayment(order);
    const s = (payment?.status || (order.status === 'PAID' ? 'COMPLETED' : order.status) || 'PENDING')
      .toUpperCase()
      .trim();

    const map: Record<string, string> = {
      COMPLETED: 'Aprovado',
      PAID: 'Aprovado',
      APPROVED: 'Aprovado',
      PENDING: 'Pendente',
      FAILED: 'Recusado',
      REJECTED: 'Recusado',
      REFUNDED: 'Estornado',
    };
    return map[s] ?? s;
  }

  paymentStatusClass(order: Order): string {
    const payment = this.getLatestPayment(order);
    const s = (payment?.status || (order.status === 'PAID' ? 'COMPLETED' : order.status) || 'PENDING')
      .toUpperCase()
      .trim();

    const map: Record<string, string> = {
      COMPLETED: 'badge-success',
      PAID: 'badge-success',
      APPROVED: 'badge-success',
      PENDING: 'badge-warning',
      FAILED: 'badge-danger',
      REJECTED: 'badge-danger',
      REFUNDED: 'badge-secondary',
    };
    return map[s] ?? 'badge-secondary';
  }

  payNow(order: Order, event?: Event) {
    event?.stopPropagation();
    const latest = this.getLatestPayment(order);
    if (latest?.checkoutUrl && latest.status === 'PENDING') {
      window.location.href = latest.checkoutUrl;
      return;
    }

    this.payingOrderId.set(order.id);
    this.paymentService.createPayment({ orderId: order.id, paymentMethodId: order.paymentMethodId || 1 }).subscribe({
      next: (payment: PaymentResponse) => {
        this.payingOrderId.set(null);
        if (payment.checkoutUrl) {
          window.location.href = payment.checkoutUrl;
        } else {
          this.notificationService.showError('Não foi possível obter link de pagamento do Mercado Pago.');
        }
      },
      error: (err) => {
        this.payingOrderId.set(null);
        const msg = err?.error?.message ?? 'Erro ao iniciar pagamento com Mercado Pago.';
        this.notificationService.showError(msg);
      },
    });
  }

  verifyPaymentStatus(order: Order, event?: Event) {
    event?.stopPropagation();
    this.syncingOrderId.set(order.id);
    const latest = this.getLatestPayment(order);

    if (latest?.id) {
      this.paymentService.syncPaymentStatus(latest.id).subscribe({
        next: (res: PaymentResponse) => {
          this.syncingOrderId.set(null);
          this.notificationService.showSuccess(`Status sincronizado: ${this.paymentStatusLabel({ ...order, payments: [res] })}`);
          this.loadOrders();
        },
        error: () => {
          this.syncingOrderId.set(null);
          this.notificationService.showError('Não foi possível sincronizar o status do pagamento.');
        },
      });
    } else {
      this.paymentService.getPaymentsByOrderId(order.id).subscribe({
        next: (payments: PaymentResponse[]) => {
          if (payments.length > 0) {
            const lastPayment = payments[payments.length - 1];
            this.paymentService.syncPaymentStatus(lastPayment.id).subscribe({
              next: (res: PaymentResponse) => {
                this.syncingOrderId.set(null);
                this.notificationService.showSuccess(`Status sincronizado: ${this.paymentStatusLabel({ ...order, payments: [res] })}`);
                this.loadOrders();
              },
              error: () => {
                this.syncingOrderId.set(null);
                this.loadOrders();
              },
            });
          } else {
            this.syncingOrderId.set(null);
            this.loadOrders();
          }
        },
        error: () => {
          this.syncingOrderId.set(null);
          this.loadOrders();
        },
      });
    }
  }

  statusLabel(status: string): string {
    const s = (status || '').toUpperCase().trim();
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      IN_PROCESS: 'Em Análise',
      CONFIRMED: 'Confirmado',
      APPROVED: 'Aprovado',
      PAID: 'Pago',
      PROCESSING: 'Em Preparação',
      PREPARING: 'Na Adega',
      SHIPPED: 'Saiu para Entrega',
      DELIVERING: 'A Caminho',
      DELIVERED: 'Entregue',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      CANCELED: 'Cancelado',
      REJECTED: 'Recusado',
    };
    return map[s] ?? status;
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase().trim();
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      IN_PROCESS: 'badge-warning',
      CONFIRMED: 'badge-info',
      APPROVED: 'badge-success',
      PAID: 'badge-success',
      PROCESSING: 'badge-info',
      PREPARING: 'badge-primary',
      SHIPPED: 'badge-primary',
      DELIVERING: 'badge-primary',
      DELIVERED: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      CANCELED: 'badge-danger',
      REJECTED: 'badge-danger',
    };
    return map[s] ?? 'badge-secondary';
  }
}
