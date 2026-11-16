import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Category, Product } from '../../core/models';
import { CartService } from '../../services/cart';
import { CatalogService } from '../../services/catalog';
import { productImage } from '../../utils/product-image';

@Component({
  selector: 'app-home',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);

  /** Id del último producto agregado, para mostrar el aviso en su tarjeta. */
  lastAddedId = signal<number | null>(null);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');

  categoryId: number | null = null;
  onlyInStock = false;

  ngOnInit(): void {
    this.catalog.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });

    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalog.getProducts({ categoryId: this.categoryId, inStock: this.onlyInStock }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Revisá que la API esté encendida.');
        this.loading.set(false);
      },
    });
  }

  addToCart(product: Product): void {
    this.cart.add(product, 1);
    this.lastAddedId.set(product.id);
  }

  imageOf = productImage;
}
