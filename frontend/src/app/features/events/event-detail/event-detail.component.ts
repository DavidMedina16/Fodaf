import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  LoadingSpinnerComponent,
  StatCardComponent,
  ConfirmModalComponent,
  EmptyStateComponent,
} from '@shared/components';
import { ToastService } from '@shared/services/toast.service';
import { EventsService } from '../services/events.service';
import {
  EventWithSummary,
  EventStatus,
  EventTransaction,
  TransactionType,
  CreateTransactionDto,
} from '@core/models/event.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingSpinnerComponent,
    StatCardComponent,
    ConfirmModalComponent,
    EmptyStateComponent,
    DatePipe,
    CurrencyPipe,
  ],
  template: `
    <div class="page">
      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (event()) {
        <header class="page__header">
          <div class="page__header-content">
            <div class="page__title-row">
              <h1 class="page__title">{{ event()!.name }}</h1>
              <span class="badge" [class]="'badge--' + getStatusClass(event()!.status)">
                {{ event()!.status }}
              </span>
            </div>
            <p class="page__subtitle">{{ event()!.description || 'Sin descripción' }}</p>
          </div>
          <div class="page__actions">
            <app-button variant="outline" routerLink="/events">Volver</app-button>
            <app-button variant="secondary" [routerLink]="['/events', event()!.id, 'edit']">Editar</app-button>
            @if (event()!.status !== EventStatus.CANCELLED) {
              <app-button
                [variant]="event()!.status === EventStatus.ACTIVE ? 'secondary' : 'primary'"
                (click)="toggleStatus()"
              >
                {{ event()!.status === EventStatus.PLANNED ? 'Iniciar' : event()!.status === EventStatus.ACTIVE ? 'Finalizar' : 'Reactivar' }}
              </app-button>
            }
          </div>
        </header>

        <!-- Event Info -->
        <div class="info-grid">
          <app-card>
            <div class="info-item">
              <span class="info-item__label">Fecha del evento</span>
              <span class="info-item__value">{{ event()!.eventDate | date:'dd MMMM yyyy' }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Ubicación</span>
              <span class="info-item__value">{{ event()!.location || 'No especificada' }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">Meta de recaudación</span>
              <span class="info-item__value">{{ event()!.fundraisingGoal | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </app-card>
        </div>

        <!-- Summary Stats -->
        <div class="stats-grid">
          <app-stat-card
            title="Ingresos"
            [value]="formatCurrency(event()!.summary.totalIncome || 0)"
            icon="money"
          ></app-stat-card>
          <app-stat-card
            title="Gastos"
            [value]="formatCurrency(event()!.summary.totalExpenses || 0)"
            icon="wallet"
          ></app-stat-card>
          <app-stat-card
            title="Neto"
            [value]="formatCurrency(event()!.summary.netAmount || 0)"
            icon="chart"
          ></app-stat-card>
          <app-stat-card
            title="Progreso Meta"
            [value]="(event()!.summary.goalProgress || 0) + '%'"
            icon="percent"
          ></app-stat-card>
        </div>

        <!-- Progress Bar -->
        @if (event()!.fundraisingGoal > 0) {
          <app-card>
            <h3 class="section-title">Progreso de Recaudación</h3>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-bar__fill" [style.width.%]="event()!.summary.goalProgress || 0"></div>
              </div>
              <div class="progress-labels">
                <span>{{ event()!.summary.netAmount | currency:'COP':'symbol':'1.0-0' }}</span>
                <span>Meta: {{ event()!.fundraisingGoal | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </app-card>
        }

        <!-- Transactions -->
        <app-card>
          <div class="section-header">
            <h3 class="section-title">Transacciones</h3>
            <app-button icon="plus" size="sm" (click)="showTransactionForm.set(true)">
              Agregar
            </app-button>
          </div>

          @if (showTransactionForm()) {
            <div class="transaction-form">
              <app-select
                [options]="transactionTypeOptions"
                [(ngModel)]="newTransaction.type"
                placeholder="Tipo"
              ></app-select>
              <app-input
                type="number"
                [(ngModel)]="newTransaction.amount"
                placeholder="Monto"
              ></app-input>
              <app-input
                [(ngModel)]="newTransaction.description"
                placeholder="Descripción"
              ></app-input>
              <div class="transaction-form__actions">
                <app-button size="sm" (click)="addTransaction()">Guardar</app-button>
                <app-button variant="outline" size="sm" (click)="cancelTransaction()">Cancelar</app-button>
              </div>
            </div>
          }

          @if (!event()!.transactions?.length) {
            <app-empty-state
              icon="folder"
              title="Sin transacciones"
              description="Agrega ingresos o gastos para este evento."
            ></app-empty-state>
          } @else {
            <div class="transactions-list">
              @for (tx of event()!.transactions; track tx.id) {
                <div class="transaction-item" [class.transaction-item--expense]="tx.type === TransactionType.EXPENSE">
                  <div class="transaction-item__info">
                    <span class="transaction-item__type">{{ tx.type }}</span>
                    <span class="transaction-item__description">{{ tx.description || 'Sin descripción' }}</span>
                    <span class="transaction-item__date">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="transaction-item__amount">
                    <span [class.text-success]="tx.type === TransactionType.INCOME" [class.text-error]="tx.type === TransactionType.EXPENSE">
                      {{ tx.type === TransactionType.INCOME ? '+' : '-' }}{{ tx.amount | currency:'COP':'symbol':'1.0-0' }}
                    </span>
                    <app-button variant="ghost" size="sm" (click)="confirmDeleteTransaction(tx)">
                      Eliminar
                    </app-button>
                  </div>
                </div>
              }
            </div>
          }
        </app-card>

        @if (showDeleteModal()) {
          <app-confirm-modal
            [isOpen]="true"
            title="Eliminar Transacción"
            message="¿Está seguro de eliminar esta transacción? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            variant="danger"
            (confirmed)="deleteTransaction()"
            (cancelled)="showDeleteModal.set(false)"
          ></app-confirm-modal>
        }
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
      &__title-row {
        display: flex;
        align-items: center;
        gap: $spacing-3;
        margin-bottom: $spacing-1;
      }
      &__title { font-size: $font-size-2xl; font-weight: 700; margin: 0; }
      &__subtitle { font-size: $font-size-sm; color: $text-secondary; margin: 0; }
      &__actions {
        display: flex;
        gap: $spacing-2;
        flex-wrap: wrap;
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--planned { background-color: rgba($info, 0.1); color: $info; }
      &--active { background-color: rgba($success, 0.1); color: $success; }
      &--finished { background-color: rgba($text-secondary, 0.1); color: $text-secondary; }
      &--cancelled { background-color: rgba($danger, 0.1); color: $danger; }
    }

    .info-grid {
      margin-bottom: $spacing-4;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: $spacing-3 0;
      border-bottom: 1px solid $border-color;

      &:last-child { border-bottom: none; }
      &__label { color: $text-secondary; font-size: $font-size-sm; }
      &__value { font-weight: 500; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: $spacing-4;
      margin-bottom: $spacing-4;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-4;
    }

    .section-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0;
    }

    .progress-container {
      margin-top: $spacing-2;
    }

    .progress-bar {
      width: 100%;
      height: 12px;
      background: $gray-100;
      border-radius: $border-radius-full;
      overflow: hidden;

      &__fill {
        height: 100%;
        background: linear-gradient(90deg, $primary, $success);
        border-radius: $border-radius-full;
        transition: width 0.3s ease;
      }
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: $spacing-2;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .transaction-form {
      display: grid;
      grid-template-columns: 1fr 1fr 2fr auto;
      gap: $spacing-3;
      padding: $spacing-4;
      background: $gray-100;
      border-radius: $border-radius-md;
      margin-bottom: $spacing-4;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      &__actions {
        display: flex;
        gap: $spacing-2;
        align-items: flex-end;
      }
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-3;
      background: $gray-100;
      border-radius: $border-radius-md;
      border-left: 3px solid $success;

      &--expense {
        border-left-color: $danger;
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: $spacing-1;
      }

      &__type {
        font-size: $font-size-xs;
        font-weight: 500;
        text-transform: uppercase;
        color: $text-secondary;
      }

      &__description {
        font-weight: 500;
      }

      &__date {
        font-size: $font-size-xs;
        color: $text-muted;
      }

      &__amount {
        display: flex;
        align-items: center;
        gap: $spacing-2;
        font-weight: 600;
        font-size: $font-size-lg;
      }
    }

    .text-success { color: $success; }
    .text-error { color: $danger; }

    app-card {
      margin-bottom: $spacing-4;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  event = signal<EventWithSummary | null>(null);
  showTransactionForm = signal(false);
  showDeleteModal = signal(false);
  transactionToDelete = signal<EventTransaction | null>(null);

  EventStatus = EventStatus;
  TransactionType = TransactionType;

  newTransaction = {
    type: TransactionType.INCOME as string,
    amount: 0,
    description: '',
  };

  transactionTypeOptions = [
    { value: TransactionType.INCOME, label: 'Ingreso' },
    { value: TransactionType.EXPENSE, label: 'Gasto' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadEvent(+id);
    }
  }

  loadEvent(id: number): void {
    this.loading.set(true);
    this.eventsService.getEventWithDetails(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar evento');
        this.router.navigate(['/events']);
      },
    });
  }

  toggleStatus(): void {
    const currentEvent = this.event();
    if (!currentEvent) return;

    let newStatus: EventStatus;
    switch (currentEvent.status) {
      case EventStatus.PLANNED:
        newStatus = EventStatus.ACTIVE;
        break;
      case EventStatus.ACTIVE:
        newStatus = EventStatus.FINISHED;
        break;
      case EventStatus.FINISHED:
        newStatus = EventStatus.ACTIVE;
        break;
      default:
        return;
    }

    this.eventsService.changeStatus(currentEvent.id, newStatus).subscribe({
      next: () => {
        this.toast.success('Estado actualizado');
        this.loadEvent(currentEvent.id);
      },
      error: () => this.toast.error('Error al cambiar estado'),
    });
  }

  addTransaction(): void {
    const currentEvent = this.event();
    if (!currentEvent || !this.newTransaction.amount) return;

    const data: CreateTransactionDto = {
      eventId: currentEvent.id,
      type: this.newTransaction.type,
      amount: Number(this.newTransaction.amount),
      description: this.newTransaction.description,
    };

    this.eventsService.createTransaction(data).subscribe({
      next: () => {
        this.toast.success('Transacción agregada');
        this.cancelTransaction();
        this.loadEvent(currentEvent.id);
      },
      error: () => this.toast.error('Error al agregar transacción'),
    });
  }

  cancelTransaction(): void {
    this.showTransactionForm.set(false);
    this.newTransaction = {
      type: TransactionType.INCOME,
      amount: 0,
      description: '',
    };
  }

  confirmDeleteTransaction(tx: EventTransaction): void {
    this.transactionToDelete.set(tx);
    this.showDeleteModal.set(true);
  }

  deleteTransaction(): void {
    const tx = this.transactionToDelete();
    const currentEvent = this.event();
    if (!tx || !currentEvent) return;

    this.eventsService.deleteTransaction(tx.id).subscribe({
      next: () => {
        this.toast.success('Transacción eliminada');
        this.showDeleteModal.set(false);
        this.loadEvent(currentEvent.id);
      },
      error: () => this.toast.error('Error al eliminar transacción'),
    });
  }

  getStatusClass(status: EventStatus): string {
    const statusMap: Record<string, string> = {
      [EventStatus.PLANNED]: 'planned',
      [EventStatus.ACTIVE]: 'active',
      [EventStatus.FINISHED]: 'finished',
      [EventStatus.CANCELLED]: 'cancelled',
    };
    return statusMap[status] || 'planned';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
