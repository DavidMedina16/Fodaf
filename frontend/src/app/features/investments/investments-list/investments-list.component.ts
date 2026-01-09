import { Component, OnInit, inject, signal } from '@angular/core';
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
import { InvestmentsService } from '../services/investments.service';
import { Investment, InvestmentsSummary, InvestmentsFilter } from '@core/models/investment.model';
import { InvestmentStatus } from '@core/models/enums';

@Component({
  selector: 'app-investments-list',
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
          <h1 class="page__title">Inversiones CDT</h1>
          <p class="page__subtitle">Certificados de deposito a termino del fondo</p>
        </div>
        <div class="header-actions">
          <app-button variant="primary" (click)="onCreateInvestment()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva inversion
          </app-button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <app-stat-card
          title="Total Inversiones"
          [value]="String(summary()?.totalInvestments || 0)"
          [subtitle]="(summary()?.activeInvestments || 0) + ' activas'"
          icon="chart"
          variant="primary"
        ></app-stat-card>
        <app-stat-card
          title="Capital Invertido"
          [value]="formatCurrency(summary()?.activeInvested || 0)"
          subtitle="En CDTs activos"
          icon="money"
          variant="success"
        ></app-stat-card>
        <app-stat-card
          title="Rendimiento Esperado"
          [value]="formatCurrency(summary()?.activeExpectedReturn || 0)"
          subtitle="Intereses por recibir"
          icon="chart"
          variant="info"
        ></app-stat-card>
        <app-stat-card
          title="Tasa Promedio"
          [value]="(summary()?.averageInterestRate || 0).toFixed(2) + '%'"
          subtitle="Anual"
          icon="percent"
          variant="warning"
        ></app-stat-card>
      </div>

      <!-- Upcoming maturities alert -->
      @if (summary()?.upcomingMaturities?.length) {
        <div class="alert alert--warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            <strong>{{ summary()?.upcomingMaturities?.length }}</strong> inversiones vencen en los proximos 30 dias
          </span>
        </div>
      }

      <app-card>
        <div class="filters">
          <div class="filters__search">
            <app-input
              placeholder="Buscar por banco..."
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
              placeholder="Estado"
              [options]="statusOptions"
              [value]="statusFilter()"
              (selectionChange)="onStatusChange($event)"
            ></app-select>
          </div>
        </div>

        <app-data-table
          [columns]="columns"
          [data]="investments()"
          [loading]="loading()"
          [paginated]="true"
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          emptyTitle="No hay inversiones"
          emptyDescription="No se encontraron inversiones CDT registradas"
          (pageChange)="onPageChange($event)"
          (sortChange)="onSortChange($event)"
          (rowClick)="onRowClick($event)"
        ></app-data-table>
      </app-card>

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar inversion"
          [message]="'Estas seguro de eliminar la inversion en ' + investmentToDelete()?.bankName + '?'"
          confirmText="Eliminar"
          confirmVariant="danger"
          (confirm)="confirmDelete()"
          (cancel)="cancelDelete()"
        ></app-confirm-modal>
      }

      @if (showFinishModal()) {
        <app-confirm-modal
          title="Finalizar inversion"
          [message]="'Marcar como finalizada la inversion en ' + investmentToFinish()?.bankName + ' por ' + formatCurrency(investmentToFinish()?.totalAtMaturity || 0) + '?'"
          confirmText="Finalizar"
          confirmVariant="success"
          (confirm)="confirmFinish()"
          (cancel)="cancelFinish()"
        ></app-confirm-modal>
      }

      @if (showRenewModal()) {
        <app-confirm-modal
          title="Renovar inversion"
          [message]="'Renovar la inversion en ' + investmentToRenew()?.bankName + ' reinvirtiendo capital + intereses (' + formatCurrency(investmentToRenew()?.totalAtMaturity || 0) + ')?'"
          confirmText="Renovar"
          confirmVariant="primary"
          (confirm)="confirmRenew()"
          (cancel)="cancelRenew()"
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

    .alert {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-4;
      border-radius: $border-radius-md;
      margin-bottom: $spacing-6;

      &--warning {
        background-color: rgba($warning, 0.1);
        color: $warning;
        border: 1px solid rgba($warning, 0.3);
      }

      svg {
        flex-shrink: 0;
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

      &--active {
        background-color: rgba($success, 0.1);
        color: $success;
      }

      &--finished {
        background-color: rgba($text-secondary, 0.1);
        color: $text-secondary;
      }

      &--renewed {
        background-color: rgba($info, 0.1);
        color: $info;
      }
    }

    .days-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--urgent {
        background-color: rgba($danger, 0.1);
        color: $danger;
      }

      &--warning {
        background-color: rgba($warning, 0.1);
        color: $warning;
      }

      &--normal {
        background-color: rgba($text-secondary, 0.1);
        color: $text-secondary;
      }
    }
  `]
})
export class InvestmentsListComponent implements OnInit {
  private readonly investmentsService = inject(InvestmentsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  investments = signal<Investment[]>([]);
  summary = signal<InvestmentsSummary | null>(null);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  sortColumn = signal('endDate');
  sortDirection = signal<'asc' | 'desc'>('asc');
  searchTerm = signal('');
  statusFilter = signal<string>('');

  // Delete modal
  showDeleteModal = signal(false);
  investmentToDelete = signal<Investment | null>(null);

  // Finish modal
  showFinishModal = signal(false);
  investmentToFinish = signal<Investment | null>(null);

  // Renew modal
  showRenewModal = signal(false);
  investmentToRenew = signal<Investment | null>(null);

  // Debounce search
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: InvestmentStatus.ACTIVE, label: 'Activas' },
    { value: InvestmentStatus.FINISHED, label: 'Finalizadas' },
    { value: InvestmentStatus.RENEWED, label: 'Renovadas' },
  ];

  columns: TableColumn<Investment>[] = [
    {
      key: 'bankName',
      header: 'Entidad',
      sortable: true,
    },
    {
      key: 'amountInvested',
      header: 'Capital',
      sortable: true,
      align: 'right',
      render: (value) => this.formatCurrency(Number(value))
    },
    {
      key: 'interestRate',
      header: 'Tasa',
      align: 'center',
      render: (value) => `${Number(value).toFixed(2)}%`
    },
    {
      key: 'termDays',
      header: 'Plazo',
      align: 'center',
      render: (value) => `${value} dias`
    },
    {
      key: 'expectedReturn',
      header: 'Rendimiento',
      align: 'right',
      render: (value) => this.formatCurrency(Number(value))
    },
    {
      key: 'endDate',
      header: 'Vencimiento',
      sortable: true,
      render: (value) => this.formatDate(value as string)
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (value) => value as string
    },
  ];

  ngOnInit(): void {
    this.loadInvestments();
    this.loadSummary();
  }

  loadInvestments(): void {
    this.loading.set(true);

    const filters: InvestmentsFilter = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.statusFilter()) {
      filters.status = this.statusFilter();
    }

    this.investmentsService.getInvestments(filters).subscribe({
      next: (response) => {
        this.investments.set(response.data);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las inversiones');
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.investmentsService.getSummary().subscribe({
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
      this.loadInvestments();
    }, 300);
  }

  onStatusChange(value: string | number): void {
    this.statusFilter.set(String(value));
    this.currentPage.set(1);
    this.loadInvestments();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadInvestments();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.loadInvestments();
  }

  onRowClick(investment: Investment): void {
    this.router.navigate(['/investments', investment.id]);
  }

  onCreateInvestment(): void {
    this.router.navigate(['/investments', 'new']);
  }

  onFinishInvestment(investment: Investment): void {
    this.investmentToFinish.set(investment);
    this.showFinishModal.set(true);
  }

  confirmFinish(): void {
    const investment = this.investmentToFinish();
    if (!investment) return;

    this.investmentsService.finishInvestment(investment.id).subscribe({
      next: () => {
        this.toast.success('Inversion finalizada correctamente');
        this.showFinishModal.set(false);
        this.investmentToFinish.set(null);
        this.loadInvestments();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al finalizar la inversion');
      }
    });
  }

  cancelFinish(): void {
    this.showFinishModal.set(false);
    this.investmentToFinish.set(null);
  }

  onRenewInvestment(investment: Investment): void {
    this.investmentToRenew.set(investment);
    this.showRenewModal.set(true);
  }

  confirmRenew(): void {
    const investment = this.investmentToRenew();
    if (!investment) return;

    this.investmentsService.renewInvestment(investment.id, { reinvestReturns: true }).subscribe({
      next: () => {
        this.toast.success('Inversion renovada correctamente');
        this.showRenewModal.set(false);
        this.investmentToRenew.set(null);
        this.loadInvestments();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al renovar la inversion');
      }
    });
  }

  cancelRenew(): void {
    this.showRenewModal.set(false);
    this.investmentToRenew.set(null);
  }

  onDeleteInvestment(investment: Investment): void {
    this.investmentToDelete.set(investment);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const investment = this.investmentToDelete();
    if (!investment) return;

    this.investmentsService.deleteInvestment(investment.id).subscribe({
      next: () => {
        this.toast.success('Inversion eliminada correctamente');
        this.showDeleteModal.set(false);
        this.investmentToDelete.set(null);
        this.loadInvestments();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al eliminar la inversion');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.investmentToDelete.set(null);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysRemaining(endDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  protected readonly String = String;
}
