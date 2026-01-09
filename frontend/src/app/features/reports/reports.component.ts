import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { DataTableComponent, TableColumn } from '@shared/components/data-table/data-table.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '@shared/services/toast.service';
import { ReportsService } from './services/reports.service';
import {
  FundStatusReport,
  DelinquencyReport,
  LoansReport,
  ContributionsReport,
  ExportData,
  DelinquentMember,
  ActiveLoan,
} from '@core/models/report.model';

type ReportTab = 'fund-status' | 'delinquency' | 'loans' | 'contributions';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    StatCardComponent,
    DataTableComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="reports-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Reportes</h1>
          <p class="subtitle">
            Visualiza el estado del fondo y genera reportes exportables
          </p>
        </div>
        <div class="header-actions">
          <app-button
            variant="secondary"
            [loading]="exporting()"
            (click)="exportToExcel()"
          >
            <span class="btn-icon">\ud83d\udcca</span> Exportar Excel
          </app-button>
          <app-button
            variant="secondary"
            [loading]="exporting()"
            (click)="exportToPDF()"
          >
            <span class="btn-icon">\ud83d\udcc4</span> Exportar PDF
          </app-button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'fund-status'"
          (click)="setActiveTab('fund-status')"
        >
          Estado del Fondo
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'delinquency'"
          (click)="setActiveTab('delinquency')"
        >
          Morosidad
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'loans'"
          (click)="setActiveTab('loans')"
        >
          Pr\u00e9stamos
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'contributions'"
          (click)="setActiveTab('contributions')"
        >
          Aportes
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
        </div>
      } @else {
        <div class="tab-content">
          @switch (activeTab()) {
            @case ('fund-status') {
              @if (fundStatus()) {
                <div class="fund-status-report">
                  <!-- Summary Cards -->
                  <div class="stats-grid">
                    <app-stat-card
                      title="Capital Total"
                      [value]="formatCurrency(fundStatus()!.totalCapital)"
                      icon="wallet"
                      variant="primary"
                    />
                    <app-stat-card
                      title="Capital Disponible"
                      [value]="formatCurrency(fundStatus()!.availableCapital)"
                      icon="money"
                      variant="success"
                    />
                    <app-stat-card
                      title="Total Ahorrado"
                      [value]="formatCurrency(fundStatus()!.totalSavings)"
                      icon="money"
                      variant="info"
                    />
                    <app-stat-card
                      title="Miembros Activos"
                      [value]="fundStatus()!.membersCount.toString()"
                      icon="users"
                      variant="default"
                    />
                  </div>

                  <!-- Detailed Breakdown -->
                  <div class="breakdown-grid">
                    <app-card>
                      <h3 class="card-title">Inversiones</h3>
                      <div class="breakdown-items">
                        <div class="breakdown-item">
                          <span class="label">Total Invertido</span>
                          <span class="value">{{
                            formatCurrency(fundStatus()!.totalInvested)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Rendimientos Esperados</span>
                          <span class="value success">{{
                            formatCurrency(fundStatus()!.totalInvestmentReturns)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Inversiones Activas</span>
                          <span class="value">{{
                            fundStatus()!.activeInvestmentsCount
                          }}</span>
                        </div>
                      </div>
                    </app-card>

                    <app-card>
                      <h3 class="card-title">Pr\u00e9stamos</h3>
                      <div class="breakdown-items">
                        <div class="breakdown-item">
                          <span class="label">Capital Prestado</span>
                          <span class="value">{{
                            formatCurrency(fundStatus()!.totalLoansActive)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Intereses por Cobrar</span>
                          <span class="value success">{{
                            formatCurrency(
                              fundStatus()!.totalLoansInterestPending
                            )
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Pr\u00e9stamos Activos</span>
                          <span class="value">{{
                            fundStatus()!.activeLoansCount
                          }}</span>
                        </div>
                      </div>
                    </app-card>

                    <app-card>
                      <h3 class="card-title">Otros Ingresos</h3>
                      <div class="breakdown-items">
                        <div class="breakdown-item">
                          <span class="label">Multas Pendientes</span>
                          <span class="value warning">{{
                            formatCurrency(fundStatus()!.totalFinesPending)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Ingresos de Eventos</span>
                          <span class="value success">{{
                            formatCurrency(fundStatus()!.totalEventsRevenue)
                          }}</span>
                        </div>
                      </div>
                    </app-card>
                  </div>

                  <p class="last-updated">
                    \u00daltima actualizaci\u00f3n:
                    {{ formatDate(fundStatus()!.lastUpdated) }}
                  </p>
                </div>
              }
            }

            @case ('delinquency') {
              @if (delinquency()) {
                <div class="delinquency-report">
                  <div class="stats-grid">
                    <app-stat-card
                      title="Aportes Vencidos"
                      [value]="delinquency()!.totalOverdueContributions.toString()"
                      icon="calendar"
                      variant="danger"
                    />
                    <app-stat-card
                      title="Monto Vencido"
                      [value]="formatCurrency(delinquency()!.totalOverdueAmount)"
                      icon="money"
                      variant="danger"
                    />
                    <app-stat-card
                      title="Multas Pendientes"
                      [value]="delinquency()!.totalPendingFines.toString()"
                      icon="percent"
                      variant="warning"
                    />
                    <app-stat-card
                      title="Total Multas"
                      [value]="formatCurrency(delinquency()!.totalPendingFinesAmount)"
                      icon="money"
                      variant="warning"
                    />
                  </div>

                  <app-card>
                    <h3 class="card-title">Miembros con Deudas</h3>
                    @if (delinquency()!.overdueMembers.length > 0) {
                      <app-data-table
                        [columns]="$any(delinquencyColumns)"
                        [data]="$any(delinquency()!.overdueMembers)"
                        [loading]="false"
                      />
                    } @else {
                      <div class="empty-state">
                        <p>\ud83c\udf89 No hay miembros con deudas pendientes</p>
                      </div>
                    }
                  </app-card>
                </div>
              }
            }

            @case ('loans') {
              @if (loansReport()) {
                <div class="loans-report">
                  <div class="stats-grid">
                    <app-stat-card
                      title="Total Solicitados"
                      [value]="loansReport()!.totalLoansRequested.toString()"
                      icon="chart"
                      variant="default"
                    />
                    <app-stat-card
                      title="Aprobados"
                      [value]="loansReport()!.totalLoansApproved.toString()"
                      icon="chart"
                      variant="success"
                    />
                    <app-stat-card
                      title="Monto Prestado"
                      [value]="formatCurrency(loansReport()!.totalAmountLent)"
                      icon="money"
                      variant="primary"
                    />
                    <app-stat-card
                      title="Intereses Ganados"
                      [value]="formatCurrency(loansReport()!.totalInterestEarned)"
                      icon="percent"
                      variant="success"
                    />
                  </div>

                  <div class="breakdown-grid two-cols">
                    <app-card>
                      <h3 class="card-title">Resumen de Pr\u00e9stamos</h3>
                      <div class="breakdown-items">
                        <div class="breakdown-item">
                          <span class="label">Pendientes por Cobrar</span>
                          <span class="value warning">{{
                            formatCurrency(loansReport()!.totalAmountPending)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Intereses Pendientes</span>
                          <span class="value">{{
                            formatCurrency(loansReport()!.totalInterestPending)
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Pr\u00e9stamos Rechazados</span>
                          <span class="value danger">{{
                            loansReport()!.totalLoansRejected
                          }}</span>
                        </div>
                        <div class="breakdown-item">
                          <span class="label">Pr\u00e9stamos Pagados</span>
                          <span class="value success">{{
                            loansReport()!.totalLoansPaid
                          }}</span>
                        </div>
                      </div>
                    </app-card>

                    <app-card>
                      <h3 class="card-title">Pr\u00e9stamos Activos</h3>
                      @if (loansReport()!.activeLoans.length > 0) {
                        <app-data-table
                          [columns]="$any(loansColumns)"
                          [data]="$any(loansReport()!.activeLoans)"
                          [loading]="false"
                        />
                      } @else {
                        <div class="empty-state">
                          <p>No hay pr\u00e9stamos activos</p>
                        </div>
                      }
                    </app-card>
                  </div>
                </div>
              }
            }

            @case ('contributions') {
              @if (contributions()) {
                <div class="contributions-report">
                  <div class="year-selector">
                    <label>A\u00f1o:</label>
                    <select
                      [(ngModel)]="selectedYear"
                      (ngModelChange)="loadContributions()"
                      class="year-select"
                    >
                      @for (year of availableYears; track year) {
                        <option [value]="year">{{ year }}</option>
                      }
                    </select>
                  </div>

                  <div class="stats-grid">
                    <app-stat-card
                      title="Total Aportes"
                      [value]="contributions()!.totalContributions.toString()"
                      icon="chart"
                      variant="default"
                    />
                    <app-stat-card
                      title="Monto Total"
                      [value]="formatCurrency(contributions()!.totalAmount)"
                      icon="money"
                      variant="success"
                    />
                  </div>

                  <div class="breakdown-grid two-cols">
                    <app-card>
                      <h3 class="card-title">Aportes por Mes</h3>
                      @if (contributions()!.byMonth.length > 0) {
                        <div class="month-chart">
                          @for (month of contributions()!.byMonth; track month.month) {
                            <div class="month-bar">
                              <span class="month-label">{{
                                formatMonth(month.month)
                              }}</span>
                              <div class="bar-container">
                                <div
                                  class="bar paid"
                                  [style.width.%]="getBarWidth(month.paidCount, month.count)"
                                ></div>
                                <div
                                  class="bar pending"
                                  [style.width.%]="getBarWidth(month.pendingCount, month.count)"
                                ></div>
                                <div
                                  class="bar overdue"
                                  [style.width.%]="getBarWidth(month.overdueCount, month.count)"
                                ></div>
                              </div>
                              <span class="month-value">{{
                                formatCurrency(month.amount)
                              }}</span>
                            </div>
                          }
                        </div>
                        <div class="chart-legend">
                          <span class="legend-item">
                            <span class="dot paid"></span> Pagados
                          </span>
                          <span class="legend-item">
                            <span class="dot pending"></span> Pendientes
                          </span>
                          <span class="legend-item">
                            <span class="dot overdue"></span> Vencidos
                          </span>
                        </div>
                      } @else {
                        <div class="empty-state">
                          <p>No hay datos para este a\u00f1o</p>
                        </div>
                      }
                    </app-card>

                    <app-card>
                      <h3 class="card-title">Aportes por Miembro</h3>
                      @if (contributions()!.byMember.length > 0) {
                        <div class="member-list">
                          @for (
                            member of contributions()!.byMember;
                            track member.userId
                          ) {
                            <div class="member-row">
                              <span class="member-name">{{
                                member.userName
                              }}</span>
                              <div class="member-stats">
                                <span class="stat paid">{{
                                  member.paidCount
                                }}</span>
                                <span class="stat pending">{{
                                  member.pendingCount
                                }}</span>
                                <span class="stat overdue">{{
                                  member.overdueCount
                                }}</span>
                                <span class="stat total">{{
                                  formatCurrency(member.totalAmount)
                                }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="empty-state">
                          <p>No hay datos para este a\u00f1o</p>
                        </div>
                      }
                    </app-card>
                  </div>
                </div>
              }
            }
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-content h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      .btn-icon {
        margin-right: 0.5rem;
      }

      .tabs {
        display: flex;
        gap: 0.25rem;
        background: var(--bg-secondary);
        padding: 0.25rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        overflow-x: auto;
      }

      .tab {
        padding: 0.75rem 1.25rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .tab:hover {
        color: var(--text-primary);
        background: var(--bg-primary);
      }

      .tab.active {
        background: var(--primary-color);
        color: white;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 4rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .breakdown-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .breakdown-grid.two-cols {
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      }

      .card-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-color);
      }

      .breakdown-items {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .breakdown-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
      }

      .breakdown-item .label {
        color: var(--text-secondary);
      }

      .breakdown-item .value {
        font-weight: 600;
        color: var(--text-primary);
      }

      .breakdown-item .value.success {
        color: var(--success-color);
      }

      .breakdown-item .value.warning {
        color: var(--warning-color);
      }

      .breakdown-item .value.danger {
        color: var(--danger-color);
      }

      .last-updated {
        text-align: right;
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-top: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
      }

      .year-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .year-selector label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .year-select {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.875rem;
      }

      .month-chart {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .month-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .month-label {
        width: 80px;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .bar-container {
        flex: 1;
        display: flex;
        height: 20px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
      }

      .bar {
        height: 100%;
        transition: width 0.3s;
      }

      .bar.paid {
        background: var(--success-color);
      }

      .bar.pending {
        background: var(--warning-color);
      }

      .bar.overdue {
        background: var(--danger-color);
      }

      .month-value {
        width: 100px;
        text-align: right;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .chart-legend {
        display: flex;
        gap: 1.5rem;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .dot.paid {
        background: var(--success-color);
      }

      .dot.pending {
        background: var(--warning-color);
      }

      .dot.overdue {
        background: var(--danger-color);
      }

      .member-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
      }

      .member-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: var(--bg-secondary);
        border-radius: 6px;
      }

      .member-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .member-stats {
        display: flex;
        gap: 0.5rem;
      }

      .member-stats .stat {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .member-stats .stat.paid {
        background: rgba(34, 197, 94, 0.1);
        color: var(--success-color);
      }

      .member-stats .stat.pending {
        background: rgba(234, 179, 8, 0.1);
        color: var(--warning-color);
      }

      .member-stats .stat.overdue {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger-color);
      }

      .member-stats .stat.total {
        background: var(--bg-primary);
        color: var(--text-primary);
        min-width: 80px;
        text-align: right;
      }

      @media (max-width: 768px) {
        .reports-container {
          padding: 1rem;
        }

        .page-header {
          flex-direction: column;
        }

        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .breakdown-grid.two-cols {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  exporting = signal(false);
  activeTab = signal<ReportTab>('fund-status');

  fundStatus = signal<FundStatusReport | null>(null);
  delinquency = signal<DelinquencyReport | null>(null);
  loansReport = signal<LoansReport | null>(null);
  contributions = signal<ContributionsReport | null>(null);

  selectedYear = new Date().getFullYear();
  availableYears = this.generateYears();

  delinquencyColumns: TableColumn<DelinquentMember>[] = [
    { key: 'userName', header: 'Miembro' },
    {
      key: 'overdueContributions',
      header: 'Aportes Vencidos',
      align: 'center',
    },
    {
      key: 'overdueAmount',
      header: 'Monto Vencido',
      render: (value: unknown) => this.formatCurrency(value as number),
      align: 'right',
    },
    { key: 'pendingFines', header: 'Multas', align: 'center' },
    {
      key: 'totalDebt',
      header: 'Deuda Total',
      render: (value: unknown) => this.formatCurrency(value as number),
      align: 'right',
    },
  ];

  loansColumns: TableColumn<ActiveLoan>[] = [
    { key: 'userName', header: 'Miembro' },
    {
      key: 'amount',
      header: 'Monto',
      render: (value: unknown) => this.formatCurrency(value as number),
      align: 'right',
    },
    {
      key: 'pendingAmount',
      header: 'Pendiente',
      render: (value: unknown) => this.formatCurrency(value as number),
      align: 'right',
    },
    {
      key: 'installmentsPaid',
      header: 'Cuotas',
      render: (_value: unknown, row: ActiveLoan) =>
        `${row.installmentsPaid}/${row.installmentsTotal}`,
      align: 'center',
    },
  ];

  ngOnInit(): void {
    this.loadAllReports();
  }

  generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  }

  setActiveTab(tab: ReportTab): void {
    this.activeTab.set(tab);
  }

  loadAllReports(): void {
    this.loading.set(true);

    Promise.all([
      this.reportsService.getFundStatus().toPromise(),
      this.reportsService.getDelinquencyReport().toPromise(),
      this.reportsService.getLoansReport().toPromise(),
      this.reportsService.getContributionsReport(this.selectedYear).toPromise(),
    ])
      .then(([fundStatus, delinquency, loans, contributions]) => {
        this.fundStatus.set(fundStatus || null);
        this.delinquency.set(delinquency || null);
        this.loansReport.set(loans || null);
        this.contributions.set(contributions || null);
        this.loading.set(false);
      })
      .catch(() => {
        this.toast.error('Error al cargar los reportes');
        this.loading.set(false);
      });
  }

  loadContributions(): void {
    this.reportsService.getContributionsReport(this.selectedYear).subscribe({
      next: (data) => this.contributions.set(data),
      error: () => this.toast.error('Error al cargar aportes'),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  formatMonth(month: string): string {
    if (!month) return '';
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleString('es-CO', { month: 'short' }).toUpperCase();
  }

  getBarWidth(count: number, total: number): number {
    if (total === 0) return 0;
    return (count / total) * 100;
  }

  async exportToExcel(): Promise<void> {
    this.exporting.set(true);
    try {
      const data = await this.reportsService.getExportData().toPromise();
      if (!data) throw new Error('No data');

      const { utils, writeFile } = await import('xlsx');

      const wb = utils.book_new();

      // Fund Status sheet
      const fundStatusData = [
        ['Estado del Fondo', ''],
        ['Capital Total', data.fundStatus.totalCapital],
        ['Capital Disponible', data.fundStatus.availableCapital],
        ['Total Ahorrado', data.fundStatus.totalSavings],
        ['Total Invertido', data.fundStatus.totalInvested],
        ['Rendimientos Inversiones', data.fundStatus.totalInvestmentReturns],
        ['Pr\u00e9stamos Activos', data.fundStatus.totalLoansActive],
        ['Intereses Pendientes', data.fundStatus.totalLoansInterestPending],
        ['Multas Pendientes', data.fundStatus.totalFinesPending],
        ['Ingresos Eventos', data.fundStatus.totalEventsRevenue],
        ['Miembros Activos', data.fundStatus.membersCount],
      ];
      const ws1 = utils.aoa_to_sheet(fundStatusData);
      utils.book_append_sheet(wb, ws1, 'Estado del Fondo');

      // Delinquency sheet
      const delinquencyData = [
        [
          'Miembro',
          'Aportes Vencidos',
          'Monto Vencido',
          'Multas Pendientes',
          'Monto Multas',
          'Deuda Total',
        ],
        ...data.delinquency.overdueMembers.map((m) => [
          m.userName,
          m.overdueContributions,
          m.overdueAmount,
          m.pendingFines,
          m.pendingFinesAmount,
          m.totalDebt,
        ]),
      ];
      const ws2 = utils.aoa_to_sheet(delinquencyData);
      utils.book_append_sheet(wb, ws2, 'Morosidad');

      // Loans sheet
      const loansData = [
        [
          'Miembro',
          'Monto',
          'Total a Pagar',
          'Pagado',
          'Pendiente',
          'Cuotas Pagadas',
          'Total Cuotas',
          'Estado',
        ],
        ...data.loans.activeLoans.map((l) => [
          l.userName,
          l.amount,
          l.totalAmount,
          l.paidAmount,
          l.pendingAmount,
          l.installmentsPaid,
          l.installmentsTotal,
          l.status,
        ]),
      ];
      const ws3 = utils.aoa_to_sheet(loansData);
      utils.book_append_sheet(wb, ws3, 'Pr\u00e9stamos');

      // Members sheet
      const membersData = [
        [
          'ID',
          'Nombre',
          'Email',
          'Activo',
          'Total Aportes',
          'Pr\u00e9stamos Activos',
          'Multas Pendientes',
        ],
        ...data.members.map((m) => [
          m.id,
          m.name,
          m.email,
          m.isActive ? 'S\u00ed' : 'No',
          m.totalContributions,
          m.activeLoans,
          m.pendingFines,
        ]),
      ];
      const ws4 = utils.aoa_to_sheet(membersData);
      utils.book_append_sheet(wb, ws4, 'Miembros');

      // Investments sheet
      const investmentsData = [
        [
          'ID',
          'Banco',
          'Monto Invertido',
          'Tasa',
          'Rendimiento Esperado',
          'Fecha Inicio',
          'Fecha Fin',
          'Estado',
        ],
        ...data.investments.map((i) => [
          i.id,
          i.bankName,
          i.amountInvested,
          `${i.interestRate}%`,
          i.expectedReturn,
          i.startDate,
          i.endDate,
          i.status,
        ]),
      ];
      const ws5 = utils.aoa_to_sheet(investmentsData);
      utils.book_append_sheet(wb, ws5, 'Inversiones');

      const fileName = `FODAF_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`;
      writeFile(wb, fileName);

      this.toast.success('Reporte Excel generado correctamente');
    } catch {
      this.toast.error('Error al generar el reporte Excel');
    } finally {
      this.exporting.set(false);
    }
  }

  async exportToPDF(): Promise<void> {
    this.exporting.set(true);
    try {
      const data = await this.reportsService.getExportData().toPromise();
      if (!data) throw new Error('No data');

      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.text('FODAF - Reporte General', pageWidth / 2, 20, {
        align: 'center',
      });

      doc.setFontSize(10);
      doc.text(
        `Generado: ${new Date().toLocaleString('es-CO')}`,
        pageWidth / 2,
        28,
        { align: 'center' }
      );

      // Fund Status
      doc.setFontSize(14);
      doc.text('Estado del Fondo', 14, 40);

      autoTable(doc, {
        startY: 45,
        head: [['Concepto', 'Valor']],
        body: [
          ['Capital Total', this.formatCurrency(data.fundStatus.totalCapital)],
          [
            'Capital Disponible',
            this.formatCurrency(data.fundStatus.availableCapital),
          ],
          ['Total Ahorrado', this.formatCurrency(data.fundStatus.totalSavings)],
          [
            'Total Invertido',
            this.formatCurrency(data.fundStatus.totalInvested),
          ],
          ['Miembros Activos', data.fundStatus.membersCount.toString()],
          [
            'Pr\u00e9stamos Activos',
            data.fundStatus.activeLoansCount.toString(),
          ],
          [
            'Inversiones Activas',
            data.fundStatus.activeInvestmentsCount.toString(),
          ],
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Delinquency
      const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY;
      doc.setFontSize(14);
      doc.text('Morosidad', 14, finalY1 + 15);

      if (data.delinquency.overdueMembers.length > 0) {
        autoTable(doc, {
          startY: finalY1 + 20,
          head: [['Miembro', 'Aportes Vencidos', 'Monto', 'Deuda Total']],
          body: data.delinquency.overdueMembers.slice(0, 10).map((m) => [
            m.userName,
            m.overdueContributions.toString(),
            this.formatCurrency(m.overdueAmount),
            this.formatCurrency(m.totalDebt),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] },
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay miembros con deudas pendientes', 14, finalY1 + 25);
      }

      // Add new page for loans
      doc.addPage();

      doc.setFontSize(14);
      doc.text('Pr\u00e9stamos Activos', 14, 20);

      if (data.loans.activeLoans.length > 0) {
        autoTable(doc, {
          startY: 25,
          head: [['Miembro', 'Monto', 'Pendiente', 'Cuotas']],
          body: data.loans.activeLoans.map((l) => [
            l.userName,
            this.formatCurrency(l.amount),
            this.formatCurrency(l.pendingAmount),
            `${l.installmentsPaid}/${l.installmentsTotal}`,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      const fileName = `FODAF_Reporte_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      this.toast.success('Reporte PDF generado correctamente');
    } catch {
      this.toast.error('Error al generar el reporte PDF');
    } finally {
      this.exporting.set(false);
    }
  }
}
