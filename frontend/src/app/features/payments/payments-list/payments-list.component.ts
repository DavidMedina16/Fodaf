import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  DataTableComponent,
  TableColumn,
  PageEvent,
  SortEvent,
  StatCardComponent,
} from '@shared/components';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '@shared/services/toast.service';
import { ContributionsService, ContributionFilters } from '../services/contributions.service';
import { Contribution, MonthlySummary } from '@core/models/contribution.model';
import { ContributionStatus } from '@core/models/enums';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    DataTableComponent,
    ConfirmModalComponent,
    StatCardComponent,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-content">
          <h1 class="page__title">Aportes</h1>
          <p class="page__subtitle">Control de pagos mensuales del fondo</p>
        </div>
        <div class="header-actions">
          <app-button variant="outline" (click)="onViewCalendar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Ver calendario
          </app-button>
          <app-button variant="primary" (click)="onCreateContribution()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Registrar aporte
          </app-button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <app-stat-card
          title="Total Esperado"
          [value]="formatCurrency(summary()?.totalExpected || 0)"
          icon="wallet"
          variant="primary"
        ></app-stat-card>
        <app-stat-card
          title="Total Recaudado"
          [value]="formatCurrency(summary()?.totalPaid || 0)"
          icon="money"
          variant="success"
        ></app-stat-card>
        <app-stat-card
          title="Pendientes"
          [value]="(summary()?.pendingCount || 0) + ' aportes'"
          [subtitle]="formatCurrency(summary()?.totalPending || 0)"
          icon="calendar"
          variant="warning"
        ></app-stat-card>
        <app-stat-card
          title="Vencidos"
          [value]="(summary()?.overdueCount || 0) + ' aportes'"
          [subtitle]="formatCurrency(summary()?.totalOverdue || 0)"
          icon="percent"
          variant="danger"
        ></app-stat-card>
      </div>

      <app-card>
        <div class="filters">
          <div class="filters__search">
            <app-input
              placeholder="Buscar por nombre..."
              [value]="searchTerm()"
              (inputChange)="onSearchChange($event)"
            >
              <svg slot="prefix" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </app-input>
          </div>
          <div class="filters__options">
            <app-select
              [value]="selectedMonth()"
              [options]="monthOptions"
              (selectionChange)="onMonthChange($event)"
            ></app-select>
            <app-select
              [value]="selectedYear()"
              [options]="yearOptions"
              (selectionChange)="onYearChange($event)"
            ></app-select>
            <app-select
              placeholder="Estado"
              [options]="statusOptions"
              [value]="statusFilter()"
              (selectionChange)="onStatusChange($event)"
            ></app-select>
          </div>
        </div>

        <app-data-table
          [columns]="columns"
          [data]="contributions()"
          [loading]="loading()"
          [paginated]="true"
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          emptyTitle="No hay aportes"
          emptyDescription="No se encontraron aportes para los filtros seleccionados"
          (pageChange)="onPageChange($event)"
          (sortChange)="onSortChange($event)"
          (rowClick)="onRowClick($event)"
        ></app-data-table>
      </app-card>

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar aporte"
          [message]="'¿Estás seguro de eliminar este aporte de ' + contributionToDelete()?.user?.firstName + '?'"
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
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-6;
        gap: $spacing-4;

        @media (max-width: 640px) {
          flex-direction: column;
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
    }

    .header-actions {
      display: flex;
      gap: $spacing-3;

      @media (max-width: 640px) {
        width: 100%;
        flex-direction: column;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-6;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .filters {
      display: flex;
      gap: $spacing-4;
      margin-bottom: $spacing-6;
      flex-wrap: wrap;

      &__search {
        flex: 1;
        min-width: 200px;
      }

      &__options {
        display: flex;
        gap: $spacing-3;

        @media (max-width: 768px) {
          width: 100%;
          flex-wrap: wrap;

          app-select {
            flex: 1;
            min-width: 120px;
          }
        }
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--paid {
        background-color: rgba($success, 0.1);
        color: $success;
      }

      &--pending {
        background-color: rgba($warning, 0.1);
        color: $warning;
      }

      &--overdue {
        background-color: rgba($danger, 0.1);
        color: $danger;
      }
    }
  `]
})
export class PaymentsListComponent implements OnInit {
  private readonly contributionsService = inject(ContributionsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  contributions = signal<Contribution[]>([]);
  summary = signal<MonthlySummary | null>(null);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  sortColumn = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  searchTerm = signal('');
  statusFilter = signal<string>('');
  selectedMonth = signal<string>(String(new Date().getMonth() + 1));
  selectedYear = signal<string>(String(new Date().getFullYear()));

  // Delete modal
  showDeleteModal = signal(false);
  contributionToDelete = signal<Contribution | null>(null);

  // Debounce search
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  currentTargetMonth = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth().padStart(2, '0');
    return `${year}-${month}`;
  });

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: ContributionStatus.PAID, label: 'Pagados' },
    { value: ContributionStatus.PENDING, label: 'Pendientes' },
    { value: ContributionStatus.OVERDUE, label: 'Vencidos' },
  ];

  monthOptions = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  yearOptions = this.generateYearOptions();

  columns: TableColumn<Contribution>[] = [
    {
      key: 'user',
      header: 'Miembro',
      sortable: false,
      render: (_, row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : '-'
    },
    {
      key: 'targetMonth',
      header: 'Mes',
      sortable: true,
      render: (value) => this.formatMonth(value as string)
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      align: 'right',
      render: (value) => this.formatCurrency(Number(value))
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (value) => (value as string) || 'Mensual'
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (value) => value as string
    },
    {
      key: 'paymentDate',
      header: 'Fecha Pago',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString('es-CO') : '-'
    },
  ];

  ngOnInit(): void {
    this.loadContributions();
    this.loadSummary();
  }

  private generateYearOptions(): { value: string; label: string }[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push({ value: String(i), label: String(i) });
    }
    return years;
  }

  loadContributions(): void {
    this.loading.set(true);

    const filters: ContributionFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection().toUpperCase() as 'ASC' | 'DESC',
      year: Number(this.selectedYear()),
      month: Number(this.selectedMonth()),
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.statusFilter()) {
      filters.status = this.statusFilter();
    }

    this.contributionsService.getContributions(filters).subscribe({
      next: (response) => {
        this.contributions.set(response.data);
        this.totalItems.set(response.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los aportes');
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    const targetMonth = this.currentTargetMonth();
    this.contributionsService.getMonthlySummary(targetMonth).subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.toast.error('Error al cargar el resumen')
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadContributions();
    }, 300);
  }

  onStatusChange(value: string | number): void {
    this.statusFilter.set(String(value));
    this.currentPage.set(1);
    this.loadContributions();
  }

  onMonthChange(value: string | number): void {
    this.selectedMonth.set(String(value));
    this.currentPage.set(1);
    this.loadContributions();
    this.loadSummary();
  }

  onYearChange(value: string | number): void {
    this.selectedYear.set(String(value));
    this.currentPage.set(1);
    this.loadContributions();
    this.loadSummary();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadContributions();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.loadContributions();
  }

  onRowClick(contribution: Contribution): void {
    this.router.navigate(['/payments', contribution.id]);
  }

  onCreateContribution(): void {
    this.router.navigate(['/payments', 'new']);
  }

  onViewCalendar(): void {
    this.router.navigate(['/payments', 'calendar']);
  }

  onDeleteContribution(contribution: Contribution): void {
    this.contributionToDelete.set(contribution);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const contribution = this.contributionToDelete();
    if (!contribution) return;

    this.contributionsService.deleteContribution(contribution.id).subscribe({
      next: () => {
        this.toast.success('Aporte eliminado correctamente');
        this.showDeleteModal.set(false);
        this.contributionToDelete.set(null);
        this.loadContributions();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al eliminar el aporte');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.contributionToDelete.set(null);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatMonth(targetMonth: string): string {
    if (!targetMonth) return '-';
    const [year, month] = targetMonth.split('-');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${monthNames[Number(month) - 1]} ${year}`;
  }
}
