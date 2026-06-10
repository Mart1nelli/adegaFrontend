import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideInstagram } from '@ng-icons/lucide';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [
    provideIcons({
      lucideInstagram,
    }),
  ],
  templateUrl: './footer.html',
})
export class Footer {}
