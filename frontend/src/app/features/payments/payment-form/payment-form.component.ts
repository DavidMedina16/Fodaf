import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { ContributionsService } from '../services/contributions.service';
import { MembersService } from '@features/members/services/members.service';
import { User } from '@core/models/user.model';
import { ContributionType, ContributionStatus } from '@core/models/enums';

@Component({
  selector: 'app-payment-form',
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
          <h1 class="page__title">{{ isEditMode() ? 'Editar aporte' : 'Registrar aporte' }}</h1>
          <p class="page__subtitle">{{ isEditMode() ? 'Modifica los datos del aporte' : 'Registra un nuevo aporte al fondo' }}</p>
        </div>
      </header>

      @if (loadingContribution()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando datos..."></app-loading-spinner>
          </div>
        </app-card>
      } @else {
        <app-card>
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
                  [disabled]="isEditMode()"
                ></app-select>
              </app-form-field>

              <app-form-field
                label="Monto"
                [required]="true"
                [error]="getFieldError('amount')"
              >
                <app-input
                  type="number"
                  formControlName="amount"
                  placeholder="0"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Mes del aporte"
                [required]="true"
                [error]="getFieldError('targetMonth')"
              >
                <app-input
                  type="month"
                  formControlName="targetMonth"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Tipo de aporte"
                [required]="true"
                [error]="getFieldError('type')"
              >
                <app-select
                  formControlName="type"
                  [options]="typeOptions"
                ></app-select>
              </app-form-field>

              <app-form-field
                label="Estado"
                [required]="true"
                [error]="getFieldError('status')"
              >
                <app-select
                  formControlName="status"
                  [options]="statusOptions"
                ></app-select>
              </app-form-field>

              @if (form.get('status')?.value === 'Pagado') {
                <app-form-field
                  label="Fecha de pago"
                  [error]="getFieldError('paymentDate')"
                >
                  <app-input
                    type="date"
                    formControlName="paymentDate"
                  ></app-input>
                </app-form-field>
              }
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
                {{ isEditMode() ? 'Guardar cambios' : 'Registrar aporte' }}
              </app-button>
            </div>
          </form>
        </app-card>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .page {
      max-width: 800px;

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

    .loading-container {
      display: flex;
      justify-content: center;
      padding: $spacing-12;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-5;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
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
  `]
})
export class PaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contributionsService = inject(ContributionsService);
  private readonly membersService = inject(MembersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // State
  members = signal<User[]>([]);
  loadingContribution = signal(false);
  saving = signal(false);
  contributionId = signal<number | null>(null);

  isEditMode = computed(() => this.contributionId() !== null);

  memberOptions = computed(() =>
    this.members().map(m => ({
      value: String(m.id),
      label: `${m.firstName} ${m.lastName}`
    }))
  );

  typeOptions = [
    { value: ContributionType.MONTHLY, label: 'Mensual' },
    { value: ContributionType.EXTRAORDINARY, label: 'Extraordinario' },
  ];

  statusOptions = [
    { value: ContributionStatus.PENDING, label: 'Pendiente' },
    { value: ContributionStatus.PAID, label: 'Pagado' },
    { value: ContributionStatus.OVERDUE, label: 'Vencido' },
  ];

  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    amount: ['', [Validators.required, Validators.min(1)]],
    targetMonth: [this.getCurrentMonth(), [Validators.required]],
    type: [ContributionType.MONTHLY, [Validators.required]],
    status: [ContributionStatus.PENDING, [Validators.required]],
    paymentDate: [''],
  });

  ngOnInit(): void {
    this.loadMembers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.contributionId.set(Number(id));
      this.loadContribution(Number(id));
    }
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  loadMembers(): void {
    this.membersService.getMembers({ limit: 100, isActive: true }).subscribe({
      next: (response) => this.members.set(response.data),
      error: () => this.toast.error('Error al cargar los miembros')
    });
  }

  loadContribution(id: number): void {
    this.loadingContribution.set(true);

    this.contributionsService.getContribution(id).subscribe({
      next: (contribution) => {
        this.form.patchValue({
          userId: String(contribution.userId),
          amount: contribution.amount,
          targetMonth: contribution.targetMonth,
          type: contribution.type || ContributionType.MONTHLY,
          status: contribution.status || ContributionStatus.PENDING,
          paymentDate: contribution.paymentDate || '',
        });
        this.loadingContribution.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el aporte');
        this.loadingContribution.set(false);
        this.router.navigate(['/payments']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;
    const data = {
      userId: Number(formValue.userId),
      amount: Number(formValue.amount),
      targetMonth: formValue.targetMonth,
      type: formValue.type,
      status: formValue.status,
      paymentDate: formValue.status === ContributionStatus.PAID ? formValue.paymentDate || new Date().toISOString().split('T')[0] : undefined,
    };

    if (this.isEditMode()) {
      this.contributionsService.updateContribution(this.contributionId()!, data).subscribe({
        next: () => {
          this.toast.success('Aporte actualizado correctamente');
          this.router.navigate(['/payments']);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Error al actualizar el aporte';
          this.toast.error(message);
        }
      });
    } else {
      this.contributionsService.createContribution(data).subscribe({
        next: () => {
          this.toast.success('Aporte registrado correctamente');
          this.router.navigate(['/payments']);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Error al registrar el aporte';
          this.toast.error(message);
        }
      });
    }
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['min']) return `El valor minimo es ${control.errors['min'].min}`;

    return '';
  }

  goBack(): void {
    this.router.navigate(['/payments']);
  }
}
