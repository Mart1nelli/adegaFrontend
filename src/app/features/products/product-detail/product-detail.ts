import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroCheckCircle } from '@ng-icons/heroicons/outline';
import { Product } from '../../../core/models/product.models';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, NgIconComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  providers: [provideIcons({ heroCheckCircle })]
})
export class ProductDetail implements OnInit{

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  
  product = signal<Product | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  quantity = signal(1);

  ngOnInit() {

    const id = this.route.snapshot.params['id'];

    if (id) {
      this.loadProduct(+id);
    } else {
      this.router.navigate(['/products']);
    }
  }

  loadProduct(id: number) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar produto');
        this.isLoading.set(false);
        console.error('Erro:', error);
      }
    });
  }

  addToCart() {
    const prod = this.product();

    if (prod) {
      this.cartService.addToCart(prod, this.quantity());
      this.notificationService.showSuccess(
        `"${prod.name}" foi adiciona ao carrinho!`, 'Produto adicionado'
      );
    }
  }

  increaseQuantity() {
    const prod = this.product();

    if (prod && this.quantity() < prod.stock) {
      this.quantity.set(this.quantity() + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
