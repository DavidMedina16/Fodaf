import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type TrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  subtitle = input<string>('');
  variant = input<StatCardVariant>('default');
  icon = input<'money' | 'users' | 'chart' | 'calendar' | 'percent' | 'wallet'>('money');
  trend = input<TrendDirection | null>(null);
  trendValue = input<string>('');
}
