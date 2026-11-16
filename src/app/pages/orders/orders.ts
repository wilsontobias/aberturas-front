import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Order } from '../../core/models';
import { OrderService } from '../../services/orders';
import { orderColor, orderLabel } from '../../utils/status';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private orders = inject(OrderService);

  list = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');

  label = orderLabel;
  color = orderColor;

  ngOnInit(): void {
    this.orders.getMyOrders().subscribe({
      next: (orders) => {
        this.list.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar tus pedidos.');
        this.loading.set(false);
      },
    });
  }
}
