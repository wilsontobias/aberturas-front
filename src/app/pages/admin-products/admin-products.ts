import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Category, Product } from '../../core/models';
import { AdminService, ProductData } from '../../services/admin';
import { CatalogService, Material } from '../../services/catalog';
import { productImage } from '../../utils/product-image';

@Component({
  selector: 'app-admin-products',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './admin-products.html',
})
export class AdminProducts implements OnInit {
  private admin = inject(AdminService);
  private catalog = inject(CatalogService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  materials = signal<Material[]>([]);

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  ok = signal('');
  formError = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);
  deactivatingId = signal<number | null>(null);
  inactive = signal<Product[]>([]);
  showInactive = signal(false);

  imageOf = productImage;

  form = this.fb.group({
    category_id: [null as number | null, [Validators.required]],
    material_id: [null as number | null, [Validators.required]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    width_cm: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    height_cm: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    color: ['', [Validators.maxLength(50)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    stock: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    image: ['', [Validators.maxLength(255), Validators.pattern(/^(https?:\/\/|\/).*/)]],
  });

  ngOnInit(): void {
    forkJoin({
      categories: this.catalog.getCategories(),
      materials: this.catalog.getMaterials(),
    }).subscribe({
      next: (data) => {
        this.categories.set(data.categories);
        this.materials.set(data.materials);
        this.load();
        this.loadInactive();
      },
      error: () => {
        this.error.set('No se pudieron cargar las categorías y materiales.');
        this.loading.set(false);
      },
    });
  }

  load(afterLoad?: () => void): void {
    this.catalog.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
        afterLoad?.();
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      },
    });
  }

  loadInactive(): void {
    this.admin.getInactiveProducts().subscribe({
      next: (products) => this.inactive.set(products),
      error: () => this.inactive.set([]),
    });
  }

  toggleInactive(): void {
    this.showInactive.update((v) => !v);
    this.ok.set('');
  }

  reactivate(product: Product): void {
    this.admin.reactivateProduct(product.id).subscribe({
      next: () => {
        this.loadInactive();
        this.load(() => this.ok.set('Producto reactivado. Ya aparece en el catálogo.'));
      },
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo reactivar el producto.'),
    });
  }

  categoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name ?? '';
  }

  materialName(id: number): string {
    return this.materials().find((m) => m.id === id)?.name ?? '';
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];

    return control.invalid && (control.touched || control.dirty);
  }

  newProduct(): void {
    this.editingId.set(null);
    this.form.reset({ description: '', color: '', image: '' });
    this.formError.set('');
    this.ok.set('');
    this.showForm.set(true);
  }

  edit(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({
      category_id: product.category_id,
      material_id: product.material_id,
      name: product.name,
      description: product.description ?? '',
      width_cm: product.width_cm,
      height_cm: product.height_cm,
      color: product.color ?? '',
      price: Number(product.price),
      stock: product.stock,
      image: product.image ?? '',
    });
    this.formError.set('');
    this.ok.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const v = this.form.getRawValue();
    const data: ProductData = {
      category_id: Number(v.category_id),
      material_id: Number(v.material_id),
      name: (v.name ?? '').trim(),
      description: v.description?.trim() ? v.description.trim() : null,
      width_cm: Number(v.width_cm),
      height_cm: Number(v.height_cm),
      color: v.color?.trim() ? v.color.trim() : null,
      price: Number(v.price),
      stock: Number(v.stock),
      image: v.image?.trim() ? v.image.trim() : null,
    };

    const id = this.editingId();
    const request = id ? this.admin.updateProduct(id, data) : this.admin.createProduct(data);

    this.saving.set(true);
    this.formError.set('');

    request.subscribe({
      next: () => {
        this.load(() => {
          this.saving.set(false);
          this.closeForm();
          this.ok.set(id ? 'Producto actualizado.' : 'Producto creado.');
        });
      },
      error: (err) => {
        const first = err.error?.errors ? (Object.values(err.error.errors)[0] as string[])[0] : null;

        this.formError.set(first ?? err.error?.message ?? 'No se pudo guardar el producto.');
        this.saving.set(false);
      },
    });
  }

  askDeactivate(product: Product): void {
    this.ok.set('');
    this.deactivatingId.set(product.id);
  }

  deactivate(product: Product): void {
    this.admin.deactivateProduct(product.id).subscribe({
      next: () => {
        this.deactivatingId.set(null);
        this.loadInactive();
        this.load(() => this.ok.set('Producto desactivado. Ya no aparece en el catálogo.'));
      },
      error: (err) => {
        this.deactivatingId.set(null);
        this.error.set(err.error?.message ?? 'No se pudo desactivar el producto.');
      },
    });
  }
}
