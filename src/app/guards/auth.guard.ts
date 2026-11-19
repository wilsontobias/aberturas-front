import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Permissions } from '../core/models';
import { AuthService } from '../services/auth';

/** Solo para usuarios con sesión iniciada. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Solo para vendedores y administradores. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isStaff() ? true : router.createUrlTree(['/']);
};

/** Solo para administradores. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAdmin() ? true : router.createUrlTree(['/']);
};

/** Para login y registro: si ya hay sesión, se vuelve al inicio. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn() ? router.createUrlTree(['/']) : true;
};

/** Los clientes necesitan tener sus datos cargados para pedir (los que entran con Google empiezan sin ellos). */
export const profileGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isCustomer = auth.typeName() === 'customer';

  if (isCustomer && !auth.user()?.customer_profile) {
    return router.createUrlTree(['/complete-profile'], { queryParams: { returnUrl: state.url } });
  }

  return true;
};

/** Solo para usuarios que tengan el permiso indicado (los administradores pasan siempre). */
export const permissionGuard =
  (permission: keyof Permissions): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.user() === null || auth.can(permission) ? true : router.createUrlTree(['/']);
  };
