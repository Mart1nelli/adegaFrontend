import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroLockClosed, heroUser } from '@ng-icons/heroicons/outline';
import { ChangePasswordRequest } from '../../../core/models/auth.models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  providers: [provideIcons({ heroUser, heroLockClosed })],
})
export class Profile implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  isSavingProfile = signal(false);
  isSavingPassword = signal(false);
  activeTab = signal<'profile' | 'password'>('profile');

  profileForm = {
    name: '',
    phone: '',
  };

  passwordForm: ChangePasswordRequest = {
    currentPassword: '',
    newPassword: '',
  };
  confirmPassword = '';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.name = user.name ?? '';
      this.profileForm.phone = user.phone ?? '';
    } else {
      this.isLoading.set(true);
      const stored = this.authService.currentUser();
      if (stored) {
        this.profileForm.name = stored.name;
        this.profileForm.phone = stored.phone ?? '';
        this.isLoading.set(false);
      }
    }
  }

  saveProfile() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.isSavingProfile.set(true);

    // Removido o argumento 'updatedUser' pois não era utilizado
    this.apiService
      .updateUser(user.id, {
        name: this.profileForm.name,
        phone: this.profileForm.phone,
      })
      .subscribe({
        next: () => {
          // Reload profile para atualizar os signals no AuthService
          this.authService.loadUserProfile().subscribe();
          this.notificationService.showSuccess('Perfil atualizado com sucesso!');
          this.isSavingProfile.set(false);
        },
        error: () => {
          this.notificationService.showError('Erro ao atualizar perfil.');
          this.isSavingProfile.set(false);
        },
      });
  }

  savePassword() {
    if (this.passwordForm.newPassword !== this.confirmPassword) {
      this.notificationService.showError('As senhas não coincidem.');
      return;
    }

    this.isSavingPassword.set(true);

    this.authService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.notificationService.showSuccess('Senha alterada com sucesso!');
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.confirmPassword = '';
        this.isSavingPassword.set(false);
      },
      // Tipagem correta do erro
      error: (err: HttpErrorResponse) => {
        // Acessamos de forma segura o campo message dentro do objeto de erro da API
        const msg = (err.error as { message?: string })?.message ?? 'Erro ao alterar senha.';
        this.notificationService.showError(msg);
        this.isSavingPassword.set(false);
      },
    });
  }

  get user() {
    return this.authService.currentUser();
  }
}
