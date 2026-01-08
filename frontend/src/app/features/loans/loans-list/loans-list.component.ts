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
import { LoansService } from '../services/loans.service';
import { Loan, LoansSummary, LoansFilter } from '@core/models/loan.model';
import { LoanStatus } from '@core/models/enums';

@Component({
  selector: 'app-loans-list',
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
          <h1 class="page__title">Prestamos</h1>
          <p class="page__subtitle">Gestion de prestamos del fondo</p>
        </div>
        <div class="header-actions">
          <app-button variant="primary" (click)="onCreateLoan()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Solicitar prestamo
          </app-button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <app-stat-card
          title="Total Prestamos"
          [value]="String(summary()?.totalLoans || 0)"
          icon="users"
          variant="primary"
        ></app-stat-card>
        <app-stat-card
          title="Prestados"
          [value]="formatCurrency(summary()?.totalLent || 0)"
          [subtitle]="(summary()?.approvedLoans || 0) + ' activos'"
          icon="money"
          variant="success"
        ></app-stat-card>
        <app-stat-card
          title="Por Aprobar"
          [value]="(summary()?.pendingLoans || 0) + ' solicitudes'"
          [subtitle]="formatCurrency(summary()?.totalPending || 0)"
          icon="calendar"
          variant="warning"
        ></app-stat-card>
        <app-stat-card
          title="Tasa Actual"
          value="2% mensual"
          icon="percent"
          variant="info"
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
              placeholder="Estado"
              [options]="statusOptions"
              [value]="statusFilter()"
              (selectionChange)="onStatusChange($event)"
            ></app-select>
          </div>
        </div>

        <app-data-table
          [columns]="columns"
          [data]="loans()"
          [loading]="loading()"
          [paginated]="true"
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          emptyTitle="No hay prestamos"
          emptyDescription="No se encontraron prestamos para los filtros seleccionados"
          (pageChange)="onPageChange($event)"
          (sortChange)="onSortChange($event)"
          (rowClick)="onRowClick($event)"
        ></app-data-table>
      </app-card>

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar prestamo"
          [message]="'Estas seguro de eliminar este prestamo de ' + loanToDelete()?.user?.firstName + '?'"
          confirmText="Eliminar"
          confirmVariant="danger"
          (confirm)="confirmDelete()"
          (cancel)="cancelDelete()"
        ></app-confirm-modal>
      }

      @if (showApproveModal()) {
        <app-confirm-modal
          title="Aprobar prestamo"
          [message]="'Aprobar prestamo de ' + formatCurrency(loanToApprove()?.amount || 0) + ' para ' + loanToApprove()?.user?.firstName + '?'"
          confirmText="Aprobar"
          confirmVariant="success"
          (confirm)="confirmApprove()"
          (cancel)="cancelApprove()"
        ></app-confirm-modal>
      }

      @if (showRejectModal()) {
        <app-confirm-modal
          title="Rechazar prestamo"
          [message]="'Rechazar prestamo de ' + formatCurrency(loanToReject()?.amount || 0) + ' para ' + loanToReject()?.user?.firstName + '?'"
          confirmText="Rechazar"
          confirmVariant="danger"
          (confirm)="confirmReject()"
          (cancel)="cancelReject()"
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

      &--approved {
        background-color: rgba($success, 0.1);
        color: $success;
      }

      &--pending {
        background-color: rgba($warning, 0.1);
        color: $warning;
      }

      &--rejected {
        background-color: rgba($danger, 0.1);
        color: $danger;
      }

      &--paid {
        background-color: rgba($info, 0.1);
        color: $info;
      }
    }

    .actions-cell {
      display: flex;
      gap: $spacing-2;
      justify-content: flex-end;
    }
  `]
})
export class LoansListComponent implements OnInit {
  private readonly loansService = inject(LoansService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  loans = signal<Loan[]>([]);
  summary = signal<LoansSummary | null>(null);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  sortColumn = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  searchTerm = signal('');
  statusFilter = signal<string>('');

  // Delete modal
  showDeleteModal = signal(false);
  loanToDelete = signal<Loan | null>(null);

  // Approve modal
  showApproveModal = signal(false);
  loanToApprove = signal<Loan | null>(null);

  // Reject modal
  showRejectModal = signal(false);
  loanToReject = signal<Loan | null>(null);

  // Debounce search
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: LoanStatus.PENDING, label: 'Pendientes' },
    { value: LoanStatus.APPROVED, label: 'Aprobados' },
    { value: LoanStatus.PAID, label: 'Pagados' },
    { value: LoanStatus.REJECTED, label: 'Rechazados' },
  ];

  columns: TableColumn<Loan>[] = [
    {
      key: 'user',
      header: 'Solicitante',
      sortable: false,
      render: (_, row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : '-'
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      align: 'right',
      render: (value) => this.formatCurrency(Number(value))
    },
    {
      key: 'termMonths',
      header: 'Plazo',
      align: 'center',
      render: (value) => `${value} meses`
    },
    {
      key: 'interestRate',
      header: 'Tasa',
      align: 'center',
      render: (value) => `${value}%`
    },
    {
      key: 'monthlyPayment',
      header: 'Cuota',
      align: 'right',
      render: (value) => value ? this.formatCurrency(Number(value)) : '-'
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (value) => value as string
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString('es-CO') : '-'
    },
  ];

  ngOnInit(): void {
    this.loadLoans();
    this.loadSummary();
  }

  loadLoans(): void {
    this.loading.set(true);

    const filters: LoansFilter = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.statusFilter()) {
      filters.status = this.statusFilter();
    }

    this.loansService.getLoans(filters).subscribe({
      next: (response) => {
        this.loans.set(response.data);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los prestamos');
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.loansService.getSummary().subscribe({
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
      this.loadLoans();
    }, 300);
  }

  onStatusChange(value: string | number): void {
    this.statusFilter.set(String(value));
    this.currentPage.set(1);
    this.loadLoans();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadLoans();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.loadLoans();
  }

  onRowClick(loan: Loan): void {
    this.router.navigate(['/loans', loan.id]);
  }

  onCreateLoan(): void {
    this.router.navigate(['/loans', 'new']);
  }

  onApproveLoan(loan: Loan): void {
    this.loanToApprove.set(loan);
    this.showApproveModal.set(true);
  }

  confirmApprove(): void {
    const loan = this.loanToApprove();
    if (!loan) return;

    this.loansService.approveLoan(loan.id).subscribe({
      next: () => {
        this.toast.success('Prestamo aprobado correctamente');
        this.showApproveModal.set(false);
        this.loanToApprove.set(null);
        this.loadLoans();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al aprobar el prestamo');
      }
    });
  }

  cancelApprove(): void {
    this.showApproveModal.set(false);
    this.loanToApprove.set(null);
  }

  onRejectLoan(loan: Loan): void {
    this.loanToReject.set(loan);
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const loan = this.loanToReject();
    if (!loan) return;

    this.loansService.rejectLoan(loan.id).subscribe({
      next: () => {
        this.toast.success('Prestamo rechazado');
        this.showRejectModal.set(false);
        this.loanToReject.set(null);
        this.loadLoans();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al rechazar el prestamo');
      }
    });
  }

  cancelReject(): void {
    this.showRejectModal.set(false);
    this.loanToReject.set(null);
  }

  onDeleteLoan(loan: Loan): void {
    this.loanToDelete.set(loan);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const loan = this.loanToDelete();
    if (!loan) return;

    this.loansService.deleteLoan(loan.id).subscribe({
      next: () => {
        this.toast.success('Prestamo eliminado correctamente');
        this.showDeleteModal.set(false);
        this.loanToDelete.set(null);
        this.loadLoans();
        this.loadSummary();
      },
      error: () => {
        this.toast.error('Error al eliminar el prestamo');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.loanToDelete.set(null);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  protected readonly String = String;
}
