import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroAdjustmentsHorizontal,
  heroArrowPath,
  heroMagnifyingGlass,
  heroSparkles,
  heroTag,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import { lucideAward, lucideChevronRight, lucideTruck, lucideWine } from '@ng-icons/lucide';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { Category, Product, ProductFilters } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Header } from '../../../shared/components/header/header';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, ReactiveFormsModule, ProductCard, NgIconComponent, Header],
  templateUrl: './catalog.html',
  providers: [
    provideIcons({
      // Ícones do Filtro e Sidebar
      heroAdjustmentsHorizontal,
      heroMagnifyingGlass,
      heroTag,
      heroXMark,
      heroSparkles,

      // Ícones de Ação e Gerais
      heroArrowPath,
      lucideChevronRight,

      // Ícones de Benefícios (do rodapé)
      lucideWine,
      lucideAward,
      lucideTruck,
    }),
  ],
})
export class Catalog implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // Centralização do estado dos filtros
  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    categoryId: new FormControl<number | null>(null),
    minPrice: new FormControl<number | null>(null),
    maxPrice: new FormControl<number | null>(null),
  });

  products = signal<Product[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  itemsPerPage = 12;
  availableCategories = signal<Category[]>([]);

  ngOnInit() {
    this.apiService.getCategories().subscribe({
      next: (cats) => this.availableCategories.set(cats),
    });

    // Reatividade: qualquer mudança no form dispara nova busca
    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });

    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts() {
    this.isLoading.set(true);
    const { search, categoryId, minPrice, maxPrice } = this.filterForm.value;

    const filters: ProductFilters = {
      page: this.currentPage(),
      limit: this.itemsPerPage,
      search: search?.trim() || undefined,
      categoryId: categoryId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    };

    this.apiService.getProducts(filters).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar produtos.');
        this.isLoading.set(false);
      },
    });
  }

  clearSearch() {
    this.filterForm.patchValue({ search: '' });
  }

  clearFilters() {
    this.filterForm.reset();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProducts();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadProducts();
    }
  }

  getPagesArray(): number[] {
    // ... Lógica mantida conforme original ...
    return []; // Substitua pela lógica correta de paginação
  }

  onAddToCart(product: Product) {
    this.cartService.addToCart(product);
    this.notificationService.showSuccess(`"${product.name}" adicionado!`, 'Sucesso');
  }
}
