import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { API_URL } from '../core/config';
import { Permissions, User } from '../core/models';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  locality_id: number;
  phone_1: string;
  phone_2: string;
}

export interface ProfileData {
  first_name: string;
  last_name: string;
  locality_id: number;
  phone_1: string;
  phone_2: string;
}

interface AuthResponse {
  message: string;
  access_token: string;
  user: User;
}

interface MeResponse {
  message: string;
  user: User;
}

const TOKEN_KEY = 'aberturas_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(this.readToken());
  readonly user = signal<User | null>(null);

  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly roleName = computed(() => this.user()?.user_role?.role?.name ?? null);
  readonly typeName = computed(() => this.user()?.user_role?.user_type?.name ?? null);
  readonly isAdmin = computed(() => this.roleName() === 'SuperAdmin' || this.roleName() === 'Administrator');
  readonly isSuperAdmin = computed(() => this.roleName() === 'SuperAdmin');
  readonly isStaff = computed(() => this.isAdmin() || this.typeName() === 'seller');

  /** Los administradores pasan siempre; el resto necesita tener el permiso activado. */
  can(permission: keyof Permissions): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return this.user()?.user_permission?.[permission] === true;
  }

  login(data: LoginData): Observable<User> {
    return this.http.post<AuthResponse>(`${API_URL}/login`, data).pipe(
      tap((res) => this.saveToken(res.access_token)),
      switchMap(() => this.loadUser()),
    );
  }

  register(data: RegisterData): Observable<User> {
    return this.http.post<AuthResponse>(`${API_URL}/register`, data).pipe(
      tap((res) => this.saveToken(res.access_token)),
      switchMap(() => this.loadUser()),
    );
  }

  /** Dirección de la API que manda al usuario a Google (se abre con el navegador, no con HttpClient). */
  readonly googleLoginUrl = `${API_URL}/auth/google/redirect`;

  /** Cambia el código de un solo uso que dejó la API por la sesión. */
  exchangeGoogleCode(code: string): Observable<User> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/google/exchange`, { code }).pipe(
      tap((res) => this.saveToken(res.access_token)),
      switchMap(() => this.loadUser()),
    );
  }

  /** Completa o actualiza el perfil de cliente (nombre, localidad, teléfonos). */
  saveProfile(data: ProfileData): Observable<User> {
    return this.http.put<MeResponse>(`${API_URL}/me/profile`, data).pipe(
      map((res) => res.user),
      tap((user) => this.user.set(user)),
    );
  }

  /** Pide los datos del usuario (con sus permisos) a la API. */
  loadUser(): Observable<User> {
    return this.http.get<MeResponse>(`${API_URL}/me`).pipe(
      map((res) => res.user),
      tap((user) => this.user.set(user)),
    );
  }

  /** Se ejecuta al abrir la página: si hay un token guardado, recupera la sesión. */
  restoreSession(): Observable<unknown> {
    if (!this.token()) {
      return of(null);
    }

    return this.loadUser().pipe(catchError(() => of(null)));
  }

  logout(): void {
    this.http.post(`${API_URL}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  /** Borra la sesión local. Si la API dijo 401 (token vencido), también manda al login. */
  clearSession(goToLogin = false): void {
    this.token.set(null);
    this.user.set(null);

    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // sin acceso al almacenamiento: la sesión queda solo en memoria
    }

    if (goToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private saveToken(token: string): void {
    this.token.set(token);

    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // sin acceso al almacenamiento: la sesión queda solo en memoria
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
