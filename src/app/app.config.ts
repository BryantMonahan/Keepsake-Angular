import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './services/auth-service';
import { NotificationService } from './services/notification-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const authService = inject(AuthService)
      const notificationService = inject(NotificationService)
      await authService.loadUser()
      notificationService.startPolling()
    })
  ]
};
