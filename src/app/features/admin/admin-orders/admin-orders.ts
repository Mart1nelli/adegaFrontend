import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
})
export class AdminOrders implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  // Estados
  orders = signal<Order[]>([]);
  isLoading = signal(true);
  statusOptions = STATUS_OPTIONS;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.apiService.getAllOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar pedidos.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Atualiza o status do pedido e reflete no estado local (Signal)
   */
  updateStatus(order: Order, event: Event) {
    const status = (event.target as HTMLSelectElement).value;

    this.apiService.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.notificationService.showSuccess('Status atualizado com sucesso!');
        this.orders.update((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
      },
      error: () => {
        this.notificationService.showError('Erro ao atualizar status.');
        // Opcional: recarregar pedidos caso a sincronização falhe
        this.loadOrders();
      },
    });
  }

  /**
   * Tradução amigável dos status
   */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'Processando',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado',
    };
    return map[status] ?? status;
  }

  /**
   * Retorna as classes CSS baseadas no status
   */
  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      PROCESSING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      SHIPPED: 'bg-primary/10 text-primary border-primary/20',
      DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return map[status] ?? 'border-border-soft text-white border-white/10';
  }
}
