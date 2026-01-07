import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  StatCardComponent,
  CardComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent
} from '@shared/components';
import { AuthService } from '@core/services';

interface DashboardStats {
  totalSavings: number;
  totalMembers: number;
  activeLoans: number;
  pendingPayments: number;
  nextPaymentDate: string | null;
}

interface RecentActivity {
  id: number;
  type: 'payment' | 'loan' | 'event' | 'member';
  description: string;
  amount?: number;
  date: Date;
  status: 'completed' | 'pending' | 'active';
}

interface UpcomingPayment {
  id: number;
  memberName: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
}

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
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);

  loading = signal<boolean>(true);
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
        trend: 'up' as const,
        trendValue: '+12%',
        subtitle: 'vs. mes anterior'
      },
      {
        title: 'Miembros Activos',
        value: data.totalMembers.toString(),
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
        subtitle: `${data.pendingPayments} pagos pendientes`
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

    // Simular carga de datos (será reemplazado con llamadas API reales)
    setTimeout(() => {
      this.stats.set({
        totalSavings: 12450000,
        totalMembers: 24,
        activeLoans: 8,
        pendingPayments: 5,
        nextPaymentDate: '2024-01-15'
      });

      this.recentActivity.set([
        {
          id: 1,
          type: 'payment',
          description: 'Pago mensual - Juan Pérez',
          amount: 150000,
          date: new Date(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'loan',
          description: 'Préstamo aprobado - María García',
          amount: 500000,
          date: new Date(Date.now() - 86400000),
          status: 'active'
        },
        {
          id: 3,
          type: 'payment',
          description: 'Pago mensual - Carlos López',
          amount: 150000,
          date: new Date(Date.now() - 2 * 86400000),
          status: 'completed'
        },
        {
          id: 4,
          type: 'member',
          description: 'Nuevo miembro - Ana Martínez',
          date: new Date(Date.now() - 3 * 86400000),
          status: 'completed'
        },
        {
          id: 5,
          type: 'event',
          description: 'Evento de recaudación completado',
          amount: 850000,
          date: new Date(Date.now() - 5 * 86400000),
          status: 'completed'
        }
      ]);

      this.upcomingPayments.set([
        {
          id: 1,
          memberName: 'Carlos López',
          amount: 150000,
          dueDate: new Date(Date.now() + 2 * 86400000),
          daysUntilDue: 2
        },
        {
          id: 2,
          memberName: 'Ana Martínez',
          amount: 150000,
          dueDate: new Date(Date.now() + 5 * 86400000),
          daysUntilDue: 5
        },
        {
          id: 3,
          memberName: 'Pedro Sánchez',
          amount: 200000,
          dueDate: new Date(Date.now() + 7 * 86400000),
          daysUntilDue: 7
        }
      ]);

      this.loading.set(false);
    }, 500);
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
      payment: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      loan: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 12h6M12 9v6',
      event: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
      member: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'
    };
    return icons[type] || icons['payment'];
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      completed: 'activity-item__status--completed',
      pending: 'activity-item__status--pending',
      active: 'activity-item__status--active'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      completed: 'Completado',
      pending: 'Pendiente',
      active: 'Activo'
    };
    return labels[status] || status;
  }
}
