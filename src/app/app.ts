import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';
import { Notifications } from './shared/components/notifications/notifications';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Notifications],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private apiService = inject(ApiService);
  protected readonly title = signal('adega-do-pai-frontend');

  connectionStatus = signal<string | null>(null);

}