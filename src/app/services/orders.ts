import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/config';
import { Order, Pagination, Payment, Tracking } from '../core/models';

export interface CreateOrderData {
  items: { product_id: number; quantity: number }[];
  locality_id: number;
  street: string;
  street_number: string;
  address_notes?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);

  createOrder(data: CreateOrderData): Observable<Order> {
    return this.http.post<{ order: Order }>(`${API_URL}/orders`, data).pipe(map((res) => res.order));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<{ orders: Order[] }>(`${API_URL}/orders/my`).pipe(map((res) => res.orders));
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<{ order: Order }>(`${API_URL}/orders/${id}`).pipe(map((res) => res.order));
  }

  getTracking(id: number): Observable<Tracking> {
    return this.http.get<{ tracking: Tracking }>(`${API_URL}/orders/${id}/tracking`).pipe(map((res) => res.tracking));
  }

  getPayments(id: number): Observable<Payment[]> {
    return this.http.get<{ payments: Payment[] }>(`${API_URL}/orders/${id}/payments`).pipe(map((res) => res.payments));
  }

  /** Sube el comprobante de la seña (archivo JPG, PNG o PDF de hasta 2 MB). */
  uploadReceipt(id: number, file: File): Observable<unknown> {
    const body = new FormData();
    body.append('receipt', file);

    return this.http.post(`${API_URL}/orders/${id}/payments`, body);
  }

  cancelOrder(id: number): Observable<unknown> {
    return this.http.patch(`${API_URL}/orders/${id}/cancel`, {});
  }

  /** Descarga el comprobante. Va por HttpClient para que lleve el token. */
  getReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${API_URL}/payments/${paymentId}/receipt`, { responseType: 'blob' });
  }

  /** Descarga la boleta en PDF. Va por HttpClient para que lleve el token. */
  getInvoice(orderId: number): Observable<Blob> {
    return this.http.get(`${API_URL}/orders/${orderId}/invoice`, { responseType: 'blob' });
  }

  /** Todos los pedidos (vendedores y administradores), con filtro por estado y paginado. */
  getOrders(filters: { status?: string; page?: number } = {}): Observable<{ orders: Order[]; pagination: Pagination }> {
    let params = new HttpParams().set('per_page', 10);

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.page) {
      params = params.set('page', filters.page);
    }

    return this.http.get<{ orders: Order[]; pagination: Pagination }>(`${API_URL}/orders`, { params });
  }

  verifyPayment(paymentId: number, approved: boolean, reason?: string): Observable<unknown> {
    return this.http.patch(`${API_URL}/payments/${paymentId}/verify`, {
      approved,
      rejection_reason: approved ? null : reason,
    });
  }

  updateItemStatus(itemId: number, status: string): Observable<unknown> {
    return this.http.patch(`${API_URL}/order-items/${itemId}/status`, { status });
  }

  updateShipDate(orderId: number, shipDate: string): Observable<unknown> {
    return this.http.patch(`${API_URL}/orders/${orderId}/ship-date`, { ship_date: shipDate });
  }

  registerCashBalance(orderId: number): Observable<unknown> {
    return this.http.post(`${API_URL}/orders/${orderId}/payments/cash`, {});
  }
}
