import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CardComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  LoadingSpinnerComponent,
  FormFieldComponent,
} from '@shared/components';
import { ToastService } from '@shared/services/toast.service';
import { FinesService } from '../services/fines.service';
import { MembersService } from '../../members/services/members.service';
import { Fine, FineStatus, FineCategory, CreateFineDto } from '@core/models/fine.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-fine-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingSpinnerComponent,
    FormFieldComponent,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-content">
          <h1 class="page__title">{{ isEditMode() ? 'Editar Multa' : 'Nueva Multa' }}</h1>
          <p class="page__subtitle">{{ isEditMode() ? 'Modifica los datos de la multa' : 'Registra una nueva multa a un miembro' }}</p>
        </div>
        <app-button variant="outline" routerLink="/fines">Volver</app-button>
      </header>

      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <app-form-field label="Miembro" [required]="true" [error]="getError('userId')">
                <app-select
                  formControlName="userId"
                  [options]="memberOptions()"
                  placeholder="Seleccionar miembro"
                ></app-select>
              </app-form-field>

              <app-form-field label="Monto" [required]="true" [error]="getError('amount')">
                <app-input
                  type="number"
                  formControlName="amount"
                  placeholder="0"
                ></app-input>
              </app-form-field>

              <app-form-field label="Categoría" [error]="getError('category')">
                <app-select
                  formControlName="category"
                  [options]="categoryOptions"
                  placeholder="Seleccionar categoría"
                ></app-select>
              </app-form-field>

              <app-form-field label="Estado" [error]="getError('status')">
                <app-select
                  formControlName="status"
                  [options]="statusOptions"
                  placeholder="Seleccionar estado"
                ></app-select>
              </app-form-field>

              <app-form-field label="Razón" [error]="getError('reason')" class="full-width">
                <textarea
                  formControlName="reason"
                  class="textarea"
                  placeholder="Describe el motivo de la multa..."
                  rows="3"
                ></textarea>
              </app-form-field>
            </div>

            <div class="form-actions">
              <app-button variant="outline" type="button" routerLink="/fines">Cancelar</app-button>
              <app-button type="submit" [disabled]="form.invalid || submitting()">
                {{ submitting() ? 'Guardando...' : (isEditMode() ? 'Actualizar' : 'Crear Multa') }}
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
      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-6;
        flex-wrap: wrap;
        gap: $spacing-4;
      }
      &__header-content { flex: 1; }
      &__title { font-size: $font-size-2xl; font-weight: 700; margin: 0 0 $spacing-1; }
      &__subtitle { font-size: $font-size-sm; color: $text-secondary; margin: 0; }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: 1 / -1;
      }
    }

    .textarea {
      width: 100%;
      padding: $spacing-3;
      border: 1px solid $border-color;
      border-radius: $border-radius-md;
      font-family: inherit;
      font-size: $font-size-sm;
      resize: vertical;
      min-height: 80px;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 2px rgba($primary, 0.1);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-3;
      margin-top: $spacing-6;
      padding-top: $spacing-4;
      border-top: 1px solid $border-color;
    }
  `]
})
export class FineFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly finesService = inject(FinesService);
  private readonly membersService = inject(MembersService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  submitting = signal(false);
  isEditMode = signal(false);
  fineId = signal<number | null>(null);
  memberOptions = signal<{ value: number; label: string }[]>([]);

  categoryOptions = [
    { value: FineCategory.LATE_PAYMENT, label: 'Mora' },
    { value: FineCategory.ABSENCE, label: 'Inasistencia' },
    { value: FineCategory.RULE_VIOLATION, label: 'Incumplimiento' },
    { value: FineCategory.OTHER, label: 'Otro' },
  ];

  statusOptions = [
    { value: FineStatus.PENDING, label: 'Pendiente' },
    { value: FineStatus.PAID, label: 'Pagada' },
  ];

  form: FormGroup = this.fb.group({
    userId: [null, Validators.required],
    amount: [null, [Validators.required, Validators.min(1)]],
    category: [FineCategory.OTHER],
    status: [FineStatus.PENDING],
    reason: [''],
  });

  ngOnInit(): void {
    this.loadMembers();
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.fineId.set(+id);
      this.loadFine(+id);
    }
  }

  loadMembers(): void {
    this.membersService.getMembers({ limit: 100 }).subscribe({
      next: (response) => {
        this.memberOptions.set(
          response.data.map((m: User) => ({
            value: m.id,
            label: `${m.firstName} ${m.lastName}`,
          }))
        );
        if (!this.isEditMode()) {
          this.loading.set(false);
        }
      },
      error: () => {
        this.toast.error('Error al cargar miembros');
        this.loading.set(false);
      },
    });
  }

  loadFine(id: number): void {
    this.finesService.getFine(id).subscribe({
      next: (fine) => {
        this.form.patchValue({
          userId: fine.userId,
          amount: fine.amount,
          category: fine.category,
          status: fine.status,
          reason: fine.reason || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar multa');
        this.router.navigate(['/fines']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const formValue = this.form.value;
    const data: CreateFineDto = {
      ...formValue,
      userId: Number(formValue.userId),
      amount: Number(formValue.amount),
    };

    const request = this.isEditMode()
      ? this.finesService.updateFine(this.fineId()!, data)
      : this.finesService.createFine(data);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Multa actualizada' : 'Multa creada');
        this.router.navigate(['/fines']);
      },
      error: () => {
        this.toast.error('Error al guardar multa');
        this.submitting.set(false);
      },
    });
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control?.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['min']) return 'El monto debe ser mayor a 0';

    return '';
  }
}
