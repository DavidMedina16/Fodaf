import { InvestmentStatus } from './enums';

export interface Investment {
  id: number;
  bankName: string;
  amountInvested: number;
  interestRate: number;
  termDays: number;
  expectedReturn: number;
  totalAtMaturity: number;
  startDate: string;
  endDate: string;
  status: InvestmentStatus | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface InvestmentWithCalculations extends Investment {
  daysRemaining: number;
  accruedReturn: number;
  progress: number;
}

export interface CreateInvestmentRequest {
  bankName: string;
  amountInvested: number;
  interestRate: number;
  termDays: number;
  startDate: string;
  status?: InvestmentStatus;
  notes?: string;
}

export interface UpdateInvestmentRequest {
  bankName?: string;
  amountInvested?: number;
  interestRate?: number;
  termDays?: number;
  startDate?: string;
  status?: InvestmentStatus;
  notes?: string;
}

export interface InvestmentSimulation {
  amountInvested: number;
  interestRate: number;
  termDays: number;
  expectedReturn: number;
  totalAtMaturity: number;
  monthlyEquivalent: number;
}

export interface InvestmentsSummary {
  totalInvestments: number;
  activeInvestments: number;
  finishedInvestments: number;
  renewedInvestments: number;
  totalInvested: number;
  totalExpectedReturn: number;
  totalAtMaturity: number;
  activeInvested: number;
  activeExpectedReturn: number;
  upcomingMaturities: Investment[];
  averageInterestRate: number;
}

export interface PaginatedInvestments {
  data: Investment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvestmentsFilter {
  status?: string;
  bankName?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  page?: number;
  limit?: number;
}

export interface RenewInvestmentRequest {
  termDays?: number;
  interestRate?: number;
  reinvestReturns?: boolean;
}
