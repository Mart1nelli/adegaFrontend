import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeaturedProducts } from '../featured-products/featured-products';
import { Hero } from '../hero/hero';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, FeaturedProducts, CommonModule],
  templateUrl: './home.html',
})
export class Home {}
