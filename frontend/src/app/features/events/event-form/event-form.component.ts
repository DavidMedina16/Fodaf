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
import { EventsService } from '../services/events.service';
import { Event, EventStatus, CreateEventDto } from '@core/models/event.model';

@Component({
  selector: 'app-event-form',
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
          <h1 class="page__title">{{ isEditMode() ? 'Editar Evento' : 'Nuevo Evento' }}</h1>
          <p class="page__subtitle">{{ isEditMode() ? 'Modifica los datos del evento' : 'Registra un nuevo evento del fondo' }}</p>
        </div>
        <app-button variant="outline" routerLink="/events">Volver</app-button>
      </header>

      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <app-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <app-form-field label="Nombre del evento" [required]="true" [error]="getError('name')">
                <app-input
                  formControlName="name"
                  placeholder="Ej: Bingo familiar"
                ></app-input>
              </app-form-field>

              <app-form-field label="Fecha del evento" [required]="true" [error]="getError('eventDate')">
                <app-input
                  type="date"
                  formControlName="eventDate"
                ></app-input>
              </app-form-field>

              <app-form-field label="Ubicación" [error]="getError('location')">
                <app-input
                  formControlName="location"
                  placeholder="Ej: Salón comunal"
                ></app-input>
              </app-form-field>

              <app-form-field label="Estado" [error]="getError('status')">
                <app-select
                  formControlName="status"
                  [options]="statusOptions"
                  placeholder="Seleccionar estado"
                ></app-select>
              </app-form-field>

              <app-form-field label="Descripción" [error]="getError('description')" class="full-width">
                <textarea
                  formControlName="description"
                  class="textarea"
                  placeholder="Descripción del evento..."
                  rows="3"
                ></textarea>
              </app-form-field>
            </div>

            <div class="form-actions">
              <app-button variant="outline" type="button" routerLink="/events">Cancelar</app-button>
              <app-button type="submit" [disabled]="form.invalid || submitting()">
                {{ submitting() ? 'Guardando...' : (isEditMode() ? 'Actualizar' : 'Crear Evento') }}
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
export class EventFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly toast = inject(ToastService);

  loading = signal(false);
  submitting = signal(false);
  isEditMode = signal(false);
  eventId = signal<number | null>(null);

  statusOptions = [
    { value: EventStatus.PLANNED, label: 'Planificado' },
    { value: EventStatus.ACTIVE, label: 'Activo' },
    { value: EventStatus.FINISHED, label: 'Finalizado' },
    { value: EventStatus.CANCELLED, label: 'Cancelado' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    eventDate: ['', Validators.required],
    location: ['', Validators.maxLength(255)],
    status: [EventStatus.PLANNED],
    description: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.eventId.set(+id);
      this.loadEvent(+id);
    }
  }

  loadEvent(id: number): void {
    this.loading.set(true);
    this.eventsService.getEvent(id).subscribe({
      next: (event) => {
        this.form.patchValue({
          name: event.name,
          eventDate: event.eventDate?.split('T')[0] || '',
          location: event.location || '',
          status: event.status,
          description: event.description || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar evento');
        this.router.navigate(['/events']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const data: CreateEventDto = this.form.value;

    const request = this.isEditMode()
      ? this.eventsService.updateEvent(this.eventId()!, data)
      : this.eventsService.createEvent(data);

    request.subscribe({
      next: (event) => {
        this.toast.success(this.isEditMode() ? 'Evento actualizado' : 'Evento creado');
        this.router.navigate(['/events', event.id]);
      },
      error: () => {
        this.toast.error('Error al guardar evento');
        this.submitting.set(false);
      },
    });
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control?.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'El valor debe ser mayor o igual a 0';

    return '';
  }
}
