import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  StatCardComponent,
  CardComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent
} from '@shared/components';
import {
  AuthService,
  DashboardService,
  DashboardStats,
  RecentActivity,
  UpcomingPayment
} from '@core/services';

interface QuickAction {
  path: string;
  icon: string;
  label: string;
  variant: 'primary' | 'success' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    CardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    DatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal<boolean>(true);
  error = signal<string>('');
  stats = signal<DashboardStats | null>(null);
  recentActivity = signal<RecentActivity[]>([]);
  upcomingPayments = signal<UpcomingPayment[]>([]);

  currentUser = this.authService.currentUser;
  userFirstName = computed(() => this.currentUser()?.firstName || 'Usuario');

  statCards = computed(() => {
    const data = this.stats();
    if (!data) return [];

    return [
      {
        title: 'Total Ahorrado',
        value: this.formatCurrency(data.totalSavings),
        icon: 'money' as const,
        variant: 'success' as const,
        trend: null,
        trendValue: '',
        subtitle: 'Contribuciones pagadas'
      },
      {
        title: 'Miembros Activos',
        value: data.activeMembers.toString(),
        icon: 'users' as const,
        variant: 'primary' as const,
        trend: null,
        trendValue: '',
        subtitle: ''
      },
      {
        title: 'Préstamos Activos',
        value: data.activeLoans.toString(),
        icon: 'wallet' as const,
        variant: 'warning' as const,
        trend: null,
        trendValue: '',
        subtitle: 'En curso'
      },
      {
        title: 'Próximo Pago',
        value: data.nextPaymentDate ? this.formatShortDate(data.nextPaymentDate) : 'N/A',
        icon: 'calendar' as const,
        variant: 'info' as const,
        trend: null,
        trendValue: '',
        subtitle: `${data.pendingContributions} pagos pendientes`
      }
    ];
  });

  quickActions: QuickAction[] = [
    { path: '/payments', icon: 'payment', label: 'Registrar Pago', variant: 'primary' },
    { path: '/loans', icon: 'loan', label: 'Solicitar Préstamo', variant: 'warning' },
    { path: '/members', icon: 'member', label: 'Ver Miembros', variant: 'success' }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      stats: this.dashboardService.getStats(),
      activity: this.dashboardService.getRecentActivity(5),
      payments: this.dashboardService.getUpcomingPayments(5)
    }).subscribe({
      next: ({ stats, activity, payments }) => {
        this.stats.set(stats);
        this.recentActivity.set(activity);
        this.upcomingPayments.set(payments);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error.set('Error al cargar los datos del dashboard. Verifica tu conexión.');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatShortDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short'
    }).format(d);
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      contribution: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      loan: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 12h6M12 9v6',
      fine: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      investment: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    };
    return icons[type] || icons['contribution'];
  }

  getActivityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      contribution: 'Aporte',
      loan: 'Préstamo',
      fine: 'Multa',
      investment: 'Inversión'
    };
    return labels[type] || type;
  }

  getActivityTypeClass(type: string): string {
    const classes: Record<string, string> = {
      contribution: 'activity-item__type--contribution',
      loan: 'activity-item__type--loan',
      fine: 'activity-item__type--fine',
      investment: 'activity-item__type--investment'
    };
    return classes[type] || '';
  }
}
