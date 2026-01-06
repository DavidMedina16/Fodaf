import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent, CardComponent } from '@shared/components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, CardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // Placeholder data
  readonly stats = [
    { title: 'Total Ahorrado', value: '$12,450,000', icon: 'money' as const, variant: 'success' as const, trend: 'up' as const, trendValue: '+12%' },
    { title: 'Miembros Activos', value: '24', icon: 'users' as const, variant: 'primary' as const },
    { title: 'Préstamos Activos', value: '8', icon: 'wallet' as const, variant: 'warning' as const },
    { title: 'Próximo Pago', value: '15 Ene', icon: 'calendar' as const, variant: 'info' as const },
  ];
}
