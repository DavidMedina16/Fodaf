import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  EmptyStateComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  StatCardComponent,
  LoadingSpinnerComponent,
  ConfirmModalComponent,
} from '@shared/components';
import { ToastService } from '@shared/services/toast.service';
import { EventsService } from '../services/events.service';
import { Event, EventStatus, EventsSummary, PaginatedEvents } from '@core/models/event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    DatePipe,
    CurrencyPipe,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-content">
          <h1 class="page__title">Eventos</h1>
          <p class="page__subtitle">Organización y recaudación de eventos del fondo</p>
        </div>
        <app-button (click)="goToNewEvent()">Nuevo Evento</app-button>
      </header>

      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <!-- Summary Cards -->
        <div class="stats-grid">
          <app-stat-card
            title="Total Eventos"
            [value]="String(summary()?.totalEvents || 0)"
            icon="calendar"
          ></app-stat-card>
          <app-stat-card
            title="Eventos Activos"
            [value]="String(summary()?.activeEvents || 0)"
            icon="chart"
          ></app-stat-card>
          <app-stat-card
            title="Total Recaudado"
            [value]="formatCurrency(summary()?.totalRaised || 0)"
            icon="money"
          ></app-stat-card>
          <app-stat-card
            title="Meta Total"
            [value]="formatCurrency(summary()?.totalGoal || 0)"
            icon="wallet"
          ></app-stat-card>
        </div>

        <!-- Filters -->
        <app-card>
          <div class="filters">
            <app-input
              placeholder="Buscar eventos..."
              [value]="searchTerm()"
              (inputChange)="searchTerm.set($event)"
              (keyup.enter)="applyFilters()"
            ></app-input>
            <app-select
              [options]="statusOptions"
              [value]="selectedStatus()"
              (selectionChange)="onStatusChange($event)"
              placeholder="Todos los estados"
            ></app-select>
            <app-button variant="secondary" (click)="applyFilters()">Filtrar</app-button>
            <app-button variant="outline" (click)="clearFilters()">Limpiar</app-button>
          </div>
        </app-card>

        <!-- Events Table -->
        <app-card>
          @if (events().length === 0) {
            <app-empty-state
              icon="folder"
              title="No hay eventos"
              description="Crea tu primer evento para comenzar a registrar actividades."
              actionText="Crear Evento"
              (actionClick)="goToNewEvent()"
            ></app-empty-state>
          } @else {
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha</th>
                    <th>Ubicación</th>
                    <th>Meta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (event of events(); track event.id) {
                    <tr (click)="goToDetail(event.id)" class="clickable">
                      <td>{{ event.name }}</td>
                      <td>{{ event.eventDate | date:'dd/MM/yyyy' }}</td>
                      <td>{{ event.location || '-' }}</td>
                      <td>{{ event.fundraisingGoal | currency:'COP':'symbol':'1.0-0' }}</td>
                      <td>
                        <span class="badge" [class]="'badge--' + getStatusClass(event.status)">
                          {{ event.status }}
                        </span>
                      </td>
                      <td>
                        <div class="actions" (click)="$event.stopPropagation()">
                          <app-button variant="ghost" size="sm" (click)="goToDetail(event.id)">Ver</app-button>
                          <app-button variant="ghost" size="sm" (click)="goToEdit(event.id)">Editar</app-button>
                          <app-button variant="ghost" size="sm" (click)="confirmDelete(event)">Eliminar</app-button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination">
                <span class="pagination__info">
                  Mostrando {{ startItem() }}-{{ endItem() }} de {{ totalItems() }}
                </span>
                <div class="pagination__controls">
                  <app-button
                    variant="outline"
                    size="sm"
                    [disabled]="currentPage() === 1"
                    (click)="onPageChange(currentPage() - 1)"
                  >Anterior</app-button>
                  <span class="pagination__current">{{ currentPage() }} / {{ totalPages() }}</span>
                  <app-button
                    variant="outline"
                    size="sm"
                    [disabled]="currentPage() === totalPages()"
                    (click)="onPageChange(currentPage() + 1)"
                  >Siguiente</app-button>
                </div>
              </div>
            }
          }
        </app-card>

        <!-- Upcoming Events -->
        @if (summary()?.upcomingEvents?.length) {
          <app-card>
            <h3 class="section-title">Próximos Eventos</h3>
            <div class="upcoming-list">
              @for (event of summary()?.upcomingEvents; track event.id) {
                <div class="upcoming-item" (click)="goToDetail(event.id)">
                  <div class="upcoming-item__info">
                    <span class="upcoming-item__name">{{ event.name }}</span>
                    <span class="upcoming-item__date">{{ event.eventDate | date:'dd MMM yyyy' }}</span>
                  </div>
                  <span class="badge" [class]="'badge--' + getStatusClass(event.status)">
                    {{ event.status }}
                  </span>
                </div>
              }
            </div>
          </app-card>
        }
      }

      @if (showDeleteModal()) {
        <app-confirm-modal
          [isOpen]="true"
          title="Eliminar Evento"
          [message]="'¿Está seguro de eliminar el evento ' + (eventToDelete()?.name || '') + '? Esta acción no se puede deshacer.'"
          confirmText="Eliminar"
          variant="danger"
          (confirmed)="deleteEvent()"
          (cancelled)="showDeleteModal.set(false)"
        ></app-confirm-modal>
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-4;
      margin-bottom: $spacing-6;
    }

    .filters {
      display: flex;
      gap: $spacing-3;
      flex-wrap: wrap;
      align-items: flex-end;

      app-input, app-select { flex: 1; min-width: 180px; }
    }

    .table-container {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: $spacing-3;
        text-align: left;
        border-bottom: 1px solid $border-color;
      }

      th {
        font-weight: 600;
        font-size: $font-size-sm;
        color: $text-secondary;
        background: $gray-100;
      }

      tbody tr:hover {
        background: $gray-100;
      }

      tbody tr.clickable {
        cursor: pointer;
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

    .actions {
      display: flex;
      gap: $spacing-1;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-color;

      &__info { font-size: $font-size-sm; color: $text-secondary; }
      &__controls { display: flex; align-items: center; gap: $spacing-3; }
      &__current { font-size: $font-size-sm; font-weight: 500; }
    }

    .section-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0 0 $spacing-4;
    }

    .upcoming-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .upcoming-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-3;
      background: $gray-100;
      border-radius: $border-radius-md;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover { background: $gray-200; }
      &__info { display: flex; flex-direction: column; gap: $spacing-1; }
      &__name { font-weight: 500; }
      &__date { font-size: $font-size-sm; color: $text-secondary; }
    }

    app-card {
      margin-bottom: $spacing-4;
    }
  `]
})
export class EventsListComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  events = signal<Event[]>([]);
  summary = signal<EventsSummary | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  searchTerm = signal('');
  selectedStatus = signal('');

  showDeleteModal = signal(false);
  eventToDelete = signal<Event | null>(null);

  String = String;

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: EventStatus.PLANNED, label: 'Planificado' },
    { value: EventStatus.ACTIVE, label: 'Activo' },
    { value: EventStatus.FINISHED, label: 'Finalizado' },
    { value: EventStatus.CANCELLED, label: 'Cancelado' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.eventsService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.toast.error('Error al cargar resumen'),
    });
    this.loadEvents();
  }

  loadEvents(): void {
    const filters = {
      page: this.currentPage(),
      limit: this.pageSize,
      search: this.searchTerm() || undefined,
      status: this.selectedStatus() || undefined,
    };

    this.eventsService.getEvents(filters).subscribe({
      next: (response: PaginatedEvents) => {
        this.events.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar eventos');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.applyFilters();
  }

  onStatusChange(value: string | number): void {
    this.selectedStatus.set(String(value));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEvents();
  }

  startItem(): number {
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  endItem(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  }

  goToNewEvent(): void {
    this.router.navigate(['/events/new']);
  }

  goToDetail(id: number): void {
    this.router.navigate(['/events', id]);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/events', id, 'edit']);
  }

  confirmDelete(event: Event): void {
    this.eventToDelete.set(event);
    this.showDeleteModal.set(true);
  }

  deleteEvent(): void {
    const event = this.eventToDelete();
    if (!event) return;

    this.eventsService.deleteEvent(event.id).subscribe({
      next: () => {
        this.toast.success('Evento eliminado exitosamente');
        this.showDeleteModal.set(false);
        this.loadData();
      },
      error: () => {
        this.toast.error('Error al eliminar evento');
      },
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
