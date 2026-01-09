import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
import { InvestmentsService } from '../services/investments.service';
import { Investment, InvestmentSimulation } from '@core/models/investment.model';

@Component({
  selector: 'app-investment-form',
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
          <h1 class="page__title">{{ isEditMode() ? 'Editar' : 'Nueva' }} inversion CDT</h1>
          <p class="page__subtitle">{{ isEditMode() ? 'Modifica los datos de la inversion' : 'Registra un nuevo certificado de deposito' }}</p>
        </div>
      </header>

      @if (loadingInvestment()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando..."></app-loading-spinner>
          </div>
        </app-card>
      } @else {
        <div class="layout">
          <!-- Form Card -->
          <app-card class="form-card">
            <h2 class="card-title">Datos del CDT</h2>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-grid">
                <app-form-field
                  label="Entidad financiera"
                  [required]="true"
                  [error]="getFieldError('bankName')"
                >
                  <app-input
                    formControlName="bankName"
                    placeholder="Ej: Bancolombia, Davivienda..."
                  ></app-input>
                </app-form-field>

                <app-form-field
                  label="Monto a invertir"
                  [required]="true"
                  [error]="getFieldError('amountInvested')"
                >
                  <app-input
                    type="number"
                    formControlName="amountInvested"
                    placeholder="0"
                    [min]="1"
                  ></app-input>
                </app-form-field>

                <app-form-field
                  label="Tasa de interes (% anual)"
                  [required]="true"
                  [error]="getFieldError('interestRate')"
                >
                  <app-input
                    type="number"
                    formControlName="interestRate"
                    placeholder="Ej: 12.5"
                    [min]="0.01"
                    [max]="100"
                    [step]="0.01"
                  ></app-input>
                </app-form-field>

                <app-form-field
                  label="Plazo (dias)"
                  [required]="true"
                  [error]="getFieldError('termDays')"
                >
                  <app-select
                    formControlName="termDays"
                    [options]="termOptions"
                  ></app-select>
                </app-form-field>

                <app-form-field
                  label="Fecha de apertura"
                  [required]="true"
                  [error]="getFieldError('startDate')"
                >
                  <app-input
                    type="date"
                    formControlName="startDate"
                  ></app-input>
                </app-form-field>

                <app-form-field
                  label="Notas (opcional)"
                  class="full-width"
                >
                  <app-input
                    formControlName="notes"
                    placeholder="Observaciones adicionales..."
                  ></app-input>
                </app-form-field>
              </div>

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
                  [disabled]="form.invalid || saving()"
                >
                  {{ isEditMode() ? 'Guardar cambios' : 'Registrar inversion' }}
                </app-button>
              </div>
            </form>
          </app-card>

          <!-- Calculator Card -->
          <div class="calculator-section">
            <app-card class="calculator-card">
              <h2 class="card-title">Calculadora de rendimiento</h2>

              @if (loadingCalculation()) {
                <div class="loading-container">
                  <app-loading-spinner text="Calculando..."></app-loading-spinner>
                </div>
              } @else if (calculation()) {
                <div class="calculator-results">
                  <div class="result-item result-item--primary">
                    <span class="result-label">Total al vencimiento</span>
                    <span class="result-value">{{ formatCurrency(calculation()?.totalAtMaturity || 0) }}</span>
                  </div>
                  <div class="result-item result-item--success">
                    <span class="result-label">Rendimiento esperado</span>
                    <span class="result-value">{{ formatCurrency(calculation()?.expectedReturn || 0) }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Rendimiento mensual equiv.</span>
                    <span class="result-value">{{ formatCurrency(calculation()?.monthlyEquivalent || 0) }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Capital invertido</span>
                    <span class="result-value">{{ formatCurrency(calculation()?.amountInvested || 0) }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Tasa anual</span>
                    <span class="result-value">{{ calculation()?.interestRate?.toFixed(2) }}%</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Plazo</span>
                    <span class="result-value">{{ calculation()?.termDays }} dias</span>
                  </div>
                </div>
              } @else {
                <p class="calculator-empty">Ingresa los datos para ver el calculo de rendimiento</p>
              }
            </app-card>

            <!-- Info Card -->
            <app-card class="info-card">
              <div class="info-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div>
                  <strong>Calculo de interes simple</strong>
                  <p>El rendimiento se calcula usando la formula: <code>I = P x r x (d/365)</code></p>
                  <p>Donde P es el capital, r la tasa anual y d los dias.</p>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      }
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

      .full-width {
        grid-column: 1 / -1;
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
      gap: $spacing-3;
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

      &--success {
        background: rgba($success, 0.1);

        .result-value {
          color: $success;
          font-size: $font-size-lg;
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

    .info-card {
      .info-content {
        display: flex;
        gap: $spacing-3;
        color: $text-secondary;
        font-size: $font-size-sm;

        svg {
          flex-shrink: 0;
          color: $info;
        }

        strong {
          display: block;
          color: $text-primary;
          margin-bottom: $spacing-2;
        }

        p {
          margin: 0 0 $spacing-1;
        }

        code {
          background: $bg-body;
          padding: $spacing-1 $spacing-2;
          border-radius: $border-radius-sm;
          font-family: $font-family-mono;
          font-size: $font-size-xs;
        }
      }
    }
  `]
})
export class InvestmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly investmentsService = inject(InvestmentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // State
  isEditMode = signal(false);
  investmentId = signal<number | null>(null);
  loadingInvestment = signal(false);
  calculation = signal<InvestmentSimulation | null>(null);
  loadingCalculation = signal(false);
  saving = signal(false);

  termOptions = [
    { value: '30', label: '30 dias' },
    { value: '60', label: '60 dias' },
    { value: '90', label: '90 dias' },
    { value: '180', label: '180 dias' },
    { value: '360', label: '360 dias' },
    { value: '540', label: '540 dias (18 meses)' },
    { value: '720', label: '720 dias (24 meses)' },
  ];

  form: FormGroup = this.fb.group({
    bankName: ['', [Validators.required, Validators.maxLength(255)]],
    amountInvested: ['', [Validators.required, Validators.min(1)]],
    interestRate: ['', [Validators.required, Validators.min(0.01), Validators.max(100)]],
    termDays: ['360', [Validators.required]],
    startDate: [this.getTodayDate(), [Validators.required]],
    notes: [''],
  });

  private calculationTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.investmentId.set(Number(id));
      this.loadInvestment(Number(id));
    }

    this.form.valueChanges.subscribe(() => {
      this.debounceCalculation();
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadInvestment(id: number): void {
    this.loadingInvestment.set(true);

    this.investmentsService.getInvestment(id).subscribe({
      next: (investment) => {
        this.form.patchValue({
          bankName: investment.bankName,
          amountInvested: investment.amountInvested,
          interestRate: investment.interestRate,
          termDays: String(investment.termDays),
          startDate: investment.startDate?.split('T')[0],
          notes: investment.notes || '',
        });
        this.loadingInvestment.set(false);
        this.debounceCalculation();
      },
      error: () => {
        this.toast.error('Error al cargar la inversion');
        this.loadingInvestment.set(false);
        this.goBack();
      }
    });
  }

  private debounceCalculation(): void {
    const amountInvested = this.form.get('amountInvested')?.value;
    const interestRate = this.form.get('interestRate')?.value;
    const termDays = this.form.get('termDays')?.value;

    if (!amountInvested || !interestRate || !termDays) {
      this.calculation.set(null);
      return;
    }

    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }

    this.calculationTimeout = setTimeout(() => {
      this.loadingCalculation.set(true);

      this.investmentsService.simulate(
        Number(amountInvested),
        Number(interestRate),
        Number(termDays)
      ).subscribe({
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;
    const data = {
      bankName: formValue.bankName,
      amountInvested: Number(formValue.amountInvested),
      interestRate: Number(formValue.interestRate),
      termDays: Number(formValue.termDays),
      startDate: formValue.startDate,
      notes: formValue.notes || undefined,
    };

    const request = this.isEditMode()
      ? this.investmentsService.updateInvestment(this.investmentId()!, data)
      : this.investmentsService.createInvestment(data);

    request.subscribe({
      next: () => {
        this.toast.success(
          this.isEditMode()
            ? 'Inversion actualizada correctamente'
            : 'Inversion registrada correctamente'
        );
        this.router.navigate(['/investments']);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Error al guardar la inversion';
        this.toast.error(Array.isArray(message) ? message[0] : message);
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['min']) return `El valor minimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `El valor maximo es ${control.errors['max'].max}`;
    if (control.errors['maxlength']) return `Maximo ${control.errors['maxlength'].requiredLength} caracteres`;

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
    this.router.navigate(['/investments']);
  }
}
