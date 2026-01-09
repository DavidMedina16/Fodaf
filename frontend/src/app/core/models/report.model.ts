export interface FundStatusReport {
  totalSavings: number;
  totalInvested: number;
  totalInvestmentReturns: number;
  totalLoansActive: number;
  totalLoansInterestPending: number;
  totalFinesPending: number;
  totalEventsRevenue: number;
  totalCapital: number;
  availableCapital: number;
  membersCount: number;
  activeLoansCount: number;
  activeInvestmentsCount: number;
  lastUpdated: string;
}

export interface DelinquentMember {
  userId: number;
  userName: string;
  overdueContributions: number;
  overdueAmount: number;
  pendingFines: number;
  pendingFinesAmount: number;
  totalDebt: number;
}

export interface DelinquencyReport {
  totalOverdueContributions: number;
  totalOverdueAmount: number;
  totalPendingFines: number;
  totalPendingFinesAmount: number;
  overdueMembers: DelinquentMember[];
}

export interface ActiveLoan {
  loanId: number;
  userId: number;
  userName: string;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  installmentsPaid: number;
  installmentsTotal: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface LoansReport {
  totalLoansRequested: number;
  totalLoansApproved: number;
  totalLoansRejected: number;
  totalLoansPaid: number;
  totalAmountLent: number;
  totalAmountPending: number;
  totalInterestEarned: number;
  totalInterestPending: number;
  activeLoans: ActiveLoan[];
}

export interface ContributionByMonth {
  month: string;
  count: number;
  amount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface ContributionByMember {
  userId: number;
  userName: string;
  totalContributions: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface ContributionsReport {
  totalContributions: number;
  totalAmount: number;
  byMonth: ContributionByMonth[];
  byMember: ContributionByMember[];
}

export interface ExportMember {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  totalContributions: number;
  activeLoans: number;
  pendingFines: number;
}

export interface ExportInvestment {
  id: number;
  bankName: string;
  amountInvested: number;
  interestRate: number;
  expectedReturn: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ExportData {
  generatedAt: string;
  fundStatus: FundStatusReport;
  delinquency: DelinquencyReport;
  loans: LoansReport;
  contributions: ContributionsReport;
  members: ExportMember[];
  investments: ExportInvestment[];
}
