import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.html',
})
export class AdminCategories implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  categories = signal<Category[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  isSaving = signal(false);
  isEditing = signal(false);

  form = { id: null as number | null, name: '', description: '' };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate() {
    this.form = { id: null, name: '', description: '' };
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEdit(cat: Category) {
    this.form = { id: cat.id ?? null, name: cat.name, description: cat.description || '' };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  save() {
    this.isSaving.set(true);
    const data = { name: this.form.name, description: this.form.description };

    const req =
      this.isEditing() && this.form.id
        ? this.apiService.updateCategory(this.form.id, data as Category)
        : this.apiService.createCategory(data as Category);

    req.subscribe({
      next: () => {
        this.notificationService.showSuccess('Categoria salva com sucesso!');
        this.showModal.set(false);
        this.loadCategories();
        this.isSaving.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao salvar categoria.');
        this.isSaving.set(false);
      },
    });
  }

  delete(cat: Category) {
    if (cat.id === undefined) return;
    if (!confirm(`Excluir "${cat.name}"?`)) return;

    this.apiService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Categoria excluída.');
        this.loadCategories();
      },
      error: () => this.notificationService.showError('Erro ao excluir.'),
    });
  }
}
