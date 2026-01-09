import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import {
  Contribution,
  ContributionStatus,
} from '../../entities/contribution.entity';
import { Loan, LoanStatus } from '../../entities/loan.entity';
import { LoanInstallment } from '../../entities/loan-installment.entity';
import {
  Investment,
  InvestmentStatus,
} from '../../entities/investment.entity';
import { Fine, FineStatus, FineCategory } from '../../entities/fine.entity';
import { User } from '../../entities/user.entity';
import { Event } from '../../entities/event.entity';
import { EventTransaction } from '../../entities/event-transaction.entity';

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
  lastUpdated: Date;
}

export interface DelinquencyReport {
  totalOverdueContributions: number;
  totalOverdueAmount: number;
  totalPendingFines: number;
  totalPendingFinesAmount: number;
  overdueMembers: {
    userId: number;
    userName: string;
    overdueContributions: number;
    overdueAmount: number;
    pendingFines: number;
    pendingFinesAmount: number;
    totalDebt: number;
  }[];
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
  activeLoans: {
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
    startDate: Date;
    endDate: Date;
  }[];
}

export interface ContributionsReport {
  totalContributions: number;
  totalAmount: number;
  byMonth: {
    month: string;
    count: number;
    amount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }[];
  byMember: {
    userId: number;
    userName: string;
    totalContributions: number;
    totalAmount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }[];
}

