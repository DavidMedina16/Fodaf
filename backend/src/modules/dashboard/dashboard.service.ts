import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Contribution, ContributionStatus } from '../../entities/contribution.entity';
import { Loan, LoanStatus } from '../../entities/loan.entity';
import { Fine } from '../../entities/fine.entity';
import { Investment, InvestmentStatus } from '../../entities/investment.entity';
import {
  DashboardStatsDto,
  RecentActivityDto,
  UpcomingPaymentDto,
} from './dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    // Total ahorrado (suma de contribuciones pagadas)
    const totalSavingsResult = await this.contributionRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.amount), 0)', 'total')
      .where('c.status = :status', { status: ContributionStatus.PAID })
      .getRawOne();

    // Miembros activos
    const activeMembers = await this.userRepository.count({
      where: { isActive: true },
    });

    // Préstamos activos (aprobados pero no pagados)
    const activeLoans = await this.loanRepository.count({
      where: { status: LoanStatus.APPROVED },
    });

    // Contribuciones pendientes
    const pendingContributions = await this.contributionRepository.count({
      where: { status: ContributionStatus.PENDING },
    });

    // Total invertido en CDTs activos
    const totalInvestedResult = await this.investmentRepository
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.amountInvested), 0)', 'total')
      .where('i.status = :status', { status: InvestmentStatus.ACTIVE })
      .getRawOne();

    // Próxima fecha de pago (primer día del próximo mes)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextPaymentDate = nextMonth.toISOString().split('T')[0];

    return {
      totalSavings: parseFloat(totalSavingsResult?.total || '0'),
      activeMembers,
      activeLoans,
      pendingContributions,
      totalInvested: parseFloat(totalInvestedResult?.total || '0'),
      nextPaymentDate,
    };
  }

  async getRecentActivity(limit = 10): Promise<RecentActivityDto[]> {
    const activities: RecentActivityDto[] = [];

    // Últimas contribuciones
    const recentContributions = await this.contributionRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    for (const contribution of recentContributions) {
      activities.push({
        id: contribution.id,
        type: 'contribution',
        description: `Aporte ${contribution.type || 'mensual'} - ${contribution.targetMonth || ''}`,
        amount: Number(contribution.amount),
        date: contribution.createdAt,
        userName: contribution.user
          ? `${contribution.user.firstName} ${contribution.user.lastName}`
          : 'Usuario desconocido',
      });
    }

    // Últimos préstamos
    const recentLoans = await this.loanRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    for (const loan of recentLoans) {
      activities.push({
        id: loan.id,
        type: 'loan',
        description: `Préstamo ${loan.status || 'solicitado'}`,
        amount: Number(loan.amount),
        date: loan.createdAt,
        userName: loan.user
          ? `${loan.user.firstName} ${loan.user.lastName}`
          : 'Usuario desconocido',
      });
    }

    // Últimas multas
    const recentFines = await this.fineRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    for (const fine of recentFines) {
      activities.push({
        id: fine.id,
        type: 'fine',
        description: fine.reason || 'Multa aplicada',
        amount: Number(fine.amount),
        date: fine.createdAt,
        userName: fine.user
          ? `${fine.user.firstName} ${fine.user.lastName}`
          : 'Usuario desconocido',
      });
    }

    // Ordenar por fecha y limitar
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getUpcomingPayments(limit = 10): Promise<UpcomingPaymentDto[]> {
    const pendingContributions = await this.contributionRepository.find({
      where: { status: ContributionStatus.PENDING },
      relations: ['user'],
      order: { targetMonth: 'ASC' },
      take: limit,
    });

    return pendingContributions.map((contribution) => ({
      id: contribution.id,
      userId: contribution.userId,
      userName: contribution.user
        ? `${contribution.user.firstName} ${contribution.user.lastName}`
        : 'Usuario desconocido',
      amount: Number(contribution.amount),
      targetMonth: contribution.targetMonth || '',
      status: contribution.status || ContributionStatus.PENDING,
    }));
  }
}
