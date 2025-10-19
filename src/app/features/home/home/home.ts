import { Component } from '@angular/core';
import { Header } from '../../../shared/components/header/header';
import { FeaturedProducts } from '../featured-products/featured-products';
import { Hero } from '../hero/hero';

@Component({
  selector: 'app-home',
  imports: [Hero, FeaturedProducts, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
