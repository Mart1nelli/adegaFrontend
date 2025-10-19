import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBolt, heroCheckCircle, heroExclamationTriangle, heroShoppingBag, heroTag } from '@ng-icons/heroicons/outline';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, NgIconComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  providers: [provideIcons({ heroExclamationTriangle, heroBolt, heroCheckCircle, heroShoppingBag, heroTag })]
})
export class ProductCard {

  private router = inject(Router);

  product = input.required<Product>();
  showAddToCart = input(true);

  addToCart = output<Product>();
  viewDetails = output<Product>();

  onAddToCart() {
    this.addToCart.emit(this.product());
  }

  onViewDetails() {
    this.viewDetails.emit(this.product());
  }

  getCategoryName(): string {
    const category = this.product().category;
    return typeof category === 'object' ? category.name : category || '';
  }
}
