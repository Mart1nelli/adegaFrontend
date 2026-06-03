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
    this.apiService.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  emptyForm(): ProductForm {
    return { name: '', description: '', price: null, stock: null, categoryId: null, imageUrl: '' };
  }

  loadProducts() {
    this.isLoading.set(true);

    // O Spring espera que a página 0 seja a primeira
    const pageIndex = this.page() - 1;

    this.apiService
      .getProducts({
        page: pageIndex, // Ajustado para 0-based
        limit: 15,
      })
      .subscribe({
        next: (data: PaginatedProducts) => {
          this.products.set(data.data);
          this.totalPages.set(data.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erro ao buscar produtos:', err);
          this.isLoading.set(false);
        },
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
      imageUrl: product.imageUrl ?? '',
    };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  save() {
    this.isSaving.set(true);

    // Tratamento dos valores nulos para satisfazer o tipo 'number' do backend
    const productData = {
      name: this.form.name,
      description: this.form.description,
      price: this.form.price ?? 0,
      stock: this.form.stock ?? 0,
      categoryId: this.form.categoryId ?? null,
      imageUrl: this.form.imageUrl,
      isActive: true,
    };

    // Usamos 'as any' ou garantimos a compatibilidade com a interface Product
    const req =
      this.isEditing() && this.form.id
        ? this.apiService.updateProduct(this.form.id, productData as Product)
        : this.apiService.createProduct(productData as Product);

    req.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          this.isEditing() ? 'Produto atualizado!' : 'Produto criado!',
        );
        this.showModal.set(false);
        this.loadProducts();
        this.isSaving.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao salvar produto.');
        this.isSaving.set(false);
      },
    });
  }

  delete(product: Product) {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    this.apiService.deleteProduct(product.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Produto excluído.');
        this.loadProducts();
      },
      error: () => this.notificationService.showError('Erro ao excluir produto.'),
    });
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadProducts();
    }
  }
  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadProducts();
    }
  }
}
