import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get allowed roles from route data
  const allowedRoles = route.data['roles'] as number[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    // No roles specified, allow access
    return true;
  }

  if (authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  // User doesn't have required role, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};
