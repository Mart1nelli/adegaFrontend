import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-[#0B0B0D] overflow-hidden">

      <!-- Sidebar -->
      <aside class="w-60 min-w-60 bg-[#0F0F13] border-r border-[#FED90F]/10 flex flex-col py-5 px-3 gap-1 overflow-y-auto">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 px-3 pb-4 border-b border-[#FED90F]/10 mb-2">
          <div class="w-8 h-8 rounded-lg bg-[#FED90F]/10 border border-[#FED90F]/25 flex items-center justify-center text-base">🍺</div>
          <span class="text-[#FED90F] font-black text-base font-[Fredoka] leading-none">Adega do Pai</span>
          <span class="ml-auto bg-[#FED90F]/10 border border-[#FED90F]/30 text-[#FED90F] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
        </div>

        <!-- User -->
        <div class="flex items-center gap-2.5 px-3 py-2.5 bg-[#FED90F]/5 border border-[#FED90F]/10 rounded-xl mb-3">
          <div class="w-8 h-8 rounded-full bg-[#FED90F]/20 border-2 border-[#FED90F]/40 flex items-center justify-center text-[#FED90F] font-black text-sm flex-shrink-0">
            {{ (authService.currentUser()?.name ?? 'A')[0].toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="text-[#FED90F] text-xs font-semibold truncate leading-none mb-0.5">{{ authService.currentUser()?.name }}</p>
            <p class="text-[#FED90F]/40 text-[10px]">Administrador</p>
          </div>
        </div>

        <!-- Nav -->
        <p class="text-[#FED90F]/40 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1">Gestão</p>

        <a routerLink="/admin/products" routerLinkActive="bg-[#FED90F]/15 border-[#FED90F]/35 text-[#FED90F] font-bold"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-white/50 text-sm font-medium transition-all hover:bg-[#FED90F]/8 hover:text-[#FED90F] hover:border-[#FED90F]/15">
          <span class="text-base">📦</span> Produtos
        </a>
        <a routerLink="/admin/users" routerLinkActive="bg-[#FED90F]/15 border-[#FED90F]/35 text-[#FED90F] font-bold"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-white/50 text-sm font-medium transition-all hover:bg-[#FED90F]/8 hover:text-[#FED90F] hover:border-[#FED90F]/15">
          <span class="text-base">👤</span> Usuários
        </a>
        <a routerLink="/admin/orders" routerLinkActive="bg-[#FED90F]/15 border-[#FED90F]/35 text-[#FED90F] font-bold"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-white/50 text-sm font-medium transition-all hover:bg-[#FED90F]/8 hover:text-[#FED90F] hover:border-[#FED90F]/15">
          <span class="text-base">🛒</span> Pedidos
        </a>

        <!-- Back to store -->
        <a routerLink="/home"
           class="mt-auto flex items-center gap-2 px-3 py-2.5 text-white/25 text-xs font-medium hover:text-[#FED90F] transition-colors border-t border-[#FED90F]/8 pt-4 mt-4">
          ← Voltar à loja
        </a>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-[#0B0B0D] p-6">
        <router-outlet></router-outlet>
      </main>

    </div>
  `
})
export class AdminLayout {
  authService = inject(AuthService);
}