export interface ExportData {
  generatedAt: Date;
  fundStatus: FundStatusReport;
  delinquency: DelinquencyReport;
  loans: LoansReport;
  contributions: ContributionsReport;
  members: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    totalContributions: number;
    activeLoans: number;
    pendingFines: number;
  }[];
  investments: {
    id: number;
    bankName: string;
    amountInvested: number;
    interestRate: number;
    expectedReturn: number;
    startDate: Date;
    endDate: Date;
    status: string;
  }[];
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private readonly installmentRepository: Repository<LoanInstallment>,
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventTransaction)
    private readonly eventTransactionRepository: Repository<EventTransaction>,
  ) {}

  async getFundStatus(): Promise<FundStatusReport> {
    // Total de aportes pagados
    const contributionsResult = await this.contributionRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.amount), 0)', 'total')
      .where('c.status = :status', { status: ContributionStatus.PAID })
      .getRawOne();
    const totalSavings = parseFloat(contributionsResult.total) || 0;

    // Inversiones activas
    const investmentsResult = await this.investmentRepository
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.amountInvested), 0)', 'invested')
      .addSelect('COALESCE(SUM(i.expectedReturn), 0)', 'returns')
      .where('i.status = :status', { status: InvestmentStatus.ACTIVE })
      .getRawOne();
    const totalInvested = parseFloat(investmentsResult.invested) || 0;
    const totalInvestmentReturns = parseFloat(investmentsResult.returns) || 0;

    // Préstamos activos (aprobados pero no pagados)
    const loansResult = await this.loanRepository
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'principal')
      .addSelect('COALESCE(SUM(l.totalInterest), 0)', 'interest')
      .where('l.status = :status', { status: LoanStatus.APPROVED })
      .getRawOne();
    const totalLoansActive = parseFloat(loansResult.principal) || 0;
    const totalLoansInterestPending = parseFloat(loansResult.interest) || 0;

    // Multas pendientes
    const finesResult = await this.fineRepository
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.amount), 0)', 'total')
      .where('f.status = :status', { status: FineStatus.PENDING })
      .getRawOne();
    const totalFinesPending = parseFloat(finesResult.total) || 0;

    // Ingresos de eventos (transacciones tipo ingreso)
    const eventsResult = await this.eventTransactionRepository
      .createQueryBuilder('et')
      .select('COALESCE(SUM(et.amount), 0)', 'total')
      .where('et.type = :type', { type: 'income' })
      .getRawOne();
    const totalEventsRevenue = parseFloat(eventsResult.total) || 0;

    // Conteos
    const membersCount = await this.userRepository.count({
      where: { isActive: true },
    });

    const activeLoansCount = await this.loanRepository.count({
      where: { status: LoanStatus.APPROVED },
    });

    const activeInvestmentsCount = await this.investmentRepository.count({
      where: { status: InvestmentStatus.ACTIVE },
    });

    // Capital total = aportes + rendimientos inversiones + intereses préstamos + multas + eventos
    const totalCapital =
      totalSavings +
      totalInvestmentReturns +
      totalLoansInterestPending +
      totalFinesPending +
      totalEventsRevenue;

    // Capital disponible = capital total - préstamos activos - inversiones activas
    const availableCapital = totalCapital - totalLoansActive - totalInvested;

    return {
      totalSavings,
      totalInvested,
      totalInvestmentReturns,
      totalLoansActive,
      totalLoansInterestPending,
      totalFinesPending,
      totalEventsRevenue,
      totalCapital,
      availableCapital,
      membersCount,
      activeLoansCount,
      activeInvestmentsCount,
      lastUpdated: new Date(),
    };
  }

  async getDelinquencyReport(): Promise<DelinquencyReport> {
    // Aportes vencidos
    const overdueContributions = await this.contributionRepository.find({
      where: { status: ContributionStatus.OVERDUE },
      relations: ['user'],
    });

    const totalOverdueContributions = overdueContributions.length;
    const totalOverdueAmount = overdueContributions.reduce(
      (sum, c) => sum + parseFloat(c.amount.toString()),
      0,
    );

    // Multas pendientes
    const pendingFines = await this.fineRepository.find({
      where: { status: FineStatus.PENDING },
      relations: ['user'],
    });

    const totalPendingFines = pendingFines.length;
    const totalPendingFinesAmount = pendingFines.reduce(
      (sum, f) => sum + parseFloat(f.amount.toString()),
      0,
    );

    // Agrupar por miembro
    const memberDebtMap = new Map<
      number,
      {
        userName: string;
        overdueContributions: number;
        overdueAmount: number;
        pendingFines: number;
        pendingFinesAmount: number;
      }
    >();

    for (const contribution of overdueContributions) {
      const existing = memberDebtMap.get(contribution.userId) || {
        userName: contribution.user
          ? `${contribution.user.firstName} ${contribution.user.lastName}`
          : 'N/A',
        overdueContributions: 0,
        overdueAmount: 0,
        pendingFines: 0,
        pendingFinesAmount: 0,
      };
      existing.overdueContributions++;
      existing.overdueAmount += parseFloat(contribution.amount.toString());
      memberDebtMap.set(contribution.userId, existing);
    }

    for (const fine of pendingFines) {
      const existing = memberDebtMap.get(fine.userId) || {
        userName: fine.user
          ? `${fine.user.firstName} ${fine.user.lastName}`
          : 'N/A',
        overdueContributions: 0,
        overdueAmount: 0,
        pendingFines: 0,
        pendingFinesAmount: 0,
      };
      existing.pendingFines++;
      existing.pendingFinesAmount += parseFloat(fine.amount.toString());
      memberDebtMap.set(fine.userId, existing);
    }

    const overdueMembers = Array.from(memberDebtMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        overdueContributions: data.overdueContributions,
        overdueAmount: data.overdueAmount,
        pendingFines: data.pendingFines,
        pendingFinesAmount: data.pendingFinesAmount,
        totalDebt: data.overdueAmount + data.pendingFinesAmount,
      }))
      .sort((a, b) => b.totalDebt - a.totalDebt);

    return {
      totalOverdueContributions,
      totalOverdueAmount,
      totalPendingFines,
      totalPendingFinesAmount,
      overdueMembers,
    };
  }

  async getLoansReport(): Promise<LoansReport> {
    const loans = await this.loanRepository.find({
      relations: ['user', 'installments'],
      order: { createdAt: 'DESC' },
    });

    const totalLoansRequested = loans.length;
    const totalLoansApproved = loans.filter(
      (l) => l.status === LoanStatus.APPROVED || l.status === LoanStatus.PAID,
    ).length;
    const totalLoansRejected = loans.filter(
      (l) => l.status === LoanStatus.REJECTED,
    ).length;
    const totalLoansPaid = loans.filter(
      (l) => l.status === LoanStatus.PAID,
    ).length;

    let totalAmountLent = 0;
    let totalAmountPending = 0;
    let totalInterestEarned = 0;
    let totalInterestPending = 0;

    const activeLoans = loans
      .filter((l) => l.status === LoanStatus.APPROVED)
      .map((loan) => {
        const paidInstallments =
          loan.installments?.filter((i) => i.status === 'Pagado') || [];
        const paidAmount = paidInstallments.reduce(
          (sum, i) => sum + parseFloat(i.totalAmount?.toString() || '0'),
          0,
        );
        const paidInterest = paidInstallments.reduce(
          (sum, i) => sum + parseFloat(i.amountInterest?.toString() || '0'),
          0,
        );
        const totalAmount = parseFloat(loan.totalAmount?.toString() || '0');
        const pendingAmount = totalAmount - paidAmount;

        totalAmountLent += parseFloat(loan.amount.toString());
        totalAmountPending += pendingAmount;
        totalInterestEarned += paidInterest;
        totalInterestPending +=
          parseFloat(loan.totalInterest?.toString() || '0') - paidInterest;

        return {
          loanId: loan.id,
          userId: loan.userId,
          userName: loan.user
            ? `${loan.user.firstName} ${loan.user.lastName}`
            : 'N/A',
          amount: parseFloat(loan.amount.toString()),
          totalAmount,
          paidAmount,
          pendingAmount,
          installmentsPaid: paidInstallments.length,
          installmentsTotal: loan.termMonths,
          status: loan.status,
          startDate: loan.startDate,
          endDate: loan.endDate,
        };
      });

    // Incluir préstamos pagados en totales
    for (const loan of loans.filter((l) => l.status === LoanStatus.PAID)) {
      totalAmountLent += parseFloat(loan.amount.toString());
      totalInterestEarned += parseFloat(loan.totalInterest?.toString() || '0');
    }

    return {
      totalLoansRequested,
      totalLoansApproved,
      totalLoansRejected,
      totalLoansPaid,
      totalAmountLent,
      totalAmountPending,
      totalInterestEarned,
      totalInterestPending,
      activeLoans,
    };
  }

  async getContributionsReport(year?: number): Promise<ContributionsReport> {
    const currentYear = year || new Date().getFullYear();

    const contributions = await this.contributionRepository.find({
      where: {
        targetMonth: Between(`${currentYear}-01`, `${currentYear}-12`),
      },
      relations: ['user'],
      order: { targetMonth: 'ASC' },
    });

    const totalContributions = contributions.length;
    const totalAmount = contributions.reduce(
      (sum, c) => sum + parseFloat(c.amount.toString()),
      0,
    );

    // Agrupar por mes
    const monthMap = new Map<
      string,
      {
        count: number;
        amount: number;
        paidCount: number;
        pendingCount: number;
        overdueCount: number;
      }
    >();

    for (const contribution of contributions) {
      const month = contribution.targetMonth || 'Sin mes';
      const existing = monthMap.get(month) || {
        count: 0,
        amount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      };
      existing.count++;
      existing.amount += parseFloat(contribution.amount.toString());
      if (contribution.status === ContributionStatus.PAID) existing.paidCount++;
      else if (contribution.status === ContributionStatus.PENDING)
        existing.pendingCount++;
      else if (contribution.status === ContributionStatus.OVERDUE)
        existing.overdueCount++;
      monthMap.set(month, existing);
    }

    const byMonth = Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));

    // Agrupar por miembro
    const memberMap = new Map<
      number,
      {
        userName: string;
        totalContributions: number;
        totalAmount: number;
        paidCount: number;
        pendingCount: number;
        overdueCount: number;
      }
    >();

    for (const contribution of contributions) {
      const existing = memberMap.get(contribution.userId) || {
        userName: contribution.user
          ? `${contribution.user.firstName} ${contribution.user.lastName}`
          : 'N/A',
        totalContributions: 0,
        totalAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      };
      existing.totalContributions++;
      existing.totalAmount += parseFloat(contribution.amount.toString());
      if (contribution.status === ContributionStatus.PAID) existing.paidCount++;
      else if (contribution.status === ContributionStatus.PENDING)
        existing.pendingCount++;
      else if (contribution.status === ContributionStatus.OVERDUE)
        existing.overdueCount++;
      memberMap.set(contribution.userId, existing);
    }

    const byMember = Array.from(memberMap.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));

    return {
      totalContributions,
      totalAmount,
      byMonth,
      byMember,
    };
  }

  async getExportData(): Promise<ExportData> {
    const [fundStatus, delinquency, loans, contributions, users, investments] =
      await Promise.all([
        this.getFundStatus(),
        this.getDelinquencyReport(),
        this.getLoansReport(),
        this.getContributionsReport(),
        this.userRepository.find({
          relations: ['contributions', 'loans', 'fines'],
          where: { isActive: true },
        }),
        this.investmentRepository.find({
          order: { startDate: 'DESC' },
        }),
      ]);

    const members = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      isActive: user.isActive,
      totalContributions:
        user.contributions?.filter((c) => c.status === ContributionStatus.PAID)
          .length || 0,
      activeLoans:
        user.loans?.filter((l) => l.status === LoanStatus.APPROVED).length || 0,
      pendingFines:
        user.fines?.filter((f) => f.status === FineStatus.PENDING).length || 0,
    }));

    const investmentsData = investments.map((inv) => ({
      id: inv.id,
      bankName: inv.bankName,
      amountInvested: parseFloat(inv.amountInvested.toString()),
      interestRate: parseFloat(inv.interestRate.toString()),
      expectedReturn: parseFloat(inv.expectedReturn.toString()),
      startDate: inv.startDate,
      endDate: inv.endDate,
      status: inv.status,
    }));

    return {
      generatedAt: new Date(),
      fundStatus,
      delinquency,
      loans,
      contributions,
      members,
      investments: investmentsData,
    };
  }
}
