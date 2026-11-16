import { ApplicationConfig, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    // Antes de mostrar la página, recupera la sesión si hay un token guardado.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};
