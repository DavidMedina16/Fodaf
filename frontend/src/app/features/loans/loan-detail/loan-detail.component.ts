import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CardComponent,
  ButtonComponent,
  LoadingSpinnerComponent,
  StatCardComponent,
} from '@shared/components';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '@shared/services/toast.service';
import { LoansService } from '../services/loans.service';
import { Loan, LoanCalculation } from '@core/models/loan.model';
import { LoanStatus, InstallmentStatus } from '@core/models/enums';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    StatCardComponent,
    ConfirmModalComponent,
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
          <h1 class="page__title">Detalle del prestamo</h1>
          <p class="page__subtitle">Informacion completa y tabla de amortizacion</p>
        </div>
        @if (loan()?.status === LoanStatus.PENDING) {
          <div class="header-actions">
            <app-button variant="outline" size="sm" (click)="onReject()">
              Rechazar
            </app-button>
            <app-button variant="primary" size="sm" (click)="onApprove()">
              Aprobar
            </app-button>
          </div>
        }
      </header>

      @if (loading()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando prestamo..."></app-loading-spinner>
          </div>
        </app-card>
      } @else if (loan()) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <app-stat-card
            title="Monto prestado"
            [value]="formatCurrency(loan()?.amount || 0)"
            icon="money"
            variant="primary"
          ></app-stat-card>
          <app-stat-card
            title="Cuota mensual"
            [value]="formatCurrency(loan()?.monthlyPayment || 0)"
            icon="calendar"
            variant="info"
          ></app-stat-card>
          <app-stat-card
            title="Total a pagar"
            [value]="formatCurrency(loan()?.totalAmount || 0)"
            [subtitle]="'Interes: ' + formatCurrency(loan()?.totalInterest || 0)"
            icon="wallet"
            variant="warning"
          ></app-stat-card>
          <app-stat-card
            title="Estado"
            [value]="loan()?.status || '-'"
            [subtitle]="loan()?.termMonths + ' meses'"
            icon="chart"
            [variant]="getStatusVariant(loan()?.status)"
          ></app-stat-card>
        </div>

        <div class="layout">
          <!-- Loan Info Card -->
          <app-card class="info-card">
            <h2 class="card-title">Informacion del prestamo</h2>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Solicitante</span>
                <span class="info-value">{{ loan()?.user?.firstName }} {{ loan()?.user?.lastName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ loan()?.user?.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Monto solicitado</span>
                <span class="info-value">{{ formatCurrency(loan()?.amount || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tasa de interes</span>
                <span class="info-value">{{ loan()?.interestRate }}% mensual</span>
              </div>
              <div class="info-item">
                <span class="info-label">Plazo</span>
                <span class="info-value">{{ loan()?.termMonths }} meses</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cuota mensual</span>
                <span class="info-value">{{ formatCurrency(loan()?.monthlyPayment || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total intereses</span>
                <span class="info-value">{{ formatCurrency(loan()?.totalInterest || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total a pagar</span>
                <span class="info-value">{{ formatCurrency(loan()?.totalAmount || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha solicitud</span>
                <span class="info-value">{{ formatDate(loan()?.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha inicio</span>
                <span class="info-value">{{ loan()?.startDate ? formatDate(loan()?.startDate) : 'Pendiente' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha fin</span>
                <span class="info-value">{{ loan()?.endDate ? formatDate(loan()?.endDate) : 'Pendiente' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value status-badge" [class]="'status-badge--' + getStatusClass(loan()?.status)">
                  {{ loan()?.status }}
                </span>
              </div>
            </div>
          </app-card>

          <!-- Installments / Amortization Card -->
          <app-card class="amortization-card">
            <h2 class="card-title">
              @if (loan()?.installments?.length) {
                Cuotas del prestamo
              } @else {
                Tabla de amortizacion (proyectada)
              }
            </h2>

            @if (loadingSchedule()) {
              <div class="loading-container">
                <app-loading-spinner text="Cargando tabla..."></app-loading-spinner>
              </div>
            } @else {
              <div class="table-container">
                <table class="amortization-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vencimiento</th>
                      <th>Capital</th>
                      <th>Interes</th>
                      <th>Cuota</th>
                      <th>Saldo</th>
                      @if (loan()?.installments?.length) {
                        <th>Estado</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @if (loan()?.installments?.length) {
                      @for (installment of loan()?.installments; track installment.id) {
                        <tr [class.paid]="installment.status === InstallmentStatus.PAID" [class.overdue]="installment.status === InstallmentStatus.OVERDUE">
                          <td>{{ installment.installmentNumber }}</td>
                          <td>{{ formatDate(installment.dueDate) }}</td>
                          <td>{{ formatCurrency(installment.amountCapital) }}</td>
                          <td>{{ formatCurrency(installment.amountInterest) }}</td>
                          <td>{{ formatCurrency(installment.totalAmount) }}</td>
                          <td>{{ formatCurrency(installment.remainingBalance) }}</td>
                          <td>
                            <span class="status-pill" [class]="'status-pill--' + getInstallmentStatusClass(installment.status)">
                              {{ installment.status }}
                            </span>
                          </td>
                        </tr>
                      }
                    } @else if (schedule()?.amortizationSchedule?.length) {
                      @for (row of schedule()?.amortizationSchedule; track row.installmentNumber) {
                        <tr>
                          <td>{{ row.installmentNumber }}</td>
                          <td>{{ formatDate(row.dueDate) }}</td>
                          <td>{{ formatCurrency(row.amountCapital) }}</td>
                          <td>{{ formatCurrency(row.amountInterest) }}</td>
                          <td>{{ formatCurrency(row.totalAmount) }}</td>
                          <td>{{ formatCurrency(row.remainingBalance) }}</td>
                        </tr>
                      }
                    } @else {
                      <tr>
                        <td colspan="7" class="empty-cell">No hay cuotas registradas</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (schedule()?.amortizationSchedule?.length && !loan()?.installments?.length) {
                <div class="schedule-summary">
                  <div class="summary-row">
                    <span>Total capital:</span>
                    <strong>{{ formatCurrency(loan()?.amount || 0) }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Total intereses:</span>
                    <strong>{{ formatCurrency(schedule()?.totalInterest || 0) }}</strong>
                  </div>
                  <div class="summary-row summary-row--highlight">
                    <span>Total a pagar:</span>
                    <strong>{{ formatCurrency(schedule()?.totalAmount || 0) }}</strong>
                  </div>
                </div>
              }
            }
          </app-card>
        </div>
      }

      @if (showApproveModal()) {
        <app-confirm-modal
          title="Aprobar prestamo"
          [message]="'Esta seguro de aprobar este prestamo de ' + formatCurrency(loan()?.amount || 0) + '? Se generaran las cuotas automaticamente.'"
          confirmText="Aprobar"
          confirmVariant="success"
          (confirm)="confirmApprove()"
          (cancel)="cancelApprove()"
        ></app-confirm-modal>
      }

      @if (showRejectModal()) {
        <app-confirm-modal
          title="Rechazar prestamo"
          [message]="'Esta seguro de rechazar este prestamo de ' + formatCurrency(loan()?.amount || 0) + '?'"
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

    .header-actions {
      display: flex;
      gap: $spacing-3;
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

    .layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: $spacing-6;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .card-title {
      font-size: $font-size-lg;
      font-weight: 600;
      margin: 0 0 $spacing-5;
      padding-bottom: $spacing-4;
      border-bottom: 1px solid $border-color;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: $spacing-12;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-4;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
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
      font-weight: 500;
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

    .table-container {
      overflow-x: auto;
    }

    .amortization-table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;

      th, td {
        padding: $spacing-3;
        text-align: right;
        border-bottom: 1px solid $border-color;

        &:first-child {
          text-align: center;
          width: 50px;
        }

        &:nth-child(2) {
          text-align: left;
        }

        &:last-child {
          text-align: center;
        }
      }

      th {
        font-weight: 600;
        color: $text-secondary;
        background: $bg-body;
        white-space: nowrap;
      }

      td {
        font-family: $font-family-mono;
      }

      tr.paid {
        background: rgba($success, 0.05);
      }

      tr.overdue {
        background: rgba($danger, 0.05);
      }
    }

    .empty-cell {
      text-align: center !important;
      color: $text-secondary;
      padding: $spacing-8 !important;
    }

    .status-pill {
      display: inline-flex;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;
      font-family: $font-family-base;

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

    .schedule-summary {
      margin-top: $spacing-4;
      padding-top: $spacing-4;
      border-top: 1px solid $border-color;
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: $font-size-sm;

      &--highlight {
        margin-top: $spacing-2;
        padding-top: $spacing-2;
        border-top: 1px dashed $border-color;
        font-weight: 600;
      }
    }
  `]
})
export class LoanDetailComponent implements OnInit {
  private readonly loansService = inject(LoansService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // State
  loan = signal<Loan | null>(null);
  schedule = signal<LoanCalculation | null>(null);
  loading = signal(true);
  loadingSchedule = signal(false);

  // Modals
  showApproveModal = signal(false);
  showRejectModal = signal(false);

  // Expose enums to template
  LoanStatus = LoanStatus;
  InstallmentStatus = InstallmentStatus;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLoan(Number(id));
    }
  }

  loadLoan(id: number): void {
    this.loading.set(true);

    this.loansService.getLoan(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);

        if (!loan.installments?.length) {
          this.loadAmortizationSchedule(id);
        }
      },
      error: () => {
        this.toast.error('Error al cargar el prestamo');
        this.loading.set(false);
        this.router.navigate(['/loans']);
      }
    });
  }

  loadAmortizationSchedule(id: number): void {
    this.loadingSchedule.set(true);

    this.loansService.getAmortizationSchedule(id).subscribe({
      next: (schedule) => {
        this.schedule.set(schedule);
        this.loadingSchedule.set(false);
      },
      error: () => {
        this.loadingSchedule.set(false);
      }
    });
  }

  onApprove(): void {
    this.showApproveModal.set(true);
  }

  confirmApprove(): void {
    const loan = this.loan();
    if (!loan) return;

    this.loansService.approveLoan(loan.id).subscribe({
      next: (updatedLoan) => {
        this.toast.success('Prestamo aprobado correctamente');
        this.showApproveModal.set(false);
        this.loan.set(updatedLoan);
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al aprobar el prestamo';
        this.toast.error(message);
      }
    });
  }

  cancelApprove(): void {
    this.showApproveModal.set(false);
  }

  onReject(): void {
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const loan = this.loan();
    if (!loan) return;

    this.loansService.rejectLoan(loan.id).subscribe({
      next: (updatedLoan) => {
        this.toast.success('Prestamo rechazado');
        this.showRejectModal.set(false);
        this.loan.set(updatedLoan);
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al rechazar el prestamo';
        this.toast.error(message);
      }
    });
  }

  cancelReject(): void {
    this.showRejectModal.set(false);
  }

  getStatusVariant(status: string | undefined): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case LoanStatus.APPROVED:
        return 'success';
      case LoanStatus.PENDING:
        return 'warning';
      case LoanStatus.REJECTED:
        return 'danger';
      case LoanStatus.PAID:
        return 'info';
      default:
        return 'primary';
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case LoanStatus.APPROVED:
        return 'approved';
      case LoanStatus.PENDING:
        return 'pending';
      case LoanStatus.REJECTED:
        return 'rejected';
      case LoanStatus.PAID:
        return 'paid';
      default:
        return 'pending';
    }
  }

  getInstallmentStatusClass(status: string | undefined): string {
    switch (status) {
      case InstallmentStatus.PAID:
        return 'paid';
      case InstallmentStatus.OVERDUE:
        return 'overdue';
      default:
        return 'pending';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CO');
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }
}
