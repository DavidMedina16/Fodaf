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
import { FinesService } from '../services/fines.service';
import { Fine, FineStatus, FineCategory, FinesSummary, PaginatedFines } from '@core/models/fine.model';

@Component({
  selector: 'app-fines-list',
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
          <h1 class="page__title">Multas</h1>
          <p class="page__subtitle">Gestión de multas y penalizaciones del fondo</p>
        </div>
        <app-button (click)="goToNewFine()">Nueva Multa</app-button>
      </header>

      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else {
        <!-- Summary Cards -->
        <div class="stats-grid">
          <app-stat-card
            title="Total Multas"
            [value]="String(summary()?.totalFines || 0)"
            icon="chart"
          ></app-stat-card>
          <app-stat-card
            title="Pendientes"
            [value]="String(summary()?.pendingFines || 0)"
            icon="calendar"
          ></app-stat-card>
          <app-stat-card
            title="Monto Pendiente"
            [value]="formatCurrency(summary()?.totalPendingAmount || 0)"
            icon="money"
          ></app-stat-card>
          <app-stat-card
            title="Monto Recaudado"
            [value]="formatCurrency(summary()?.totalPaidAmount || 0)"
            icon="wallet"
          ></app-stat-card>
        </div>

        <!-- Category Summary -->
        @if (summary()?.byCategory?.length) {
          <app-card>
            <h3 class="section-title">Por Categoría</h3>
            <div class="category-grid">
              @for (cat of summary()?.byCategory; track cat.category) {
                <div class="category-item">
                  <span class="category-item__name">{{ cat.category }}</span>
                  <span class="category-item__count">{{ cat.count }} multas</span>
                  <span class="category-item__amount">{{ cat.amount | currency:'COP':'symbol':'1.0-0' }}</span>
                </div>
              }
            </div>
          </app-card>
        }

        <!-- Filters -->
        <app-card>
          <div class="filters">
            <app-input
              placeholder="Buscar por razón o miembro..."
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
            <app-select
              [options]="categoryOptions"
              [value]="selectedCategory()"
              (selectionChange)="onCategoryChange($event)"
              placeholder="Todas las categorías"
            ></app-select>
            <app-button variant="secondary" (click)="applyFilters()">Filtrar</app-button>
            <app-button variant="outline" (click)="clearFilters()">Limpiar</app-button>
          </div>
        </app-card>

        <!-- Fines Table -->
        <app-card>
          @if (fines().length === 0) {
            <app-empty-state
              icon="folder"
              title="No hay multas"
              description="No se han registrado multas aún."
              actionText="Crear Multa"
              (actionClick)="goToNewFine()"
            ></app-empty-state>
          } @else {
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>Monto</th>
                    <th>Categoría</th>
                    <th>Razón</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (fine of fines(); track fine.id) {
                    <tr>
                      <td>{{ fine.user?.firstName }} {{ fine.user?.lastName }}</td>
                      <td>{{ fine.amount | currency:'COP':'symbol':'1.0-0' }}</td>
                      <td><span class="badge badge--category">{{ fine.category }}</span></td>
                      <td>{{ fine.reason || '-' }}</td>
                      <td>
                        <span class="badge" [class]="'badge--' + getStatusClass(fine.status)">
                          {{ fine.status }}
                        </span>
                      </td>
                      <td>{{ fine.createdAt | date:'dd/MM/yyyy' }}</td>
                      <td>
                        <div class="actions">
                          @if (fine.status === FineStatus.PENDING) {
                            <app-button variant="ghost" size="sm" (click)="markAsPaid(fine)">Pagar</app-button>
                          }
                          <app-button variant="ghost" size="sm" (click)="goToEdit(fine.id)">Editar</app-button>
                          <app-button variant="ghost" size="sm" (click)="confirmDelete(fine)">Eliminar</app-button>
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
      }

      @if (showDeleteModal()) {
        <app-confirm-modal
          [isOpen]="true"
          title="Eliminar Multa"
          message="¿Está seguro de eliminar esta multa? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          variant="danger"
          (confirmed)="deleteFine()"
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
      margin-bottom: $spacing-4;
    }

    .section-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0 0 $spacing-4;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: $spacing-3;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      padding: $spacing-3;
      background: $gray-100;
      border-radius: $border-radius-md;

      &__name { font-weight: 500; margin-bottom: $spacing-1; }
      &__count { font-size: $font-size-sm; color: $text-secondary; }
      &__amount { font-size: $font-size-lg; font-weight: 600; color: $primary; margin-top: $spacing-2; }
    }

    .filters {
      display: flex;
      gap: $spacing-3;
      flex-wrap: wrap;
      align-items: flex-end;

      app-input, app-select { flex: 1; min-width: 150px; }
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
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--pending { background-color: rgba($warning, 0.1); color: $warning; }
      &--paid { background-color: rgba($success, 0.1); color: $success; }
      &--category { background-color: rgba($info, 0.1); color: $info; }
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

    app-card {
      margin-bottom: $spacing-4;
    }
  `]
})
export class FinesListComponent implements OnInit {
  private readonly finesService = inject(FinesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  fines = signal<Fine[]>([]);
  summary = signal<FinesSummary | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  searchTerm = signal('');
  selectedStatus = signal('');
  selectedCategory = signal('');

  showDeleteModal = signal(false);
  fineToDelete = signal<Fine | null>(null);

  FineStatus = FineStatus;
  String = String;

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: FineStatus.PENDING, label: 'Pendiente' },
    { value: FineStatus.PAID, label: 'Pagada' },
  ];

  categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    { value: FineCategory.LATE_PAYMENT, label: 'Mora' },
    { value: FineCategory.ABSENCE, label: 'Inasistencia' },
    { value: FineCategory.RULE_VIOLATION, label: 'Incumplimiento' },
    { value: FineCategory.OTHER, label: 'Otro' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.finesService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.toast.error('Error al cargar resumen'),
    });
    this.loadFines();
  }

  loadFines(): void {
    const filters = {
      page: this.currentPage(),
      limit: this.pageSize,
      search: this.searchTerm() || undefined,
      status: this.selectedStatus() || undefined,
      category: this.selectedCategory() || undefined,
    };

    this.finesService.getFines(filters).subscribe({
      next: (response: PaginatedFines) => {
        this.fines.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar multas');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadFines();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.selectedCategory.set('');
    this.applyFilters();
  }

  onStatusChange(value: string | number): void {
    this.selectedStatus.set(String(value));
  }

  onCategoryChange(value: string | number): void {
    this.selectedCategory.set(String(value));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadFines();
  }

  startItem(): number {
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  endItem(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  }

  goToNewFine(): void {
    this.router.navigate(['/fines/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/fines', id, 'edit']);
  }

  markAsPaid(fine: Fine): void {
    this.finesService.markAsPaid(fine.id).subscribe({
      next: () => {
        this.toast.success('Multa marcada como pagada');
        this.loadData();
      },
      error: () => this.toast.error('Error al actualizar multa'),
    });
  }

  confirmDelete(fine: Fine): void {
    this.fineToDelete.set(fine);
    this.showDeleteModal.set(true);
  }

  deleteFine(): void {
    const fine = this.fineToDelete();
    if (!fine) return;

    this.finesService.deleteFine(fine.id).subscribe({
      next: () => {
        this.toast.success('Multa eliminada exitosamente');
        this.showDeleteModal.set(false);
        this.loadData();
      },
      error: () => {
        this.toast.error('Error al eliminar multa');
      },
    });
  }

  getStatusClass(status: FineStatus): string {
    return status === FineStatus.PENDING ? 'pending' : 'paid';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
