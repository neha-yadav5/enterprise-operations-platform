import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { OrgTitleStrategy } from './core/org-title.strategy';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    // Required by Angular Material's ripples and overlay transitions. The
    // async provider keeps the animations bundle out of the initial payload
    // and is the SSR-safe variant.
    provideAnimationsAsync(),
    // Appends the organisation name to every route title.
    { provide: TitleStrategy, useClass: OrgTitleStrategy },
  ],
};
