import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import {
  debounceTime,
  combineLatest,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Category, PaginatedProducts, Product, ProductFilters } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductCard, NgIconComponent],
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
  private reload$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private cache = new Map<string, PaginatedProducts>();

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
    // 1. Carrega categorias primeiro
    this.apiService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats: Category[]) => {
        this.availableCategories.set(cats);

        // 2. Verifica se há uma categoria na URL
        const categoryName = this.route.snapshot.queryParamMap.get('category');

        const search = this.route.snapshot.queryParamMap.get('search');

        if (categoryName || search) {
          // Procura o ID correspondente ao nome da categoria
          const catFound = cats.find((c) => c.name === categoryName);

          if (catFound) {
            // Atualiza o formulário silenciosamente (emitEvent: false)
            this.filterForm.patchValue({ categoryId: catFound.id }, { emitEvent: false });
          }
        }
        if (search) {
          this.filterForm.patchValue({ search }, { emitEvent: false });
        }

        // 3. Só agora iniciamos o stream, que vai pegar o valor do form (já atualizado)
        this.initFilterStream();
      });
  }

  private initFilterStream() {
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this.cache.clear();
    });

    combineLatest([
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
      this.reload$.pipe(startWith(undefined)),
    ])
      .pipe(
        debounceTime(150),
        tap(() => this.isLoading.set(true)),
        switchMap(([formValues]) => {
          const cacheKey = JSON.stringify({ ...formValues, page: this.currentPage() });

          if (this.cache.has(cacheKey)) {
            return of(this.cache.get(cacheKey)!);
          }

          const filters: ProductFilters = {
            page: this.currentPage() - 1,
            limit: this.itemsPerPage,
            search: formValues.search?.trim() || undefined,
            categoryId: formValues.categoryId || undefined,
            maxPrice: formValues.priceRange || this.maxLimit,
          };

          return this.apiService.getProducts(filters).pipe(
            tap((res: PaginatedProducts) => {
              this.cache.set(cacheKey, res);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: PaginatedProducts) => {
          this.products.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erro na API:', err);
          this.isLoading.set(false);
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.reload$.next();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPricePercent() {
    const val = this.filterForm.value.priceRange || 0;
    return (val / this.maxLimit) * 100;
  }

  clearFilters() {
    this.currentPage.set(1);
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
