import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBuildingStorefront, heroShieldCheck, heroUser } from '@ng-icons/heroicons/outline';
import {
  lucideAward,
  lucideBeer,
  lucideCoffee,
  lucideMartini,
  lucideTruck,
  lucideWine,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, RouterLink, NgIconComponent],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideBeer,
      lucideAward,
      lucideTruck,
      lucideWine,
      lucideMartini,
      lucideCoffee,
      heroShieldCheck,
      heroBuildingStorefront,
      heroUser,
    }),
  ],
})
export class Hero implements OnInit, OnDestroy {
  @ViewChild('heroSection', { static: true }) heroSection!: ElementRef;
  @ViewChild('scrollIndicator', { static: false }) scrollIndicator!: ElementRef;

  private intersectionObserver?: IntersectionObserver;
  isScrollIndicatorHidden = false;

  ngOnInit() {
    this.setupScrollIndicatorVisibility();
  }

  ngOnDestroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupScrollIndicatorVisibility() {
    // Cria um observer para detectar quando o usuário rolou para baixo
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Se o hero não está mais visível (usuário rolou para baixo), esconde o indicador
          this.isScrollIndicatorHidden = !entry.isIntersecting;
        });
      },
      {
        threshold: 0.1, // Quando 10% do hero ainda está visível
        rootMargin: '-50px 0px', // Margem para ativar um pouco antes
      },
    );

    // Observa a seção hero
    if (this.heroSection) {
      this.intersectionObserver.observe(this.heroSection.nativeElement);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Fallback: também esconde baseado no scroll Y
    if (window.scrollY > 100 && !this.isScrollIndicatorHidden) {
      this.isScrollIndicatorHidden = true;
    } else if (window.scrollY <= 100 && this.isScrollIndicatorHidden) {
      this.isScrollIndicatorHidden = false;
    }
  }

  scrollToNextSection(event?: Event) {
    // Previne o comportamento padrão para tecla space
    if (event) {
      event.preventDefault();
    }

    // Rola suavemente para a próxima seção (featured-products)
    const nextSection = document.querySelector('app-featured-products');
    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // Fallback: rola uma tela para baixo
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth',
      });
    }
  }
}
