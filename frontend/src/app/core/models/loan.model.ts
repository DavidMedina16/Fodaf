import { User } from './user.model';
import { LoanStatus, InstallmentStatus } from './enums';

export interface LoanInstallment {
  id: number;
  loanId: number;
  installmentNumber: number;
  amountCapital: number;
  amountInterest: number;
  totalAmount: number;
  remainingBalance: number;
  dueDate: string;
  paymentDate?: string;
  status: InstallmentStatus | string;
  createdBy?: number;
  createdAt?: string;
}

export interface Loan {
  id: number;
  userId: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment?: number;
  totalAmount?: number;
  totalInterest?: number;
  startDate?: string;
  endDate?: string;
  status: LoanStatus | string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  creator?: User;
  installments?: LoanInstallment[];
  [key: string]: unknown;
}

export interface CreateLoanRequest {
  userId: number;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate?: string;
  status?: string;
}

export interface UpdateLoanRequest {
  userId?: number;
  amount?: number;
  interestRate?: number;
  termMonths?: number;
  startDate?: string;
  status?: string;
}

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: string;
  amountCapital: number;
  amountInterest: number;
  totalAmount: number;
  remainingBalance: number;
}

export interface LoanCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

export interface CreditLimitInfo {
  totalContributions: number;
  activeLoansAmount: number;
  pendingLoansAmount: number;
  creditLimit: number;
  availableCredit: number;
  canRequestLoan: boolean;
  reasons: string[];
}

export interface LoansSummary {
  totalLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  totalLent: number;
  totalPending: number;
}

export interface PaginatedLoans {
  data: Loan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoansFilter {
  userId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
