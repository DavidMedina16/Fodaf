import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  CardComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  FormFieldComponent,
  LoadingSpinnerComponent,
} from '@shared/components';
import { ToastService } from '@shared/services/toast.service';
import { LoansService } from '../services/loans.service';
import { MembersService } from '@features/members/services/members.service';
import { User } from '@core/models/user.model';
import { CreditLimitInfo, LoanCalculation } from '@core/models/loan.model';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    FormFieldComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <button class="back-button" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="page__header-content">
          <h1 class="page__title">Solicitar prestamo</h1>
          <p class="page__subtitle">Completa el formulario para solicitar un prestamo</p>
        </div>
      </header>

      <div class="layout">
        <!-- Form Card -->
        <app-card class="form-card">
          <h2 class="card-title">Datos del prestamo</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <app-form-field
                label="Miembro"
                [required]="true"
                [error]="getFieldError('userId')"
              >
                <app-select
                  formControlName="userId"
                  placeholder="Selecciona un miembro"
                  [options]="memberOptions()"
                  (selectionChange)="onMemberChange($event)"
                ></app-select>
              </app-form-field>

              <app-form-field
                label="Monto solicitado"
                [required]="true"
                [error]="getFieldError('amount')"
              >
                <app-input
                  type="number"
                  formControlName="amount"
                  placeholder="0"
                  [min]="1"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Tasa de interes (% mensual)"
                [required]="true"
                [error]="getFieldError('interestRate')"
              >
                <app-input
                  type="number"
                  formControlName="interestRate"
                  placeholder="2"
                  [min]="0"
                  [max]="100"
                  [step]="0.1"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Plazo (meses)"
                [required]="true"
                [error]="getFieldError('termMonths')"
              >
                <app-select
                  formControlName="termMonths"
                  [options]="termOptions"
                ></app-select>
              </app-form-field>
            </div>

            <!-- Credit Limit Info -->
            @if (creditLimit()) {
              <div class="credit-info" [class.credit-info--warning]="!creditLimit()?.canRequestLoan">
                <div class="credit-info__header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Informacion de credito</span>
                </div>
                <div class="credit-info__content">
                  <div class="credit-info__row">
                    <span>Total aportes:</span>
                    <strong>{{ formatCurrency(creditLimit()?.totalContributions || 0) }}</strong>
                  </div>
                  <div class="credit-info__row">
                    <span>Limite de credito:</span>
                    <strong>{{ formatCurrency(creditLimit()?.creditLimit || 0) }}</strong>
                  </div>
                  <div class="credit-info__row">
                    <span>Prestamos activos:</span>
                    <strong>{{ formatCurrency(creditLimit()?.activeLoansAmount || 0) }}</strong>
                  </div>
                  <div class="credit-info__row credit-info__row--highlight">
                    <span>Credito disponible:</span>
                    <strong>{{ formatCurrency(creditLimit()?.availableCredit || 0) }}</strong>
                  </div>
                  @if (!creditLimit()?.canRequestLoan) {
                    <div class="credit-info__warnings">
                      @for (reason of creditLimit()?.reasons; track reason) {
                        <p class="credit-info__warning">{{ reason }}</p>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <div class="form-actions">
              <app-button
                variant="outline"
                type="button"
                (click)="goBack()"
              >
                Cancelar
              </app-button>
              <app-button
                variant="primary"
                type="submit"
                [loading]="saving()"
                [disabled]="form.invalid || saving() || !creditLimit()?.canRequestLoan || isAmountExceeded()"
              >
                Solicitar prestamo
              </app-button>
            </div>
          </form>
        </app-card>

        <!-- Calculator Card -->
        <div class="calculator-section">
          <app-card class="calculator-card">
            <h2 class="card-title">Calculadora</h2>

            @if (loadingCalculation()) {
              <div class="loading-container">
                <app-loading-spinner text="Calculando..."></app-loading-spinner>
              </div>
            } @else if (calculation()) {
              <div class="calculator-results">
                <div class="result-item result-item--primary">
                  <span class="result-label">Cuota mensual</span>
                  <span class="result-value">{{ formatCurrency(calculation()?.monthlyPayment || 0) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Total a pagar</span>
                  <span class="result-value">{{ formatCurrency(calculation()?.totalAmount || 0) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Total intereses</span>
                  <span class="result-value">{{ formatCurrency(calculation()?.totalInterest || 0) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Monto solicitado</span>
                  <span class="result-value">{{ formatCurrency(form.get('amount')?.value || 0) }}</span>
                </div>
              </div>
            } @else {
              <p class="calculator-empty">Ingresa los datos para ver el calculo</p>
            }
          </app-card>

          <!-- Amortization Preview -->
          @if (calculation()?.amortizationSchedule?.length) {
            <app-card class="amortization-card">
              <h2 class="card-title">Vista previa de cuotas</h2>
              <div class="amortization-table-container">
                <table class="amortization-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Capital</th>
                      <th>Interes</th>
                      <th>Cuota</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of calculation()?.amortizationSchedule?.slice(0, 6); track row.installmentNumber) {
                      <tr>
                        <td>{{ row.installmentNumber }}</td>
                        <td>{{ formatCurrency(row.amountCapital) }}</td>
                        <td>{{ formatCurrency(row.amountInterest) }}</td>
                        <td>{{ formatCurrency(row.totalAmount) }}</td>
                        <td>{{ formatCurrency(row.remainingBalance) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if ((calculation()?.amortizationSchedule?.length || 0) > 6) {
                  <p class="amortization-note">
                    ... y {{ (calculation()?.amortizationSchedule?.length || 0) - 6 }} cuotas mas
                  </p>
                }
              </div>
            </app-card>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .page {
      &__header {
        display: flex;
        align-items: flex-start;
        gap: $spacing-4;
        margin-bottom: $spacing-6;
      }

      &__header-content {
        flex: 1;
      }

      &__title {
        font-size: $font-size-2xl;
        font-weight: 700;
        margin: 0 0 $spacing-1;
      }

      &__subtitle {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin: 0;
      }
    }

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid $border-color;
      border-radius: $border-radius-md;
      background: $bg-card;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: $bg-body;
        color: $text-primary;
      }
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: $spacing-6;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .card-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0 0 $spacing-5;
      padding-bottom: $spacing-4;
      border-bottom: 1px solid $border-color;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-5;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .credit-info {
      margin-top: $spacing-6;
      padding: $spacing-4;
      background: rgba($primary, 0.05);
      border-radius: $border-radius-md;
      border: 1px solid rgba($primary, 0.2);

      &--warning {
        background: rgba($danger, 0.05);
        border-color: rgba($danger, 0.2);

        .credit-info__header {
          color: $danger;
        }
      }

      &__header {
        display: flex;
        align-items: center;
        gap: $spacing-2;
        font-weight: 600;
        margin-bottom: $spacing-3;
        color: $primary;
      }

      &__content {
        display: flex;
        flex-direction: column;
        gap: $spacing-2;
      }

      &__row {
        display: flex;
        justify-content: space-between;
        font-size: $font-size-sm;

        &--highlight {
          margin-top: $spacing-2;
          padding-top: $spacing-2;
          border-top: 1px dashed $border-color;
          font-weight: 600;
        }
      }

      &__warnings {
        margin-top: $spacing-3;
        padding-top: $spacing-3;
        border-top: 1px solid rgba($danger, 0.2);
      }

      &__warning {
        font-size: $font-size-sm;
        color: $danger;
        margin: 0 0 $spacing-1;

        &::before {
          content: "• ";
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-3;
      margin-top: $spacing-8;
      padding-top: $spacing-6;
      border-top: 1px solid $border-color;
    }

    .calculator-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: $spacing-8;
    }

    .calculator-results {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-3;
      background: $bg-body;
      border-radius: $border-radius-md;

      &--primary {
        background: rgba($primary, 0.1);

        .result-value {
          color: $primary;
          font-size: $font-size-xl;
        }
      }
    }

    .result-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .result-value {
      font-weight: 600;
    }

    .calculator-empty {
      text-align: center;
      color: $text-secondary;
      padding: $spacing-8;
    }

    .amortization-table-container {
      overflow-x: auto;
    }

    .amortization-table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;

      th, td {
        padding: $spacing-2 $spacing-3;
        text-align: right;
        border-bottom: 1px solid $border-color;

        &:first-child {
          text-align: center;
          width: 40px;
        }
      }

      th {
        font-weight: 600;
        color: $text-secondary;
        background: $bg-body;
      }

      td {
        font-family: $font-family-mono;
      }
    }

    .amortization-note {
      text-align: center;
      color: $text-secondary;
      font-size: $font-size-sm;
      margin: $spacing-3 0 0;
    }
  `]
})
export class LoanRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly loansService = inject(LoansService);
  private readonly membersService = inject(MembersService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  members = signal<User[]>([]);
  creditLimit = signal<CreditLimitInfo | null>(null);
  calculation = signal<LoanCalculation | null>(null);
  loadingCalculation = signal(false);
  saving = signal(false);

  memberOptions = computed(() =>
    this.members().map(m => ({
      value: String(m.id),
      label: `${m.firstName} ${m.lastName}`
    }))
  );

  termOptions = [
    { value: '3', label: '3 meses' },
    { value: '6', label: '6 meses' },
    { value: '12', label: '12 meses' },
    { value: '18', label: '18 meses' },
    { value: '24', label: '24 meses' },
    { value: '36', label: '36 meses' },
  ];

  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    amount: ['', [Validators.required, Validators.min(1)]],
    interestRate: [2, [Validators.required, Validators.min(0), Validators.max(100)]],
    termMonths: ['12', [Validators.required]],
  });

  private calculationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const amount = this.form.get('amount')?.value;
      const interestRate = this.form.get('interestRate')?.value;
      const termMonths = this.form.get('termMonths')?.value;

      if (amount > 0 && interestRate >= 0 && termMonths > 0) {
        this.debounceCalculation(Number(amount), Number(interestRate), Number(termMonths));
      } else {
        this.calculation.set(null);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadMembers();

    this.form.valueChanges.subscribe(() => {
      const amount = this.form.get('amount')?.value;
      const interestRate = this.form.get('interestRate')?.value;
      const termMonths = this.form.get('termMonths')?.value;

      if (amount > 0 && interestRate >= 0 && termMonths > 0) {
        this.debounceCalculation(Number(amount), Number(interestRate), Number(termMonths));
      } else {
        this.calculation.set(null);
      }
    });
  }

  loadMembers(): void {
    this.membersService.getMembers({ limit: 100, isActive: true }).subscribe({
      next: (response) => {
        this.members.set(response.data);

        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.form.patchValue({ userId: String(currentUser.id) });
          this.loadCreditLimit(currentUser.id);
        }
      },
      error: () => this.toast.error('Error al cargar los miembros')
    });
  }

  onMemberChange(value: string | number): void {
    const userId = Number(value);
    if (userId) {
      this.loadCreditLimit(userId);
    }
  }

  loadCreditLimit(userId: number): void {
    this.loansService.getCreditLimit(userId).subscribe({
      next: (limit) => this.creditLimit.set(limit),
      error: () => this.toast.error('Error al cargar el limite de credito')
    });
  }

  private debounceCalculation(amount: number, interestRate: number, termMonths: number): void {
    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }

    this.calculationTimeout = setTimeout(() => {
      this.loadingCalculation.set(true);

      this.loansService.simulateLoan(amount, interestRate, termMonths).subscribe({
        next: (calc) => {
          this.calculation.set(calc);
          this.loadingCalculation.set(false);
        },
        error: () => {
          this.loadingCalculation.set(false);
        }
      });
    }, 300);
  }

  isAmountExceeded(): boolean {
    const amount = this.form.get('amount')?.value || 0;
    const available = this.creditLimit()?.availableCredit || 0;
    return amount > available;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.creditLimit()?.canRequestLoan || this.isAmountExceeded()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;
    const data = {
      userId: Number(formValue.userId),
      amount: Number(formValue.amount),
      interestRate: Number(formValue.interestRate),
      termMonths: Number(formValue.termMonths),
    };

    this.loansService.createLoan(data).subscribe({
      next: () => {
        this.toast.success('Solicitud de prestamo creada correctamente');
        this.router.navigate(['/loans']);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Error al crear la solicitud';
        this.toast.error(message);
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['min']) return `El valor minimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `El valor maximo es ${control.errors['max'].max}`;

    return '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }
}
