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

  // Estados da UI
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Estados dos Modais
  showModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);

  // Dados de controle
  categoryToDelete = signal<Category | null>(null);
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

  // --- Ações de Edição/Criação ---
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
    const data = { name: this.form.name, description: this.form.description } as Category;

    const request$ =
      this.isEditing() && this.form.id
        ? this.apiService.updateCategory(this.form.id, data)
        : this.apiService.createCategory(data);

    request$
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(
            `Categoria ${this.isEditing() ? 'atualizada' : 'criada'} com sucesso!`,
          );
          this.closeModals();
          this.loadCategories();
        },
        error: () => this.notificationService.showError('Erro ao salvar categoria.'),
      })
      .add(() => this.isSaving.set(false));
  }

  // --- Ações de Exclusão ---
  confirmDelete(cat: Category) {
    this.categoryToDelete.set(cat);
    this.showDeleteModal.set(true);
  }

  executeDelete(event?: Event) {
    event?.preventDefault(); // Impede que o formulário/navegador tente "submeter" ou "navegar"
    event?.stopPropagation(); // Impede que o clique suba para elementos pais (como divs com @click)

    const cat = this.categoryToDelete();
    if (!cat?.id) return;

    this.apiService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Categoria excluída!');
        this.closeModals();
        this.loadCategories();
      },
      error: (err) => {
        console.error(err); // Veja o erro real aqui no console
        this.notificationService.showError('Erro ao excluir.');
      },
    });
  }

  private closeModals() {
    this.showModal.set(false);
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
  }
}
