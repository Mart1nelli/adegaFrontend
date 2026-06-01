import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

const STATUS_OPTIONS = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html'
})
export class AdminOrders implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  statusOptions = STATUS_OPTIONS;

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.isLoading.set(true);
    this.apiService.getAllOrders().subscribe({
      next: (orders) => { this.orders.set(orders); this.isLoading.set(false); },
      error: () => { this.notificationService.showError('Erro ao carregar pedidos.'); this.isLoading.set(false); }
    });
  }

  updateStatus(order: Order, status: string) {
    this.apiService.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.notificationService.showSuccess('Status atualizado!');
        this.orders.update(orders => orders.map(o => o.id === order.id ? { ...o, status } : o));
      },
      error: () => this.notificationService.showError('Erro ao atualizar status.')
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente', CONFIRMED: 'Confirmado', PROCESSING: 'Processando',
      SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning', CONFIRMED: 'badge-info', PROCESSING: 'badge-info',
      SHIPPED: 'badge-primary', DELIVERED: 'badge-success', CANCELLED: 'badge-danger'
    };
    return map[status] ?? 'badge-secondary';
  }

  getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
