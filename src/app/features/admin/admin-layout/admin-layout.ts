import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBeer,
  lucideCreditCard,
  lucidePackage,
  lucideShoppingCart,
  lucideTag,
  lucideUsers,
} from '@ng-icons/lucide';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIconComponent],
  providers: [
    provideIcons({
      lucidePackage,
      lucideTag,
      lucideUsers,
      lucideShoppingCart,
      lucideCreditCard,
      lucideArrowLeft,
      lucideBeer,
    }),
  ],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  authService = inject(AuthService);

  navItems = [
    { route: '/admin/products', label: 'Produtos', icon: 'lucidePackage' },
    { route: '/admin/categories', label: 'Categorias', icon: 'lucideTag' },
    { route: '/admin/users', label: 'Usuários', icon: 'lucideUsers' },
    { route: '/admin/orders', label: 'Pedidos', icon: 'lucideShoppingCart' },
    { route: '/admin/payment-methods', label: 'Pagamentos', icon: 'lucideCreditCard' },
  ];
}
