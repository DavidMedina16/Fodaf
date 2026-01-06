import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = computed(() => this.toastsSignal());

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  show(toast: Omit<Toast, 'id'>): string {
    const id = this.generateId();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };

    this.toastsSignal.update(toasts => [...toasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.dismiss(id), newToast.duration);
    }

    return id;
  }

  success(message: string, title?: string): string {
    return this.show({ type: 'success', message, title });
  }

  error(message: string, title?: string): string {
    return this.show({ type: 'error', message, title, duration: 8000 });
  }

  warning(message: string, title?: string): string {
    return this.show({ type: 'warning', message, title });
  }

  info(message: string, title?: string): string {
    return this.show({ type: 'info', message, title });
  }

  dismiss(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toastsSignal.set([]);
  }
}
