import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () => import('./features/home/home/home').then(m => m.Home)
  },

  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },

  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },

  {
    path: 'products',
    loadComponent: () => import('./features/products/catalog/catalog').then(m => m.Catalog)
  },

  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/product-detail/product-detail').then(m => m.ProductDetail)
  },

  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-list/cart-list').then(m => m.CartList)
  },


];
