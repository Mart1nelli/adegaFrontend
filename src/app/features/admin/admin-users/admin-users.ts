import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { User } from '../../../core/models/auth.models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ lucideTrash2 })],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  users = signal<User[]>([]);
  isLoading = signal(true);

  get currentUserId() {
    return this.authService.currentUser()?.id;
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.apiService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar usuários.');
        this.isLoading.set(false);
      },
    });
  }

  async deleteUser(user: User) {
    if (user.id === this.currentUserId) {
      this.notificationService.showError('Você não pode excluir sua própria conta.');
      return;
    }

    const confirmed = await this.notificationService.confirm({
      title: 'Excluir usuário',
      message: `Deseja excluir o usuário "${user.name}"? Esta ação não poderá ser desfeita.`,
      confirmText: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;

    this.apiService.deleteUser(user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Usuário excluído.');
        this.loadUsers();
      },
      error: () => this.notificationService.showError('Erro ao excluir usuário.'),
    });
  }
}
