import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Order, Pagination } from '../../core/models';
import { OrderService } from '../../services/orders';
import { orderColor, orderLabel } from '../../utils/status';

@Component({
  selector: 'app-staff-orders',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './staff-orders.html',
})
export class StaffOrders implements OnInit {
  private orders = inject(OrderService);

  list = signal<Order[]>([]);
  pagination = signal<Pagination | null>(null);
  loading = signal(true);
  error = signal('');

  status = '';
  page = 1;

  label = orderLabel;
  color = orderColor;

  statuses = [
    'pending_payment',
    'receipt_in_review',
    'confirmed',
    'in_production',
    'finished',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
  ];

  ngOnInit(): void {
    this.load();
  }

  changeFilter(): void {
    this.page = 1;
    this.load();
  }

  goTo(page: number): void {
    this.page = page;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.orders.getOrders({ status: this.status || undefined, page: this.page }).subscribe({
      next: (res) => {
        this.list.set(res.orders);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los pedidos.');
        this.loading.set(false);
      },
    });
  }

  customerName(order: Order): string {
    const profile = order.user?.customer_profile;

    return profile ? `${profile.first_name} ${profile.last_name}` : (order.user?.name ?? '');
  }
}
