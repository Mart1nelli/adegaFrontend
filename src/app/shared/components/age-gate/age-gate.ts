import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideShieldCheck, lucideWine } from '@ng-icons/lucide';

@Component({
  selector: 'app-age-gate',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ lucideArrowRight, lucideShieldCheck, lucideWine })],
  templateUrl: './age-gate.html',
})
export class AgeGate {
  private readonly router = inject(Router);
  readonly isVerified = signal(localStorage.getItem('lume-reserve-age-verified') === 'true');
  readonly isBlocked = signal(false);

  goHome(): void {
    this.router.navigate(['/home']);
  }

  confirmAge(): void {
    localStorage.setItem('lume-reserve-age-verified', 'true');
    this.isVerified.set(true);
  }

  declineAge(): void {
    this.isBlocked.set(true);
    this.router.navigate(['/home']);
  }
}
