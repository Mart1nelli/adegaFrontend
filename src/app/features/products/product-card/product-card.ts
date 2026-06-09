import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroShoppingBag, heroTag } from '@ng-icons/heroicons/outline';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './product-card.html',
  providers: [
    provideIcons({
      heroShoppingBag,
      heroTag,
    }),
  ],
})
export class ProductCard {
  // Injeção de dependência para navegação (caso precise redirecionar ao clicar no card)
  private router = inject(Router);

  // Inputs utilizando a sintaxe moderna (Angular 17+)
  product = input.required<Product>();

  // Outputs para emitir ações para o componente pai (Catalog ou FeaturedProducts)
  addToCart = output<Product>();
  viewDetails = output<Product>();

  /**
   * Emite o evento de adição ao carrinho
   */
  onAddToCart() {
    this.addToCart.emit(this.product());
  }

  /**
   * Emite o evento de visualização de detalhes
   */
  onViewDetails() {
    this.viewDetails.emit(this.product());
  }

  /**
   * Helper para garantir o nome da categoria corretamente
   */
  getCategoryName(): string {
    const category = this.product().category;
    // Verifica se a categoria é um objeto (populado) ou apenas o ID/nome
    return typeof category === 'object' && category !== null ? category.name : category || 'Geral';
  }
}
