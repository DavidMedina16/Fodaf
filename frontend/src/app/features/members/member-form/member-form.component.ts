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
import { MembersService } from '../services/members.service';
import { RolesService } from '../services/roles.service';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-member-form',
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
          <h1 class="page__title">{{ isEditMode() ? 'Editar miembro' : 'Nuevo miembro' }}</h1>
          <p class="page__subtitle">{{ isEditMode() ? 'Modifica los datos del miembro' : 'Registra un nuevo miembro del fondo' }}</p>
        </div>
      </header>

      @if (loadingMember()) {
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
                label="Nombre"
                [required]="true"
                [error]="getFieldError('firstName')"
              >
                <app-input
                  formControlName="firstName"
                  placeholder="Ingresa el nombre"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Apellido"
                [required]="true"
                [error]="getFieldError('lastName')"
              >
                <app-input
                  formControlName="lastName"
                  placeholder="Ingresa el apellido"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Email"
                [required]="true"
                [error]="getFieldError('email')"
              >
                <app-input
                  type="email"
                  formControlName="email"
                  placeholder="ejemplo@correo.com"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Telefono"
                [error]="getFieldError('phone')"
              >
                <app-input
                  formControlName="phone"
                  placeholder="Numero de telefono"
                ></app-input>
              </app-form-field>

              <app-form-field
                label="Rol"
                [required]="true"
                [error]="getFieldError('roleId')"
              >
                <app-select
                  formControlName="roleId"
                  placeholder="Selecciona un rol"
                  [options]="roleOptions()"
                ></app-select>
              </app-form-field>

              @if (!isEditMode()) {
                <app-form-field
                  label="Contrasena"
                  [required]="true"
                  [error]="getFieldError('password')"
                  hint="Minimo 6 caracteres"
                >
                  <app-input
                    type="password"
                    formControlName="password"
                    placeholder="Contrasena inicial"
                  ></app-input>
                </app-form-field>
              }

              @if (isEditMode()) {
                <app-form-field label="Estado">
                  <app-select
                    formControlName="isActive"
                    [options]="statusOptions"
                  ></app-select>
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
                {{ isEditMode() ? 'Guardar cambios' : 'Crear miembro' }}
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
export class MemberFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly membersService = inject(MembersService);
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // State
  roles = signal<Role[]>([]);
  loadingMember = signal(false);
  saving = signal(false);
  memberId = signal<number | null>(null);

  isEditMode = computed(() => this.memberId() !== null);

  roleOptions = computed(() =>
    this.roles().map(r => ({ value: String(r.id), label: r.name }))
  );

  statusOptions = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ];

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.maxLength(20)]],
    roleId: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isActive: ['true'],
  });

  ngOnInit(): void {
    this.loadRoles();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.memberId.set(Number(id));
      this.loadMember(Number(id));
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  loadRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.toast.error('Error al cargar los roles')
    });
  }

  loadMember(id: number): void {
    this.loadingMember.set(true);

    this.membersService.getMember(id).subscribe({
      next: (member) => {
        this.form.patchValue({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone || '',
          roleId: String(member.roleId),
          isActive: String(member.isActive),
        });
        this.loadingMember.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el miembro');
        this.loadingMember.set(false);
        this.router.navigate(['/members']);
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

    if (this.isEditMode()) {
      const updateData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone || undefined,
        roleId: Number(formValue.roleId),
        isActive: formValue.isActive === 'true',
      };

      this.membersService.updateMember(this.memberId()!, updateData).subscribe({
        next: () => {
          this.toast.success('Miembro actualizado correctamente');
          this.router.navigate(['/members', this.memberId()]);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Error al actualizar el miembro';
          this.toast.error(message);
        }
      });
    } else {
      const createData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        phone: formValue.phone || undefined,
        roleId: Number(formValue.roleId),
      };

      this.membersService.createMember(createData).subscribe({
        next: (member) => {
          this.toast.success('Miembro creado correctamente');
          this.router.navigate(['/members', member.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Error al crear el miembro';
          this.toast.error(message);
        }
      });
    }
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Email invalido';
    if (control.errors['minlength']) return `Minimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximo ${control.errors['maxlength'].requiredLength} caracteres`;

    return '';
  }

  goBack(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/members', this.memberId()]);
    } else {
      this.router.navigate(['/members']);
    }
  }
}
