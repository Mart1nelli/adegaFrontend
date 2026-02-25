import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-logo">Adega do Pai</span>
          <span class="sidebar-badge">Admin</span>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">{{ (authService.currentUser()?.name ?? 'A')[0] }}</div>
          <div class="user-info">
            <p class="user-name">{{ authService.currentUser()?.name }}</p>
            <p class="user-role">Administrador</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <p class="nav-section">Gestão</p>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📦</span> Produtos
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">👤</span> Usuários
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">🛒</span> Pedidos
          </a>
        </nav>
        <a routerLink="/home" class="back-link">← Voltar à loja</a>
      </aside>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .admin-layout {
      display: flex;
      height: 100vh;
      background: #0a0a0a;
      font-family: inherit;
      overflow: hidden;
    }

    .admin-sidebar {
      width: 240px;
      min-width: 240px;
      background: linear-gradient(180deg, #111111 0%, #0d0d0d 100%);
      border-right: 1px solid rgba(244,196,48,0.15);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      gap: .75rem;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(244,196,48,0.15);
    }

    .sidebar-logo {
      font-size: 1.1rem;
      font-weight: 800;
      color: #F4C430;
      letter-spacing: -.02em;
    }

    .sidebar-badge {
      background: rgba(244,196,48,0.15);
      border: 1px solid rgba(244,196,48,0.35);
      color: #F4C430;
      font-size: .7rem;
      font-weight: 700;
      padding: .15rem .5rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .75rem;
      background: rgba(244,196,48,0.06);
      border-radius: 8px;
      border: 1px solid rgba(244,196,48,0.1);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(244,196,48,0.2);
      border: 2px solid rgba(244,196,48,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F4C430;
      font-weight: 800;
      font-size: 1rem;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .user-info { overflow: hidden; }
    .user-name {
      font-size: .85rem;
      font-weight: 600;
      color: #F4C430;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role { font-size: .75rem; color: rgba(244,196,48,0.5); }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: .25rem;
      flex: 1;
      padding-top: .5rem;
    }

    .nav-section {
      font-size: .7rem;
      font-weight: 700;
      color: rgba(244,196,48,0.4);
      text-transform: uppercase;
      letter-spacing: .08em;
      padding: .5rem .75rem .25rem;
      margin: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .65rem .75rem;
      border-radius: 8px;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: .9rem;
      font-weight: 500;
      transition: all .2s;
      border: 1px solid transparent;
    }

    .nav-link:hover {
      background: rgba(244,196,48,0.08);
      color: #F4C430;
      border-color: rgba(244,196,48,0.15);
    }

    .nav-link.active {
      background: rgba(244,196,48,0.15);
      color: #F4C430;
      border-color: rgba(244,196,48,0.35);
      font-weight: 700;
    }

    .nav-icon { font-size: 1rem; line-height: 1; }

    .back-link {
      display: block;
      padding: .6rem .75rem;
      color: rgba(255,255,255,0.35);
      text-decoration: none;
      font-size: .85rem;
      border-top: 1px solid rgba(244,196,48,0.1);
      padding-top: 1rem;
      margin-top: auto;
      transition: color .2s;
    }

    .back-link:hover { color: #F4C430; }

    .admin-content {
      flex: 1;
      overflow-y: auto;
      background: #0a0a0a;
      padding: 2rem;
    }
  `]
})
export class AdminLayout {
  authService = inject(AuthService);
}
