import { User } from './user.model';

export interface Contribution {
  id: number;
  userId: number;
  amount: number;
  type: string;
  status: string;
  paymentDate?: string;
  targetMonth: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  creator?: User;
  [key: string]: unknown;
}

export interface CreateContributionRequest {
  userId: number;
  amount: number;
  type?: string;
  status?: string;
  paymentDate?: string;
  targetMonth: string;
}

export interface UpdateContributionRequest {
  amount?: number;
  type?: string;
  status?: string;
  paymentDate?: string;
  targetMonth?: string;
}

export interface MonthlySummary {
  targetMonth: string;
  totalExpected: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalMembers: number;
}

export interface YearlySummary {
  months: MonthlySummary[];
  totals: {
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export interface UserContributionStatus {
  month: string;
  status: string;
  amount: number | null;
}
