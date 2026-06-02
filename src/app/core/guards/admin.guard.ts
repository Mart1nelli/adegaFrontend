import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Verifica se é admin
  const user = authService.currentUser();

  if (user && user.role === 'ADMIN') {
    return true; // Permite acesso
  }

  // Se não é admin, redireciona para home
  router.navigate(['/']);
  return false; // Bloqueia acesso
};
