import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Locality, Province } from '../../core/models';
import { AuthService } from '../../services/auth';
import { CatalogService } from '../../services/catalog';
import { trimValues } from '../../utils/trim';

type Field = 'province_id' | 'first_name' | 'last_name' | 'locality_id' | 'phone_1' | 'phone_2';

/** Los clientes que entran con Google todavía no tienen perfil: lo completan acá. */
@Component({
  selector: 'app-complete-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './complete-profile.html',
})
export class CompleteProfile implements OnInit {
  private auth = inject(AuthService);
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  provinces = signal<Province[]>([]);
  localities = signal<Locality[]>([]);

  sending = signal(false);
  error = signal('');
  serverErrors = signal<Record<string, string[]>>({});

  private namePattern = /^[\p{L}\s'-]+$/u;
  private phonePattern = /^[\d\s()+-]+$/;

  form = this.fb.group({
    first_name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100), Validators.pattern(this.namePattern)]),
    last_name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100), Validators.pattern(this.namePattern)]),
    province_id: this.fb.control<number | null>(null, Validators.required),
    locality_id: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    phone_1: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(30), Validators.pattern(this.phonePattern)]),
    phone_2: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(30), Validators.pattern(this.phonePattern)]),
  });

  ngOnInit(): void {
    // Con el nombre que viene de Google se adelanta lo que se pueda.
    const [first, ...rest] = (this.auth.user()?.name ?? '').trim().split(/\s+/);
    this.form.patchValue({ first_name: first ?? '', last_name: rest.join(' ') });

    this.catalog.getProvinces().subscribe({
      next: (provinces) => this.provinces.set(provinces),
      error: () => this.error.set('No se pudieron cargar las provincias. Revisá que la API esté encendida.'),
    });

    this.form.controls.province_id.valueChanges.subscribe((provinceId) => {
      const locality = this.form.controls.locality_id;

      locality.setValue(null);
      this.localities.set([]);

      if (!provinceId) {
        locality.disable();
        return;
      }

      locality.enable();
      this.catalog.getLocalities(provinceId).subscribe({
        next: (localities) => this.localities.set(localities),
      });
    });
  }

  errorOf(name: Field): string {
    const server = this.serverErrors()[name]?.[0];

    if (server) {
      return server;
    }

    const control = this.form.controls[name];

    if (!control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      if (name === 'province_id') {
        return 'Elegí una provincia.';
      }

      return name === 'locality_id' ? 'Elegí una localidad.' : 'Este dato es obligatorio.';
    }

    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    }

    if (control.errors['pattern']) {
      return name === 'phone_1' || name === 'phone_2'
        ? 'Usá solo números, espacios, paréntesis, + y guiones.'
        : 'Hay caracteres que no se pueden usar.';
    }

    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.sending.set(true);
    this.error.set('');
    this.serverErrors.set({});

    const { province_id, ...rest } = this.form.getRawValue();
    void province_id;

    const data = { ...trimValues(rest), locality_id: rest.locality_id as number };

    this.auth.saveProfile(data).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron guardar tus datos. Revisá que la API esté encendida.');
        this.serverErrors.set(err.error?.errors ?? {});
        this.sending.set(false);
      },
    });
  }
}
