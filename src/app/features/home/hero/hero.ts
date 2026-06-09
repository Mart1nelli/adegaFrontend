import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBuildingStorefront } from '@ng-icons/heroicons/outline';
import { lucideBeer, lucideChevronDown } from '@ng-icons/lucide';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideBeer,
      lucideChevronDown,
      heroBuildingStorefront,
    }),
  ],
})
export class Hero implements OnInit, OnDestroy {
  @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
  private intersectionObserver?: IntersectionObserver;
  isScrollIndicatorHidden = false;

  ngOnInit() {
    this.setupScrollIndicatorVisibility();
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
  }

  private setupScrollIndicatorVisibility() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isScrollIndicatorHidden = !entry.isIntersecting;
        });
      },
      { threshold: 0.1 },
    );
    this.intersectionObserver.observe(this.heroSection.nativeElement);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrollIndicatorHidden = window.scrollY > 100;
  }

  scrollToNextSection() {
    const nextSection = document.querySelector('app-featured-products');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }
}
