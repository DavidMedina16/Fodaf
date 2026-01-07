import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardStats {
  totalSavings: number;
  activeMembers: number;
  activeLoans: number;
  pendingContributions: number;
  totalInvested: number;
  nextPaymentDate: string | null;
}

export type ActivityType = 'contribution' | 'loan' | 'fine' | 'investment';

export interface RecentActivity {
  id: number;
  type: ActivityType;
  description: string;
  amount: number;
  date: Date;
  userName: string;
}

export interface UpcomingPayment {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  targetMonth: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/dashboard/stats');
  }

  getRecentActivity(limit = 10): Observable<RecentActivity[]> {
    return this.api.get<RecentActivity[]>('/dashboard/recent-activity', { limit });
  }

  getUpcomingPayments(limit = 10): Observable<UpcomingPayment[]> {
    return this.api.get<UpcomingPayment[]>('/dashboard/upcoming-payments', { limit });
  }
}
