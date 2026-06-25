import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
// Importado lucideImage
import { lucideImage, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
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
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  // Adicionado lucideImage aos providers
  providers: [provideIcons({ lucidePencil, lucideTrash2, lucideImage })],
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
    this.apiService.getCategories().subscribe({
      next: (cats: Category[]) => this.categories.set(cats),
    });
  }

  private emptyForm(): ProductForm {
    return {
      name: '',
      description: '',
      price: null,
      stock: null,
      categoryId: null,
      imageUrl: '',
    };
  }

  loadProducts() {
    this.isLoading.set(true);
    const pageIndex = this.page() - 1;

    this.apiService.getProducts({ page: pageIndex, limit: 15, search: this.searchText }).subscribe({
      next: (data: PaginatedProducts) => {
        this.products.set(data.data);
        this.totalPages.set(data.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro ao carregar produtos.');
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

  private mapToProduct(form: ProductForm): Product {
    return {
      ...form,
      price: form.price ?? 0,
      stock: form.stock ?? 0,
      isActive: true,
    } as Product;
  }

  save() {
    this.isSaving.set(true);
    const productData = this.mapToProduct(this.form);

    const req =
      this.isEditing() && this.form.id
        ? this.apiService.updateProduct(this.form.id, productData)
        : this.apiService.createProduct(productData);

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
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return;
    this.apiService.deleteProduct(product.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Produto excluído com sucesso.');
        this.loadProducts();
      },
      error: () => this.notificationService.showError('Erro ao excluir produto.'),
    });
  }
}
