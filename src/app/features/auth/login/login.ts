import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroEnvelope, heroLockClosed } from '@ng-icons/heroicons/outline';
import { LoginRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  templateUrl: './login.html',
  providers: [provideIcons({ heroEnvelope, heroLockClosed })]
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  loginData = signal<LoginRequest>({
    email: '',
    password: ''
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (!this.loginData().email || !this.loginData().password) {
      this.errorMessage.set('Preencha todos os campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginData()).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Email ou senha incorretos');
        console.error('Erro no login:', error);
      }
    });
  }
}
