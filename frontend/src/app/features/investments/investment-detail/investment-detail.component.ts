import { Component, OnInit, inject, signal } from '@angular/core';
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
import { InvestmentsService } from '../services/investments.service';
import { InvestmentWithCalculations } from '@core/models/investment.model';
import { InvestmentStatus } from '@core/models/enums';

@Component({
  selector: 'app-investment-detail',
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
          <h1 class="page__title">Detalle de la inversion</h1>
          <p class="page__subtitle">Informacion completa del CDT</p>
        </div>
        @if (investment()?.status === InvestmentStatus.ACTIVE) {
          <div class="header-actions">
            <app-button variant="outline" size="sm" (click)="onEdit()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </app-button>
            <app-button variant="secondary" size="sm" (click)="onRenew()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Renovar
            </app-button>
            <app-button variant="primary" size="sm" (click)="onFinish()">
              Finalizar
            </app-button>
          </div>
        }
      </header>

      @if (loading()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando inversion..."></app-loading-spinner>
          </div>
        </app-card>
      } @else if (investment()) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <app-stat-card
            title="Capital invertido"
            [value]="formatCurrency(investment()?.amountInvested || 0)"
            icon="money"
            variant="primary"
          ></app-stat-card>
          <app-stat-card
            title="Rendimiento esperado"
            [value]="formatCurrency(investment()?.expectedReturn || 0)"
            [subtitle]="investment()?.interestRate + '% anual'"
            icon="chart"
            variant="success"
          ></app-stat-card>
          <app-stat-card
            title="Total al vencimiento"
            [value]="formatCurrency(investment()?.totalAtMaturity || 0)"
            icon="wallet"
            variant="info"
          ></app-stat-card>
          <app-stat-card
            title="Dias restantes"
            [value]="String(investment()?.daysRemaining || 0)"
            [subtitle]="investment()?.progress + '% completado'"
            icon="calendar"
            [variant]="getDaysVariant(investment()?.daysRemaining)"
          ></app-stat-card>
        </div>

        <!-- Progress Bar -->
        @if (investment()?.status === InvestmentStatus.ACTIVE) {
          <app-card class="progress-card">
            <div class="progress-header">
              <span class="progress-label">Progreso de la inversion</span>
              <span class="progress-value">{{ investment()?.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="investment()?.progress"></div>
            </div>
            <div class="progress-dates">
              <span>{{ formatDate(investment()?.startDate) }}</span>
              <span>{{ formatDate(investment()?.endDate) }}</span>
            </div>
          </app-card>
        }

        <div class="layout">
          <!-- Investment Info Card -->
          <app-card class="info-card">
            <h2 class="card-title">Informacion del CDT</h2>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Entidad financiera</span>
                <span class="info-value">{{ investment()?.bankName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Monto invertido</span>
                <span class="info-value">{{ formatCurrency(investment()?.amountInvested || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tasa de interes</span>
                <span class="info-value">{{ investment()?.interestRate }}% anual</span>
              </div>
              <div class="info-item">
                <span class="info-label">Plazo</span>
                <span class="info-value">{{ investment()?.termDays }} dias</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha apertura</span>
                <span class="info-value">{{ formatDate(investment()?.startDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha vencimiento</span>
                <span class="info-value">{{ formatDate(investment()?.endDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value status-badge" [class]="'status-badge--' + getStatusClass(investment()?.status)">
                  {{ investment()?.status }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Dias restantes</span>
                <span class="info-value">{{ investment()?.daysRemaining }} dias</span>
              </div>
            </div>

            @if (investment()?.notes) {
              <div class="notes-section">
                <span class="info-label">Notas</span>
                <p class="notes-text">{{ investment()?.notes }}</p>
              </div>
            }
          </app-card>

          <!-- Calculations Card -->
          <app-card class="calc-card">
            <h2 class="card-title">Rendimientos</h2>

            <div class="calc-grid">
              <div class="calc-item calc-item--highlight">
                <span class="calc-label">Total al vencimiento</span>
                <span class="calc-value calc-value--primary">{{ formatCurrency(investment()?.totalAtMaturity || 0) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Capital invertido</span>
                <span class="calc-value">{{ formatCurrency(investment()?.amountInvested || 0) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Rendimiento esperado</span>
                <span class="calc-value calc-value--success">+ {{ formatCurrency(investment()?.expectedReturn || 0) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Rendimiento acumulado</span>
                <span class="calc-value calc-value--info">{{ formatCurrency(investment()?.accruedReturn || 0) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Rendimiento diario</span>
                <span class="calc-value">{{ formatCurrency((investment()?.expectedReturn || 0) / (investment()?.termDays || 1)) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">Rendimiento mensual equiv.</span>
                <span class="calc-value">{{ formatCurrency(((investment()?.expectedReturn || 0) / (investment()?.termDays || 1)) * 30) }}</span>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Actions Card -->
        @if (investment()?.status === InvestmentStatus.ACTIVE) {
          <app-card class="actions-card">
            <h2 class="card-title">Acciones</h2>
            <div class="actions-grid">
              <button class="action-button action-button--edit" (click)="onEdit()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Editar inversion</span>
              </button>
              <button class="action-button action-button--renew" (click)="onRenew()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Renovar CDT</span>
              </button>
              <button class="action-button action-button--finish" (click)="onFinish()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Finalizar inversion</span>
              </button>
              <button class="action-button action-button--delete" (click)="onDelete()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Eliminar</span>
              </button>
            </div>
          </app-card>
        }
      }

      @if (showFinishModal()) {
        <app-confirm-modal
          title="Finalizar inversion"
          [message]="'Marcar como finalizada la inversion en ' + investment()?.bankName + '? El monto total sera de ' + formatCurrency(investment()?.totalAtMaturity || 0)"
          confirmText="Finalizar"
          confirmVariant="success"
          (confirm)="confirmFinish()"
          (cancel)="cancelFinish()"
        ></app-confirm-modal>
      }

      @if (showRenewModal()) {
        <app-confirm-modal
          title="Renovar inversion"
          [message]="'Renovar la inversion reinvirtiendo capital + intereses (' + formatCurrency(investment()?.totalAtMaturity || 0) + ')? Se creara una nueva inversion y esta se marcara como renovada.'"
          confirmText="Renovar"
          confirmVariant="primary"
          (confirm)="confirmRenew()"
          (cancel)="cancelRenew()"
        ></app-confirm-modal>
      }

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar inversion"
          [message]="'Esta seguro de eliminar esta inversion? Esta accion no se puede deshacer.'"
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
        flex-wrap: wrap;
      }

      &__header-content {
        flex: 1;
        min-width: 200px;
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
      gap: $spacing-2;
      flex-wrap: wrap;
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

    .progress-card {
      margin-bottom: $spacing-6;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-2;
    }

    .progress-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .progress-value {
      font-weight: 600;
      color: $primary;
    }

    .progress-bar {
      height: 8px;
      background: $bg-body;
      border-radius: $border-radius-full;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $primary, $success);
      border-radius: $border-radius-full;
      transition: width 0.3s ease;
    }

    .progress-dates {
      display: flex;
      justify-content: space-between;
      margin-top: $spacing-2;
      font-size: $font-size-xs;
      color: $text-secondary;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .notes-section {
      margin-top: $spacing-6;
      padding-top: $spacing-4;
      border-top: 1px solid $border-color;
    }

    .notes-text {
      margin: $spacing-2 0 0;
      color: $text-secondary;
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

    .calc-grid {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
    }

    .calc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-3;
      background: $bg-body;
      border-radius: $border-radius-md;

      &--highlight {
        background: rgba($primary, 0.1);
        border: 1px solid rgba($primary, 0.2);
      }
    }

    .calc-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .calc-value {
      font-weight: 600;
      font-family: $font-family-mono;

      &--primary {
        color: $primary;
        font-size: $font-size-lg;
      }

      &--success {
        color: $success;
      }

      &--info {
        color: $info;
      }
    }

    .actions-card {
      margin-top: $spacing-6;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $spacing-4;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-4;
      border: 1px solid $border-color;
      border-radius: $border-radius-md;
      background: $bg-card;
      cursor: pointer;
      transition: all 0.2s;

      span {
        font-size: $font-size-sm;
        font-weight: 500;
      }

      &:hover {
        border-color: $primary;
        background: rgba($primary, 0.05);
      }

      &--edit {
        color: $info;
        &:hover {
          border-color: $info;
          background: rgba($info, 0.05);
        }
      }

      &--renew {
        color: $primary;
        &:hover {
          border-color: $primary;
          background: rgba($primary, 0.05);
        }
      }

      &--finish {
        color: $success;
        &:hover {
          border-color: $success;
          background: rgba($success, 0.05);
        }
      }

      &--delete {
        color: $danger;
        &:hover {
          border-color: $danger;
          background: rgba($danger, 0.05);
        }
      }
    }
  `]
})
export class InvestmentDetailComponent implements OnInit {
  private readonly investmentsService = inject(InvestmentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  // State
  investment = signal<InvestmentWithCalculations | null>(null);
  loading = signal(true);

  // Modals
  showFinishModal = signal(false);
  showRenewModal = signal(false);
  showDeleteModal = signal(false);

  // Expose enum to template
  InvestmentStatus = InvestmentStatus;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvestment(Number(id));
    }
  }

  loadInvestment(id: number): void {
    this.loading.set(true);

    this.investmentsService.getInvestmentWithDetails(id).subscribe({
      next: (investment) => {
        this.investment.set(investment);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la inversion');
        this.loading.set(false);
        this.router.navigate(['/investments']);
      }
    });
  }

  onEdit(): void {
    const investment = this.investment();
    if (investment) {
      this.router.navigate(['/investments', investment.id, 'edit']);
    }
  }

  onFinish(): void {
    this.showFinishModal.set(true);
  }

  confirmFinish(): void {
    const investment = this.investment();
    if (!investment) return;

    this.investmentsService.finishInvestment(investment.id).subscribe({
      next: () => {
        this.toast.success('Inversion finalizada correctamente');
        this.showFinishModal.set(false);
        this.loadInvestment(investment.id);
      },
      error: () => {
        this.toast.error('Error al finalizar la inversion');
      }
    });
  }

  cancelFinish(): void {
    this.showFinishModal.set(false);
  }

  onRenew(): void {
    this.showRenewModal.set(true);
  }

  confirmRenew(): void {
    const investment = this.investment();
    if (!investment) return;

    this.investmentsService.renewInvestment(investment.id, { reinvestReturns: true }).subscribe({
      next: (newInvestment) => {
        this.toast.success('Inversion renovada correctamente');
        this.showRenewModal.set(false);
        this.router.navigate(['/investments', newInvestment.id]);
      },
      error: () => {
        this.toast.error('Error al renovar la inversion');
      }
    });
  }

  cancelRenew(): void {
    this.showRenewModal.set(false);
  }

  onDelete(): void {
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const investment = this.investment();
    if (!investment) return;

    this.investmentsService.deleteInvestment(investment.id).subscribe({
      next: () => {
        this.toast.success('Inversion eliminada correctamente');
        this.showDeleteModal.set(false);
        this.router.navigate(['/investments']);
      },
      error: () => {
        this.toast.error('Error al eliminar la inversion');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  getDaysVariant(days: number | undefined): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    if (days === undefined) return 'primary';
    if (days <= 0) return 'danger';
    if (days <= 30) return 'warning';
    return 'success';
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case InvestmentStatus.ACTIVE:
        return 'active';
      case InvestmentStatus.FINISHED:
        return 'finished';
      case InvestmentStatus.RENEWED:
        return 'renewed';
      default:
        return 'active';
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
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/investments']);
  }

  protected readonly String = String;
}
