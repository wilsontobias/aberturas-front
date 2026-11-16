import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/config';
import { Category, Locality, Product, Province } from '../core/models';

export interface Material {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);

  getProducts(filters: { categoryId?: number | null; inStock?: boolean } = {}): Observable<Product[]> {
    let params = new HttpParams();

    if (filters.categoryId) {
      params = params.set('category_id', filters.categoryId);
    }

    if (filters.inStock) {
      params = params.set('in_stock', 1);
    }

    return this.http
      .get<{ products: Product[] }>(`${API_URL}/products`, { params })
      .pipe(map((res) => res.products));
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<{ product: Product }>(`${API_URL}/products/${id}`).pipe(map((res) => res.product));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<{ categories: Category[] }>(`${API_URL}/categories`).pipe(map((res) => res.categories));
  }

  getMaterials(): Observable<Material[]> {
    return this.http.get<{ materials: Material[] }>(`${API_URL}/materials`).pipe(map((res) => res.materials));
  }

  getProvinces(): Observable<Province[]> {
    return this.http.get<{ provinces: Province[] }>(`${API_URL}/provinces`).pipe(map((res) => res.provinces));
  }

  getLocalities(provinceId?: number | null): Observable<Locality[]> {
    let params = new HttpParams();

    if (provinceId) {
      params = params.set('province_id', provinceId);
    }

    return this.http
      .get<{ localities: Locality[] }>(`${API_URL}/localities`, { params })
      .pipe(map((res) => res.localities));
  }
}
