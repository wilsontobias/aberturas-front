import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
})
export class Cart {
  cart = inject(CartService);
}
