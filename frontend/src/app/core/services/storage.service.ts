import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'fodaf_token';
  private readonly USER_KEY = 'fodaf_user';

  // Token methods
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User methods
  getUser<T>(): T | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (user) {
      try {
        return JSON.parse(user) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  setUser<T>(user: T): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Generic methods
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    }
    return null;
  }

  set(key: string, value: unknown): void {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // Session storage methods (for temporary data)
  sessionGet<T>(key: string): T | null {
    const item = sessionStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    }
    return null;
  }

  sessionSet(key: string, value: unknown): void {
    if (typeof value === 'string') {
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }

  sessionRemove(key: string): void {
    sessionStorage.removeItem(key);
  }

  sessionClear(): void {
    sessionStorage.clear();
  }
}
