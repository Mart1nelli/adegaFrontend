import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

// CORRIGIDO: Agora bate idêntico com o OrderStatus.java do Spring Boot
const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'];

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
      next: (data: Order[]) => {
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
        this.orders.update((list: Order[]) =>
          list.map((o: Order) => (o.id === order.id ? { ...o, status } : o)),
        );
      },
      error: () => {
        this.notificationService.showError('Erro ao atualizar status.');
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
      PAID: 'Pago', // Adicionado para mapear o Enum do Java
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELED: 'Cancelado', // Corrigido para um "L" conforme o Java
    };
    return map[status] ?? status;
  }

  /**
   * Retorna as classes CSS baseadas no status
   */
  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/20', // Cor para Pago
      SHIPPED: 'bg-primary/10 text-primary border-primary/20',
      DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
      CANCELED: 'bg-red-500/10 text-red-400 border-red-500/20', // Corrigido para um "L"
    };
    return map[status] ?? 'border-border-soft text-white border-white/10';
  }
}
