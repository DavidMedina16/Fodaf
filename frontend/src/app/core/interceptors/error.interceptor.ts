import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { ApiError } from '../models/api-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        const apiError = error.error as ApiError;

        switch (error.status) {
          case 401:
            // Unauthorized - clear session and redirect to login
            storage.removeToken();
            storage.removeUser();
            router.navigate(['/auth/login']);
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
            break;

          case 403:
            errorMessage = 'No tienes permisos para realizar esta acción.';
            break;

          case 404:
            errorMessage = 'Recurso no encontrado.';
            break;

          case 422:
            // Validation errors
            if (Array.isArray(apiError?.message)) {
              errorMessage = apiError.message.join(', ');
            } else {
              errorMessage = apiError?.message || 'Error de validación.';
            }
            break;

          case 500:
            errorMessage = 'Error interno del servidor. Intenta más tarde.';
            break;

          default:
            if (apiError?.message) {
              errorMessage = Array.isArray(apiError.message)
                ? apiError.message.join(', ')
                : apiError.message;
            }
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
      });

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );
};
