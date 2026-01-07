import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { LoginRequest, LoginResponse, TokenPayload } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  // Signals for reactive state
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userFullName = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);

    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.storage.setToken(response.accessToken);
        this.storage.setUser(response.user);
        this.currentUserSignal.set(response.user);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.storage.removeToken();
    this.storage.removeUser();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.storage.getToken();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    const payload = this.decodeToken(token);
    if (!payload) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  }

  hasRole(roleId: number): boolean {
    const user = this.currentUserSignal();
    return user?.roleId === roleId;
  }

  hasAnyRole(roleIds: number[]): boolean {
    const user = this.currentUserSignal();
    return user ? roleIds.includes(user.roleId) : false;
  }

  getProfile(): Observable<User> {
    return this.api.get<User>('/auth/profile').pipe(
      tap((user) => {
        this.storage.setUser(user);
        this.currentUserSignal.set(user);
      })
    );
  }

  private loadUserFromStorage(): void {
    const token = this.storage.getToken();
    if (token && this.isLoggedIn()) {
      const user = this.storage.getUser<User>();
      if (user) {
        this.currentUserSignal.set(user);
      }
    } else {
      // Clear invalid session
      this.storage.removeToken();
      this.storage.removeUser();
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as TokenPayload;
    } catch {
      return null;
    }
  }
}
