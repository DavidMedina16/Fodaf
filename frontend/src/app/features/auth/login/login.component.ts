import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, StorageService } from '@core/services';
import { ButtonComponent, InputComponent, FormFieldComponent } from '@shared/components';
import { ToastService } from '@shared/services/toast.service';

const REMEMBER_EMAIL_KEY = 'fodaf_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    FormFieldComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  error = signal<string>('');
  rememberMe = signal<boolean>(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const savedEmail = this.storage.get<string>(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      this.form.patchValue({ email: savedEmail });
      this.rememberMe.set(true);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;

    if (this.rememberMe()) {
      this.storage.set(REMEMBER_EMAIL_KEY, email!);
    } else {
      this.storage.remove(REMEMBER_EMAIL_KEY);
    }

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.toast.success('Bienvenido al sistema', 'Inicio de sesión exitoso');
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.handleLoginError(err);
        this.loading.set(false);
      }
    });
  }

  private handleLoginError(err: HttpErrorResponse): void {
    const errorMessages: Record<number, string> = {
      401: 'Credenciales incorrectas. Verifica tu email y contraseña.',
      403: 'Tu cuenta está desactivada. Contacta al administrador.',
      429: 'Demasiados intentos. Espera unos minutos.',
      500: 'Error del servidor. Intenta más tarde.',
      0: 'Sin conexión a internet. Verifica tu red.'
    };

    const message = errorMessages[err.status] || 'Error al iniciar sesión. Intenta de nuevo.';
    this.error.set(message);
  }

  toggleRememberMe(): void {
    this.rememberMe.update(value => !value);
  }

  getFieldError(fieldName: 'email' | 'password'): string {
    const field = this.form.get(fieldName);
    if (!field?.touched || !field?.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Ingresa un email válido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;

    return '';
  }
}
