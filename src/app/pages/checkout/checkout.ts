import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Locality, Order, Province } from '../../core/models';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { CatalogService } from '../../services/catalog';
import { OrderService } from '../../services/orders';
import { trimValues } from '../../utils/trim';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder);
  private catalog = inject(CatalogService);
  private orders = inject(OrderService);

  auth = inject(AuthService);
  cart = inject(CartService);

  provinces = signal<Province[]>([]);
  localities = signal<Locality[]>([]);

  sending = signal(false);
  error = signal('');
  serverErrors = signal<Record<string, string[]>>({});
  createdOrder = signal<Order | null>(null);

  form = this.fb.group({
    province_id: this.fb.control<number | null>(null, Validators.required),
    locality_id: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    street: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(120),
      Validators.pattern(/^[\p{L}\d\s.'°,-]+$/u),
    ]),
    street_number: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(/^[\p{L}\d\s\/.-]+$/u),
    ]),
    address_notes: this.fb.nonNullable.control('', Validators.maxLength(255)),
  });

  ngOnInit(): void {
    this.catalog.getProvinces().subscribe({
      next: (provinces) => this.provinces.set(provinces),
      error: () => this.error.set('No se pudieron cargar las provincias. Revisá que la API esté encendida.'),
    });

    this.form.controls.province_id.valueChanges.subscribe((provinceId) => this.loadLocalities(provinceId));

    this.prefillFromProfile();
  }

  /** Si el cliente ya cargó su localidad al registrarse, se la proponemos como dirección de entrega. */
  private prefillFromProfile(): void {
    const localityId = this.auth.user()?.customer_profile?.locality_id;

    if (!localityId) {
      return;
    }

    this.catalog.getLocalities().subscribe({
      next: (all) => {
        const locality = all.find((l) => l.id === localityId);

        if (!locality) {
          return;
        }

        this.form.controls.province_id.setValue(locality.province_id, { emitEvent: false });
        this.localities.set(all.filter((l) => l.province_id === locality.province_id));
        this.form.controls.locality_id.enable();
        this.form.controls.locality_id.setValue(locality.id);
      },
    });
  }

  private loadLocalities(provinceId: number | null): void {
    const control = this.form.controls.locality_id;

    control.setValue(null);
    this.localities.set([]);

    if (!provinceId) {
      control.disable();
      return;
    }

    control.enable();
    this.catalog.getLocalities(provinceId).subscribe({
      next: (localities) => this.localities.set(localities),
    });
  }

  /** Primer mensaje de error de un campo (de las validaciones locales o de la API). */
  errorOf(name: 'province_id' | 'locality_id' | 'street' | 'street_number' | 'address_notes'): string {
    const control = this.form.controls[name];
    const server = this.serverErrors()[name]?.[0];

    if (server) {
      return server;
    }

    if (!control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      if (name === 'province_id') {
        return 'Elegí una provincia.';
      }

      return name === 'locality_id' ? 'Elegí una localidad.' : 'Este dato es obligatorio.';
    }

    if (control.errors['pattern']) {
      return 'Hay caracteres que no se pueden usar.';
    }

    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    }

    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.cart.lines().length === 0) {
      return;
    }

    this.sending.set(true);
    this.error.set('');
    this.serverErrors.set({});

    const value = trimValues(this.form.getRawValue());

    this.orders
      .createOrder({
        items: this.cart.lines().map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        locality_id: value.locality_id as number,
        street: value.street,
        street_number: value.street_number,
        address_notes: value.address_notes || null,
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.createdOrder.set(order);
          this.sending.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'No se pudo crear el pedido. Revisá que la API esté encendida.');
          this.serverErrors.set(err.error?.errors ?? {});
          this.sending.set(false);
        },
      });
  }
}
