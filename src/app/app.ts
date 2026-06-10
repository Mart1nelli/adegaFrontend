import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Notifications } from './shared/components/notifications/notifications';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Notifications],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.initAuth();
  }
}
