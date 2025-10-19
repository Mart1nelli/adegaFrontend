import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBuildingStorefront, heroMagnifyingGlass, heroShoppingBag, heroUser } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  providers: [provideIcons({ heroShoppingBag, heroBuildingStorefront, heroUser, heroMagnifyingGlass })]
})
export class Header {
  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }
}
