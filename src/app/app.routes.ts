import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './core/layouts/main-layout';
import { AdminLayout } from './features/admin/admin-layout/admin-layout';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Rotas COM Header e Footer
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
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
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
        canActivate: [authGuard],
      },
      {
        path: 'account',
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/account/profile/profile').then((m) => m.Profile),
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
    ],
  },

  // Rotas SEM Header e Footer
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },

  // Admin possui seu próprio layout (já definido no seu AdminLayout)
  // No seu app.routes.ts:
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
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

  { path: '**', redirectTo: '/home' },
];
