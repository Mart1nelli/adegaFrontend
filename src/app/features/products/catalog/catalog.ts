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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductCard, NgIconComponent, Header],
  templateUrl: './catalog.html',
  providers: [
    provideIcons({
      heroAdjustmentsHorizontal,
      heroMagnifyingGlass,
      heroTag,
      heroXMark,
      heroSparkles,
      heroArrowPath,
      lucideChevronRight,
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

  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    categoryId: new FormControl<number | null>(null),
    priceRange: new FormControl<number>(500),
  });

  products = signal<Product[]>([]);
  isLoading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  itemsPerPage = 12;
  availableCategories = signal<Category[]>([]);
  maxLimit = 500;

  ngOnInit() {
    this.apiService.getCategories().subscribe({
      next: (cats) => this.availableCategories.set(cats),
    });

    // Apenas a busca na API tem debounce para não sobrecarregar o servidor
    this.filterForm.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
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
    const { search, categoryId, priceRange } = this.filterForm.value;

    const filters: ProductFilters = {
      page: this.currentPage(),
      limit: this.itemsPerPage,
      search: search?.trim() || undefined,
      categoryId: categoryId || undefined,
      maxPrice: priceRange || this.maxLimit,
    };

    this.apiService.getProducts(filters).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // O Angular chama esta função em tempo real conforme você arrasta,
  // mantendo a bolinha e a barra sincronizadas instantaneamente.
  getPricePercent() {
    const val = this.filterForm.value.priceRange || 0;
    return (val / this.maxLimit) * 100;
  }

  clearFilters() {
    this.filterForm.patchValue({
      search: '',
      categoryId: null,
      priceRange: this.maxLimit,
    });
  }

  onAddToCart(product: Product) {
    this.cartService.addToCart(product);
    this.notificationService.showSuccess(`"${product.name}" adicionado!`, 'Sucesso');
  }
}
