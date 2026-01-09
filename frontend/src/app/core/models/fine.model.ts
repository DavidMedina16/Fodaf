import { User } from './user.model';
import { FineStatus } from './enums';

export { FineStatus };

export enum FineCategory {
  LATE_PAYMENT = 'Mora',
  ABSENCE = 'Inasistencia',
  RULE_VIOLATION = 'Incumplimiento',
  OTHER = 'Otro',
}

export interface Fine {
  id: number;
  userId: number;
  amount: number;
  reason?: string;
  category: FineCategory;
  status: FineStatus;
  paidAt?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  creator?: User;
}

export interface FinesSummary {
  totalFines: number;
  pendingFines: number;
  paidFines: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  byCategory: { category: string; count: number; amount: number }[];
}

export interface UserFinesSummary {
  total: number;
  pending: number;
  pendingAmount: number;
}

export interface FinesFilter {
  userId?: number;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFines {
  data: Fine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFineDto {
  userId: number;
  amount: number;
  reason?: string;
  category?: FineCategory;
  status?: FineStatus;
}

export interface UpdateFineDto extends Partial<CreateFineDto> {}
