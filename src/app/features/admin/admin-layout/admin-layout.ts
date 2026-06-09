import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  authService = inject(AuthService);

  navItems = [
    { route: '/admin/products', label: 'Produtos', icon: '📦' },
    { route: '/admin/categories', label: 'Categorias', icon: '🏷️' },
    { route: '/admin/users', label: 'Usuários', icon: '👤' },
    { route: '/admin/orders', label: 'Pedidos', icon: '🛒' },
  ];
}
