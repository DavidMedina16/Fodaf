import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CardComponent,
  ButtonComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '@shared/components';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '@shared/services/toast.service';
import { MembersService } from '../services/members.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmModalComponent,
  ],
  template: `
    <div class="page">
      @if (loading()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando miembro..."></app-loading-spinner>
          </div>
        </app-card>
      } @else if (!member()) {
        <app-card>
          <app-empty-state
            icon="users"
            title="Miembro no encontrado"
            description="El miembro que buscas no existe o fue eliminado"
          >
            <app-button variant="primary" (click)="goToList()">
              Volver a la lista
            </app-button>
          </app-empty-state>
        </app-card>
      } @else {
        <header class="page__header">
          <button class="back-button" (click)="goToList()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="page__header-content">
            <h1 class="page__title">{{ member()!.firstName }} {{ member()!.lastName }}</h1>
            <p class="page__subtitle">Informacion del miembro</p>
          </div>
          <div class="page__actions">
            <app-button variant="outline" (click)="onEdit()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </app-button>
            <app-button variant="danger" (click)="onDelete()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Eliminar
            </app-button>
          </div>
        </header>

        <div class="content-grid">
          <app-card class="info-card">
            <h2 class="card-title">Informacion personal</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre completo</span>
                <span class="info-value">{{ member()!.firstName }} {{ member()!.lastName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ member()!.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Telefono</span>
                <span class="info-value">{{ member()!.phone || 'No registrado' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Rol</span>
                <span class="info-value role-badge">{{ member()!.role?.name || 'Sin rol' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value">
                  <span class="status-badge" [class.status-badge--active]="member()!.isActive" [class.status-badge--inactive]="!member()!.isActive">
                    {{ member()!.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Miembro desde</span>
                <span class="info-value">{{ member()!.createdAt | date:'longDate' }}</span>
              </div>
            </div>
          </app-card>

          <app-card class="history-card">
            <h2 class="card-title">Historial de aportes</h2>
            <app-empty-state
              icon="folder"
              title="Sin aportes registrados"
              description="Los aportes de este miembro apareceran aqui"
            ></app-empty-state>
          </app-card>

          <app-card class="history-card">
            <h2 class="card-title">Prestamos</h2>
            <app-empty-state
              icon="folder"
              title="Sin prestamos"
              description="Los prestamos de este miembro apareceran aqui"
            ></app-empty-state>
          </app-card>

          <app-card class="history-card">
            <h2 class="card-title">Multas</h2>
            <app-empty-state
              icon="error"
              title="Sin multas"
              description="Las multas de este miembro apareceran aqui"
            ></app-empty-state>
          </app-card>
        </div>
      }

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar miembro"
          [message]="'¿Estas seguro de eliminar a ' + member()?.firstName + ' ' + member()?.lastName + '? Esta accion no se puede deshacer.'"
          confirmText="Eliminar"
          confirmVariant="danger"
          (confirm)="confirmDelete()"
          (cancel)="cancelDelete()"
        ></app-confirm-modal>
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

        @media (max-width: 768px) {
          flex-wrap: wrap;
        }
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

      &__actions {
        display: flex;
        gap: $spacing-2;

        @media (max-width: 768px) {
          width: 100%;
          margin-left: 56px;
        }
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
      flex-shrink: 0;

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

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-6;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .info-card {
      grid-column: 1 / -1;

      @media (min-width: 1024px) {
        grid-column: 1 / 2;
        grid-row: 1 / 3;
      }
    }

    .card-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0 0 $spacing-5;
      padding-bottom: $spacing-4;
      border-bottom: 1px solid $border-color;
    }

    .info-grid {
      display: grid;
      gap: $spacing-4;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: $spacing-1;
    }

    .info-label {
      font-size: $font-size-xs;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: $font-size-base;
      color: $text-primary;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--active {
        background-color: rgba($success, 0.1);
        color: $success;
      }

      &--inactive {
        background-color: rgba($text-secondary, 0.1);
        color: $text-secondary;
      }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-md;
      font-size: $font-size-sm;
      font-weight: 500;
      background-color: rgba($primary, 0.1);
      color: $primary;
    }
  `]
})
export class MemberDetailComponent implements OnInit {
  private readonly membersService = inject(MembersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  member = signal<User | null>(null);
  loading = signal(true);
  showDeleteModal = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMember(Number(id));
    }
  }

  loadMember(id: number): void {
    this.loading.set(true);

    this.membersService.getMember(id).subscribe({
      next: (member) => {
        this.member.set(member);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar el miembro');
      }
    });
  }

  onEdit(): void {
    const member = this.member();
    if (member) {
      this.router.navigate(['/members', member.id, 'edit']);
    }
  }

  onDelete(): void {
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const member = this.member();
    if (!member) return;

    this.membersService.deleteMember(member.id).subscribe({
      next: () => {
        this.toast.success('Miembro eliminado correctamente');
        this.router.navigate(['/members']);
      },
      error: () => {
        this.toast.error('Error al eliminar el miembro');
        this.showDeleteModal.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  goToList(): void {
    this.router.navigate(['/members']);
  }
}
