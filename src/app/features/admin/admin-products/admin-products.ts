import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, PaginatedProducts, Product } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

interface ProductForm {
  id?: number;
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  categoryId: number | null;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss'
})
export class AdminProducts implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  isSaving = signal(false);
  isEditing = signal(false);

  page = signal(1);
  totalPages = signal(1);
  searchText = '';

  form: ProductForm = this.emptyForm();

  ngOnInit() {
    this.loadProducts();
    this.apiService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  emptyForm(): ProductForm {
    return { name: '', description: '', price: null, stock: null, categoryId: null, imageUrl: '' };
  }

  loadProducts() {
    this.isLoading.set(true);
    this.apiService.getProducts({ page: this.page(), limit: 15, search: this.searchText }).subscribe({
      next: (data: PaginatedProducts) => {
        this.products.set(data.data);
        this.totalPages.set(data.totalPages);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  search() {
    this.page.set(1);
    this.loadProducts();
  }

  openCreate() {
    this.form = this.emptyForm();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEdit(product: Product) {
    this.form = {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category?.id ?? null,
      imageUrl: product.imageUrl ?? ''
    };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  save() {
    this.isSaving.set(true);
    const body: any = { ...this.form };
    delete body.id;

    const req = this.isEditing() && this.form.id
      ? this.apiService.updateProduct(this.form.id, body)
      : this.apiService.createProduct(body);

    req.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.isEditing() ? 'Produto atualizado!' : 'Produto criado!');
        this.showModal.set(false);
        this.loadProducts();
        this.isSaving.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao salvar produto.');
        this.isSaving.set(false);
      }
    });
  }

  delete(product: Product) {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    this.apiService.deleteProduct(product.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Produto excluído.');
        this.loadProducts();
      },
      error: () => this.notificationService.showError('Erro ao excluir produto.')
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.loadProducts(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.loadProducts(); } }
}
