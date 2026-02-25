import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss'
})
export class OrderHistory implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  expandedOrder = signal<number | null>(null);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar pedidos.');
        this.isLoading.set(false);
      }
    });
  }

  toggleOrder(id: number) {
    this.expandedOrder.set(this.expandedOrder() === id ? null : id);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'Processando',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      PROCESSING: 'badge-info',
      SHIPPED: 'badge-primary',
      DELIVERED: 'badge-success',
      CANCELLED: 'badge-danger'
    };
    return map[status] ?? 'badge-secondary';
  }
}
