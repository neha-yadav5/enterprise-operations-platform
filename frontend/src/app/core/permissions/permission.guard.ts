import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Permission } from './permission.model';
import { PermissionService } from './permission.service';

/**
 * Route guard driven by `data.permission` on the route.
 *
 * Redirects to /403 rather than to the dashboard, because silently bouncing
 * someone somewhere else reads as a broken link. The PRD is explicit that
 * hiding navigation is not sufficient — a typed URL has to be answered too.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const required = route.data['permission'] as Permission | Permission[] | undefined;
  if (!required) return true;

  const permissions = inject(PermissionService);
  const router = inject(Router);

  const list = Array.isArray(required) ? required : [required];
  if (permissions.hasAny(list)) return true;

  return router.createUrlTree(['/403'], {
    queryParams: { from: route.routeConfig?.path ?? '' },
  });
};
