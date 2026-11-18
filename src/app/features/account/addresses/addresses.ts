import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroHome, heroMapPin, heroPencil, heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import { lucidePencil, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { Address, CreateAddressRequest } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-addresses',
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './addresses.html',
  providers: [
    provideIcons({
      heroPlus,
      heroTrash,
      heroPencil,
      heroMapPin,
      heroHome,
      lucideX,
      lucideTrash2,
      lucidePencil,
    }),
  ],
})
export class Addresses implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  addresses = signal<Address[]>([]);
  isLoading = signal(false);
  showForm = signal(false);
  editingAddress = signal<Address | null>(null);

  formData: CreateAddressRequest = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    isDefault: false,
  };

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.isLoading.set(true);
    this.apiService.getMyAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.addresses.set(addresses);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar endereços.');
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm() {
    this.editingAddress.set(null);
    this.formData = {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
      isDefault: false,
    };
    this.showForm.set(true);
  }

  openEditForm(address: Address) {
    this.editingAddress.set(address);
    this.formData = {
      street: address.street,
      number: address.number ?? '',
      complement: address.complement ?? '',
      neighborhood: address.neighborhood ?? '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country ?? 'Brasil',
      isDefault: address.isDefault ?? false,
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingAddress.set(null);
  }

  saveAddress() {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    const editing = this.editingAddress();
    if (editing) {
      this.apiService.updateAddress(editing.id, this.formData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Endereço atualizado!');
          this.loadAddresses();
          this.closeForm();
        },
        error: () => this.notificationService.showError('Erro ao atualizar endereço.'),
      });
    } else {
      this.apiService.createAddress(this.formData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Endereço criado!');
          this.loadAddresses();
          this.closeForm();
        },
        error: () => this.notificationService.showError('Erro ao criar endereço.'),
      });
    }
  }

  async deleteAddress(id: number) {
    const confirmed = await this.notificationService.confirm({
      title: 'Excluir endereço',
      message: 'Este endereço será removido da sua conta.',
      confirmText: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;

    this.apiService.deleteAddress(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Endereço excluído!');
        this.loadAddresses();
      },
      error: () => this.notificationService.showError('Erro ao excluir endereço.'),
    });
  }
}
