import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroShieldCheck, heroStar } from '@ng-icons/heroicons/outline';
import { lucideAward, lucideTruck, lucideWine } from '@ng-icons/lucide';
import { Product } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductCard } from '../../products/product-card/product-card';

@Component({
  selector: 'app-featured-products',
  imports: [CommonModule, ProductCard, NgIconComponent],
  templateUrl: './featured-products.html',
  providers: [provideIcons({ lucideWine, lucideAward, lucideTruck, heroShieldCheck, heroArrowPath, heroStar })]
})
export class FeaturedProducts implements OnInit{
 

  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);

  featuredProducts = signal<Product[]>([]);
  isLoading = signal(false);

   ngOnInit() {
     this.loadFeaturedProducts();
  }

  private loadFeaturedProducts() {
    this.isLoading.set(true);

    this.apiService.getProducts({ limit: 6 }).subscribe({
      next: (response) => {
        this.featuredProducts.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar produtos em destaque:', error);
        this.isLoading.set(false);
      }
    });
  }

  onAddToCart(product: Product) {
    this.cartService.addToCart(product);
    this.notificationService.showSuccess(
      `"${product.name}" foi adicionado ao carrinho!`, 'Produto adicionado'
    );
  }
}
