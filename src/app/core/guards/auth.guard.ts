import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se usuário está autenticado
  if (authService.isAuthenticated()) {
    return true; // Permite acesso
  }

  // Se não está autenticado, redireciona para login
  router.navigate(['/auth/login']);
  return false; // Bloqueia acesso
};