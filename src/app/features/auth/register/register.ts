import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroDevicePhoneMobile,
  heroEnvelope,
  heroLockClosed,
  heroUser,
} from '@ng-icons/heroicons/outline';
import { RegisterRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  templateUrl: './register.html',
  providers: [provideIcons({ heroUser, heroEnvelope, heroLockClosed, heroDevicePhoneMobile })],
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Estado do formulário
  registerData = signal<RegisterRequest>({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  // Estado de loading e erro
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Método chamado quando usuário clica em "Cadastrar"
  onSubmit() {
    if (!this.registerData().email || !this.registerData().password || !this.registerData().name) {
      this.errorMessage.set('Preencha todos os campos obrigatórios');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerData()).subscribe({
      next: () => {
        // Registro sucesso - AuthService já redirecionou
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Erro ao cadastrar. Tente novamente.');
        console.error('Erro no registro:', error);
      },
    });
  }
}
