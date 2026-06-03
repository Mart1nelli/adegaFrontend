import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },

  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },

  {
    path: 'products',
    loadComponent: () => import('./features/products/catalog/catalog').then((m) => m.Catalog),
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then((m) => m.ProductDetail),
  },

  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-list/cart-list').then((m) => m.CartList),
  },

  // ── Checkout ─────────────────────────────────────────────────────────
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
    canActivate: [authGuard],
  },

  // ── Account ──────────────────────────────────────────────────────────
  {
    path: 'account',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/account/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./features/account/addresses/addresses').then((m) => m.Addresses),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/account/orders/order-history').then((m) => m.OrderHistory),
      },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/admin-products/admin-products').then((m) => m.AdminProducts),
      },

      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/admin-categories/admin-categories').then(
            (m) => m.AdminCategories,
          ),
      },

      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users').then((m) => m.AdminUsers),
      },

      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/admin-orders/admin-orders').then((m) => m.AdminOrders),
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '/home',
  },
];
