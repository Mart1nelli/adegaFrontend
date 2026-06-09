// ... imports ...
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroShoppingBag, heroUser } from '@ng-icons/heroicons/outline';
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
    }),
  ],
})
export class Header {
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  isScrolled = signal(false);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly cartCount = this.cartService.totalItems;

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }
}
