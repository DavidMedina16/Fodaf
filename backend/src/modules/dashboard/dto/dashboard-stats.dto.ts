export class DashboardStatsDto {
  totalSavings: number;
  activeMembers: number;
  activeLoans: number;
  pendingContributions: number;
  totalInvested: number;
  nextPaymentDate: string | null;
}
