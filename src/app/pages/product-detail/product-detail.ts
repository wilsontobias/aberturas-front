import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Product } from '../../core/models';
import { CartService } from '../../services/cart';
import { CatalogService } from '../../services/catalog';
import { productImage } from '../../utils/product-image';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-product-detail',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './product-detail.html',
})
export class ProductDetail implements OnInit {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cart = inject(CartService);
  auth = inject(AuthService);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal('');
  added = signal(false);

  quantity = 1;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.catalog.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Ese producto no existe.' : 'No se pudo cargar el producto.');
        this.loading.set(false);
      },
    });
  }

  addToCart(goToCart = false): void {
    const product = this.product();

    if (!product) {
      return;
    }

    this.cart.add(product, this.quantity);
    this.added.set(true);

    if (goToCart) {
      this.router.navigateByUrl('/cart');
    }
  }

  imageOf = productImage;
}
