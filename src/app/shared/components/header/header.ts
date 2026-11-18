import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroShoppingBag, heroUser } from '@ng-icons/heroicons/outline';
import {
  lucideLogOut,
  lucideMenu,
  lucideMoon,
  lucideShieldCheck,
  lucideSun,
  lucideX,
} from '@ng-icons/lucide';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  templateUrl: './header.html',
  providers: [
    provideIcons({
      heroShoppingBag,
      heroMagnifyingGlass,
      heroUser,
      lucideLogOut,
      lucideMenu,
      lucideShieldCheck,
      lucideSun,
      lucideMoon,
      lucideX,
    }),
  ],
})
export class Header {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isScrolled = signal(false);
  isDarkMode = signal(true);
  isMobileMenuOpen = signal(false);
  searchTerm = '';

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly cartCount = this.cartService.totalItems;

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isDarkMode.set(false);
      document.body.classList.add('light');
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update((v: boolean) => !v);
    const isLight = !this.isDarkMode();
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }

  async logout(): Promise<void> {
    const confirmed = await this.notificationService.confirm({
      title: 'Sair da conta',
      message: 'Deseja encerrar sua sessão atual?',
      confirmText: 'Sair',
      danger: true,
    });

    if (!confirmed) return;

    this.authService.logout();
    this.isMobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  submitSearch(): void {
    const search = this.searchTerm.trim();
    this.router.navigate(['/products'], {
      queryParams: search ? { search } : {},
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }
}
