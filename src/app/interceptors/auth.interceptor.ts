import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../core/config';
import { AuthService } from '../services/auth';

/**
 * Agrega a cada pedido a la API el token (Authorization: Bearer ...) y Accept: application/json.
 * Si la API responde 401 estando logueado, el token venció: se cierra la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.token();

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    catchError((error) => {
      if (error.status === 401 && token) {
        auth.clearSession(true);
      }

      return throwError(() => error);
    }),
  );
};
