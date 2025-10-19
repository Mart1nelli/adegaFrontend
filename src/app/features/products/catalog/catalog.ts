import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroMagnifyingGlass, heroSparkles, heroTag, heroXMark } from '@ng-icons/heroicons/outline';
import { lucideWine } from '@ng-icons/lucide';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { PaginatedProducts, Product, ProductFilters } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule, ProductCard, NgIconComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  providers: [provideIcons({ heroTag, heroXMark, heroArrowPath, heroMagnifyingGlass, heroSparkles, lucideWine })]
})
export class Catalog implements OnInit, OnDestroy {

  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);

  private destroy$ = new Subject<void>();
  private filterSubject$ = new Subject<ProductFilters>();

  products = signal<Product[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Pagination properties
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  itemsPerPage = 12;

  // Filter properties
  searchTerm = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  availableCategories = signal<string[]>([]);

  ngOnInit() {
    // Configurar o Subject com debounce para controlar as requisições
    this.filterSubject$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.loadProducts(filters);
    });

    // Carregar produtos iniciais
    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(filters?: ProductFilters) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Add pagination to filters
    const filtersWithPagination: ProductFilters = {
      ...filters,
      page: this.currentPage(),
      limit: this.itemsPerPage
    };

    this.apiService.getProducts(filtersWithPagination).subscribe({
      next: (response: PaginatedProducts) => {
        this.products.set(response.data || []);
        this.totalItems.set(response.total || 0);
        this.totalPages.set(response.totalPages || 1);
        this.extractAvailableCategories(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar produtos. Tente novamente em alguns segundos.');
        this.isLoading.set(false);
        console.error('Erro:', error);
        // Resetar estado em caso de erro
        this.products.set([]);
        this.availableCategories.set([]);
      }
    });
  }

  private extractAvailableCategories(products: Product[]) {
    if (!products || !Array.isArray(products)) {
      this.availableCategories.set([]);
      return;
    }

    const categories = new Set<string>();
    products.forEach(product => {
      if (product && product.category) {
        // Se category é um objeto, pegar o name; se é string, usar diretamente
        const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
        if (categoryName) {
          categories.add(categoryName);
        }
      }
    });
    this.availableCategories.set(Array.from(categories).sort());
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFiltersChange() {
    this.applyFilters();
  }

  private applyFilters() {
    const filters: ProductFilters = {
      page: this.currentPage(),
      limit: this.itemsPerPage
    };

    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }

    if (this.minPrice !== null && this.minPrice > 0) {
      filters.minPrice = this.minPrice;
    }

    if (this.maxPrice !== null && this.maxPrice > 0) {
      filters.maxPrice = this.maxPrice;
    }

    this.filterSubject$.next(filters);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage.set(1);
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilters();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.applyFilters();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.applyFilters();
    }
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(total);
      }
    }

    return pages;
  }

  onAddToCart(product: Product) {
    this.cartService.addToCart(product);
    this.notificationService.showSuccess(
      `"${product.name}" foi adicionado ao carrinho!`,
      'Produto adicionado'
    );
  }
}
