import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Category } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule],
  templateUrl: './admin-categories.html',
})
export class AdminCategories {
  openCreate() {
    throw new Error('Method not implemented.');
  }
  private apiService = inject(ApiService);

  isLoading = signal(false);
  categories = signal<Category[]>([]);
}
