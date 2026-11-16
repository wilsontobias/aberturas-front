import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';
import { trimValues } from '../../utils/trim';

const GOOGLE_ERRORS: Record<string, string> = {
  cancelled: 'Cancelaste el ingreso con Google.',
  state: 'El ingreso con Google venció. Probá de nuevo.',
  email: 'Tu cuenta de Google no tiene un email verificado.',
  inactive: 'Tu usuario está desactivado. Comunicate con un administrador.',
  not_configured: 'El ingreso con Google todavía no está configurado en el servidor.',
  failed: 'No se pudo ingresar con Google. Probá de nuevo.',
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  googleUrl = this.auth.googleLoginUrl;
  sending = signal(false);
  error = signal('');

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('google_error');

    if (reason) {
      this.error.set(GOOGLE_ERRORS[reason] ?? GOOGLE_ERRORS['failed']);
    }
  }

  /** Mensaje de error de un campo, solo después de que el usuario lo tocó. */
  errorOf(name: 'email' | 'password'): string {
    const control = this.form.controls[name];

    if (!control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return name === 'email' ? 'Ingresá tu email.' : 'Ingresá tu contraseña.';
    }

    return 'El email no es válido.';
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.sending.set(true);
    this.error.set('');

    this.auth.login(trimValues(this.form.getRawValue())).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo iniciar sesión. Revisá que la API esté encendida.');
        this.sending.set(false);
      },
    });
  }
}
