import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

/** Pantalla a la que vuelve la API después de Google: cambia el código por la sesión. */
@Component({
  selector: 'app-google-callback',
  imports: [RouterLink],
  templateUrl: './google-callback.html',
})
export class GoogleCallback implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  error = signal('');

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.error.set('No llegó el código de ingreso. Probá de nuevo.');
      return;
    }

    this.auth.exchangeGoogleCode(code).subscribe({
      next: (user) => {
        // Cliente nuevo (o sin datos cargados): primero completa su perfil.
        const needsProfile = user.user_role?.user_type?.name === 'customer' && !user.customer_profile;
        this.router.navigateByUrl(needsProfile ? '/complete-profile' : '/', { replaceUrl: true });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo ingresar con Google. Revisá que la API esté encendida.');
      },
    });
  }
}
