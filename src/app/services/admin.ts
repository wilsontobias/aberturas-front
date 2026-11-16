import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/config';
import { Permissions, Product, User } from '../core/models';

export interface ProductData {
  category_id: number;
  material_id: number;
  name: string;
  description: string | null;
  width_cm: number;
  height_cm: number;
  color: string | null;
  price: number;
  stock: number;
}

/** Llamadas de los paneles de administración (usuarios, permisos y productos). */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${API_URL}/users`).pipe(map((res) => res.users));
  }

  setStatus(userId: number, status: boolean): Observable<unknown> {
    return this.http.patch(`${API_URL}/users/${userId}/status`, { status });
  }

  changeType(userId: number, type: 'customer' | 'seller'): Observable<unknown> {
    return this.http.patch(`${API_URL}/users/${userId}/type`, { type });
  }

  grantAdmin(userId: number): Observable<unknown> {
    return this.http.put(`${API_URL}/users/${userId}/admin`, {});
  }

  revokeAdmin(userId: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/users/${userId}/admin`);
  }

  grantOwner(userId: number): Observable<unknown> {
    return this.http.put(`${API_URL}/users/${userId}/owner`, {});
  }

  revokeOwner(userId: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/users/${userId}/owner`);
  }

  getPermissions(userId: number): Observable<{ user: { id: number; name: string; type: string }; permissions: Permissions }> {
    return this.http.get<{ user: { id: number; name: string; type: string }; permissions: Permissions }>(
      `${API_URL}/users/${userId}/permissions`,
    );
  }

  savePermissions(userId: number, permissions: Permissions): Observable<unknown> {
    return this.http.put(`${API_URL}/users/${userId}/permissions`, permissions);
  }

  createProduct(data: ProductData): Observable<Product> {
    return this.http.post<{ product: Product }>(`${API_URL}/products`, data).pipe(map((res) => res.product));
  }

  updateProduct(id: number, data: ProductData): Observable<Product> {
    return this.http.put<{ product: Product }>(`${API_URL}/products/${id}`, data).pipe(map((res) => res.product));
  }

  deactivateProduct(id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/products/${id}`);
  }
}
