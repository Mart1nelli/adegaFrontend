import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideHistory } from '@ng-icons/lucide';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './order-history.html',
  providers: [provideIcons({ lucideHistory })],
})
export class OrderHistory implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
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
      REJECTED: 'badge-danger',
    };
    return map[s] ?? 'badge-secondary';
  }
}
