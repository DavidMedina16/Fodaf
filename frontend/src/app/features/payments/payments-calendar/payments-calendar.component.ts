import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CardComponent,
  SelectComponent,
  LoadingSpinnerComponent,
} from '@shared/components';
import { ToastService } from '@shared/services/toast.service';
import { ContributionsService } from '../services/contributions.service';
import { MembersService } from '@features/members/services/members.service';
import { User } from '@core/models/user.model';
import { YearlySummary } from '@core/models/contribution.model';

interface MemberYearStatus {
  member: User;
  months: { month: string; status: string; amount: number | null }[];
}

@Component({
  selector: 'app-payments-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    SelectComponent,
    LoadingSpinnerComponent,
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
          <h1 class="page__title">Calendario de Aportes</h1>
          <p class="page__subtitle">Vista mensual del estado de aportes por miembro</p>
        </div>
        <app-select
          [value]="selectedYear()"
          [options]="yearOptions"
          (selectionChange)="onYearChange($event)"
        ></app-select>
      </header>

      @if (loading()) {
        <app-card>
          <div class="loading-container">
            <app-loading-spinner text="Cargando calendario..."></app-loading-spinner>
          </div>
        </app-card>
      } @else {
        <!-- Yearly Summary -->
        @if (yearlySummary()) {
          <div class="summary-row">
            <app-card class="summary-card">
              <div class="summary-item">
                <span class="summary-label">Total Esperado</span>
                <span class="summary-value">{{ formatCurrency(yearlySummary()!.totals.totalExpected) }}</span>
              </div>
            </app-card>
            <app-card class="summary-card summary-card--success">
              <div class="summary-item">
                <span class="summary-label">Total Pagado</span>
                <span class="summary-value">{{ formatCurrency(yearlySummary()!.totals.totalPaid) }}</span>
              </div>
            </app-card>
            <app-card class="summary-card summary-card--warning">
              <div class="summary-item">
                <span class="summary-label">Pendiente</span>
                <span class="summary-value">{{ formatCurrency(yearlySummary()!.totals.totalPending) }}</span>
              </div>
            </app-card>
            <app-card class="summary-card summary-card--danger">
              <div class="summary-item">
                <span class="summary-label">Vencido</span>
                <span class="summary-value">{{ formatCurrency(yearlySummary()!.totals.totalOverdue) }}</span>
              </div>
            </app-card>
          </div>
        }

        <!-- Calendar Grid -->
        <app-card>
          <div class="calendar-container">
            <table class="calendar-table">
              <thead>
                <tr>
                  <th class="member-header">Miembro</th>
                  @for (month of monthNames; track month; let i = $index) {
                    <th class="month-header">{{ month }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (memberStatus of membersStatus(); track memberStatus.member.id) {
                  <tr>
                    <td class="member-cell">
                      <span class="member-name">{{ memberStatus.member.firstName }} {{ memberStatus.member.lastName }}</span>
                    </td>
                    @for (monthData of memberStatus.months; track monthData.month) {
                      <td
                        class="status-cell"
                        [class.status-cell--paid]="monthData.status === 'Pagado'"
                        [class.status-cell--pending]="monthData.status === 'Pendiente'"
                        [class.status-cell--overdue]="monthData.status === 'Vencido'"
                        [class.status-cell--empty]="monthData.status === 'Sin registro'"
                        [title]="getTooltip(memberStatus.member, monthData)"
                      >
                        @if (monthData.status === 'Pagado') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        } @else if (monthData.status === 'Pendiente') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        } @else if (monthData.status === 'Vencido') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        } @else {
                          <span class="empty-dot"></span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--paid"></span>
              <span>Pagado</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--pending"></span>
              <span>Pendiente</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--overdue"></span>
              <span>Vencido</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--empty"></span>
              <span>Sin registro</span>
            </div>
          </div>
        </app-card>
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

        @media (max-width: 640px) {
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

    .loading-container {
      display: flex;
      justify-content: center;
      padding: $spacing-12;
    }

    .summary-row {
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

    .summary-card {
      &--success { border-left: 3px solid $success; }
      &--warning { border-left: 3px solid $warning; }
      &--danger { border-left: 3px solid $danger; }
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: $spacing-1;
    }

    .summary-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .summary-value {
      font-size: $font-size-xl;
      font-weight: 600;
    }

    .calendar-container {
      overflow-x: auto;
      margin: -$spacing-4;
      padding: $spacing-4;
    }

    .calendar-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;

      th, td {
        padding: $spacing-3;
        text-align: center;
        border: 1px solid $border-color;
      }

      th {
        background: $bg-body;
        font-weight: 600;
        font-size: $font-size-sm;
      }
    }

    .member-header {
      text-align: left !important;
      min-width: 180px;
    }

    .month-header {
      min-width: 50px;
      font-size: $font-size-xs !important;
    }

    .member-cell {
      text-align: left !important;
    }

    .member-name {
      font-weight: 500;
      font-size: $font-size-sm;
    }

    .status-cell {
      cursor: pointer;
      transition: background-color 0.2s;

      &--paid {
        background-color: rgba($success, 0.1);
        color: $success;

        &:hover { background-color: rgba($success, 0.2); }
      }

      &--pending {
        background-color: rgba($warning, 0.1);
        color: $warning;

        &:hover { background-color: rgba($warning, 0.2); }
      }

      &--overdue {
        background-color: rgba($danger, 0.1);
        color: $danger;

        &:hover { background-color: rgba($danger, 0.2); }
      }

      &--empty {
        color: $text-secondary;

        &:hover { background-color: $bg-body; }
      }
    }

    .empty-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $border-color;
    }

    .legend {
      display: flex;
      gap: $spacing-6;
      margin-top: $spacing-6;
      padding-top: $spacing-4;
      border-top: 1px solid $border-color;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: $border-radius-sm;

      &--paid { background: rgba($success, 0.3); }
      &--pending { background: rgba($warning, 0.3); }
      &--overdue { background: rgba($danger, 0.3); }
      &--empty { background: $border-color; }
    }
  `]
})
export class PaymentsCalendarComponent implements OnInit {
  private readonly contributionsService = inject(ContributionsService);
  private readonly membersService = inject(MembersService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  selectedYear = signal<string>(String(new Date().getFullYear()));
  members = signal<User[]>([]);
  membersStatus = signal<MemberYearStatus[]>([]);
  yearlySummary = signal<YearlySummary | null>(null);

  monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  yearOptions = this.generateYearOptions();

  ngOnInit(): void {
    this.loadData();
  }

  private generateYearOptions(): { value: string; label: string }[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push({ value: String(i), label: String(i) });
    }
    return years;
  }

  loadData(): void {
    this.loading.set(true);
    const year = Number(this.selectedYear());

    // Load members first
    this.membersService.getMembers({ limit: 100, isActive: true }).subscribe({
      next: (response) => {
        this.members.set(response.data);
        this.loadMembersStatus(response.data, year);
        this.loadYearlySummary(year);
      },
      error: () => {
        this.toast.error('Error al cargar los miembros');
        this.loading.set(false);
      }
    });
  }

  loadMembersStatus(members: User[], year: number): void {
    const statusPromises = members.map(member =>
      new Promise<MemberYearStatus>((resolve) => {
        this.contributionsService.getUserYearStatus(member.id, year).subscribe({
          next: (months) => resolve({ member, months }),
          error: () => resolve({
            member,
            months: this.monthNames.map((_, i) => ({
              month: `${year}-${String(i + 1).padStart(2, '0')}`,
              status: 'Sin registro',
              amount: null
            }))
          })
        });
      })
    );

    Promise.all(statusPromises).then(statuses => {
      this.membersStatus.set(statuses);
      this.loading.set(false);
    });
  }

  loadYearlySummary(year: number): void {
    this.contributionsService.getYearlySummary(year).subscribe({
      next: (summary) => this.yearlySummary.set(summary),
      error: () => this.toast.error('Error al cargar el resumen anual')
    });
  }

  onYearChange(value: string | number): void {
    this.selectedYear.set(String(value));
    this.loadData();
  }

  getTooltip(member: User, monthData: { month: string; status: string; amount: number | null }): string {
    const [year, month] = monthData.month.split('-');
    const monthName = this.monthNames[Number(month) - 1];

    if (monthData.status === 'Sin registro') {
      return `${member.firstName} - ${monthName} ${year}: Sin registro`;
    }

    const amount = monthData.amount ? this.formatCurrency(monthData.amount) : '';
    return `${member.firstName} - ${monthName} ${year}: ${monthData.status} ${amount}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  goBack(): void {
    this.router.navigate(['/payments']);
  }
}
