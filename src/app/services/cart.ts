import { Injectable, computed, signal } from '@angular/core';

import { Product } from '../core/models';

export interface CartLine {
  product: Product;
  quantity: number;
}

const CART_KEY = 'aberturas_cart';
const MAX_QUANTITY = 100;

/**
 * Carrito de compras. Vive en el navegador (localStorage); la API recién se entera
 * cuando el cliente confirma el pedido, y ahí recalcula precios, stock y seña.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  readonly lines = signal<CartLine[]>(this.read());

  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() => this.lines().reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0));

  /** Si algún producto no alcanza con el stock, ese pedido incluye fabricación. */
  readonly requiresManufacturing = computed(() => this.lines().some((line) => line.product.stock < line.quantity));
  readonly depositPercentage = computed(() => (this.requiresManufacturing() ? 50 : 10));
  readonly depositAmount = computed(() => Math.round(this.total() * this.depositPercentage()) / 100);
  readonly balanceAmount = computed(() => this.total() - this.depositAmount());

  add(product: Product, quantity = 1): void {
    const lines = [...this.lines()];
    const existing = lines.find((line) => line.product.id === product.id);

    if (existing) {
      existing.quantity = this.clamp(existing.quantity + quantity);
      existing.product = product;
    } else {
      lines.push({ product, quantity: this.clamp(quantity) });
    }

    this.save(lines);
  }

  setQuantity(productId: number, quantity: number): void {
    const lines = this.lines().map((line) =>
      line.product.id === productId ? { ...line, quantity: this.clamp(quantity) } : line,
    );

    this.save(lines);
  }

  remove(productId: number): void {
    this.save(this.lines().filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.save([]);
  }

  private clamp(quantity: number): number {
    const value = Math.floor(Number(quantity));

    if (!Number.isFinite(value) || value < 1) {
      return 1;
    }

    return Math.min(value, MAX_QUANTITY);
  }

  private save(lines: CartLine[]): void {
    this.lines.set(lines);

    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      // sin acceso al almacenamiento: el carrito queda solo en memoria
    }
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
