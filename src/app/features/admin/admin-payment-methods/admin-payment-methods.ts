import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideCreditCard,
  lucidePencil,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { PaymentMethod } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

interface PaymentMethodForm {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [provideIcons({ lucidePencil, lucideTrash2, lucideCheck, lucideX, lucideCreditCard })],
  templateUrl: './admin-payment-methods.html',
})
export class AdminPaymentMethods implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  paymentMethods = signal<PaymentMethod[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  isSaving = signal(false);
  isEditing = signal(false);

  form: PaymentMethodForm = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  private emptyForm(): PaymentMethodForm {
    return { name: '', description: '', isActive: true };
  }

  load() {
    this.isLoading.set(true);
    this.apiService.getPaymentMethods().subscribe({
      next: (methods: PaymentMethod[]) => {
        this.paymentMethods.set(methods);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar formas de pagamento.');
        this.isLoading.set(false);
      },
    });
  }

  openCreate() {
    this.form = this.emptyForm();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEdit(method: PaymentMethod) {
    this.form = {
      id: method.id,
      name: method.name,
      description: method.description ?? '',
      isActive: method.isActive,
    };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  save() {
    if (!this.form.name.trim()) {
      this.notificationService.showError('O nome da forma de pagamento é obrigatório.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || undefined,
      isActive: this.form.isActive,
    };

    const req =
      this.isEditing() && this.form.id
        ? this.apiService.updatePaymentMethod(this.form.id, payload)
        : this.apiService.createPaymentMethod(payload);

    req.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          this.isEditing() ? 'Forma de pagamento atualizada!' : 'Forma de pagamento criada!',
        );
        this.showModal.set(false);
        this.load();
        this.isSaving.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Erro ao salvar forma de pagamento.';
        this.notificationService.showError(msg);
        this.isSaving.set(false);
      },
    });
  }

  toggleActive(method: PaymentMethod) {
    this.apiService.updatePaymentMethod(method.id, { isActive: !method.isActive }).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          !method.isActive ? 'Forma de pagamento ativada!' : 'Forma de pagamento desativada!',
        );
        this.load();
      },
      error: () => this.notificationService.showError('Erro ao alterar status.'),
    });
  }

  async delete(method: PaymentMethod) {
    const confirmed = await this.notificationService.confirm({
      title: 'Excluir forma de pagamento',
      message: `Deseja excluir "${method.name}"? Esta ação não poderá ser desfeita.`,
      confirmText: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;

    this.apiService.deletePaymentMethod(method.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Forma de pagamento excluída!');
        this.load();
      },
      error: () => this.notificationService.showError('Erro ao excluir forma de pagamento.'),
    });
  }
}
