import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroShieldCheck, heroStar } from '@ng-icons/heroicons/outline';
import { lucideAward, lucideChevronRight, lucideTruck, lucideWine } from '@ng-icons/lucide';

import { Router } from '@angular/router';
import { PaginatedProducts, Product } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductCard } from '../../products/product-card/product-card';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCard, NgIconComponent],
  templateUrl: './featured-products.html',
  providers: [
    provideIcons({
      lucideWine,
      lucideAward,
      lucideTruck,
      heroShieldCheck,
      heroArrowPath,
      heroStar,
      lucideChevronRight,
    }),
  ],
})
export class FeaturedProducts implements OnInit {
  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Estados
  allProducts = signal<Product[]>([]);
  activeCategory = signal('Todas');
  isLoading = signal(false);

  // Computed: Gera a lista de categorias dinamicamente
  // Resolve o erro de tipagem garantindo que extraímos a string (name)
  categories = computed(() => {
    const cats = this.allProducts()
      .map((p: Product) => p.category?.name) // <-- Ajuste aqui se a propriedade for diferente de 'name'
      .filter((cat): cat is string => typeof cat === 'string' && cat.trim() !== '');

    return ['Todas', ...new Set(cats)];
  });

  // Computed: Filtra os produtos com base na categoria ativa
  featuredProducts = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'Todas') return this.allProducts();

    return this.allProducts().filter((p: Product) => p.category?.name === cat);
  });

  ngOnInit() {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts() {
    this.isLoading.set(true);

    this.apiService.getProducts({ page: 0, limit: 20 }).subscribe({
      next: (response: PaginatedProducts) => {
        this.allProducts.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar produtos em destaque:', error);
        this.isLoading.set(false);
      },
    });
  }

  onAddToCart(product: Product) {
    this.cartService.addToCart(product);
    this.notificationService.showSuccess(
      `"${product.name}" foi adicionado ao carrinho!`,
      'Produto adicionado',
    );
  }

  onCategoryClick(categoryName: string) {
    this.router.navigate(['/products'], {
      queryParams: { category: categoryName },
    });
  }
}
