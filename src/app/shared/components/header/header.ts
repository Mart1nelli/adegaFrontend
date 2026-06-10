import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroShoppingBag, heroUser } from '@ng-icons/heroicons/outline';
import { lucideLogOut, lucideMoon, lucideShieldCheck, lucideSun } from '@ng-icons/lucide';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './header.html',
  providers: [
    provideIcons({
      heroShoppingBag,
      heroMagnifyingGlass,
      heroUser,
      lucideLogOut,
      lucideShieldCheck,
      lucideSun, // Adicionado
      lucideMoon, // Adicionado
    }),
  ],
})
export class Header {
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  isScrolled = signal(false);
  isDarkMode = signal(true); // Sinal para controlar o estado do tema

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
    this.isDarkMode.update((v) => !v);
    const isLight = !this.isDarkMode();
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }
}
