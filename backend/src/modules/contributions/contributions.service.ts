import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan, Between } from 'typeorm';
import { Contribution, ContributionStatus } from '../../entities/contribution.entity';
import {
  CreateContributionDto,
  UpdateContributionDto,
  FilterContributionsDto,
} from './dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
  ) {}

  async create(
    createContributionDto: CreateContributionDto,
    createdBy?: number,
  ): Promise<Contribution> {
    const contribution = this.contributionRepository.create({
      ...createContributionDto,
      createdBy,
    });
    return this.contributionRepository.save(contribution);
  }

  async findAll(
    filters: FilterContributionsDto,
  ): Promise<PaginatedResult<Contribution>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      userId,
      targetMonth,
      year,
      month,
      status,
      type,
      search,
    } = filters;

    const queryBuilder = this.contributionRepository
      .createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.user', 'user')
      .leftJoinAndSelect('contribution.creator', 'creator');

    // Filtro por usuario
    if (userId) {
      queryBuilder.andWhere('contribution.userId = :userId', { userId });
    }

    // Filtro por mes específico (formato YYYY-MM)
    if (targetMonth) {
      queryBuilder.andWhere('contribution.targetMonth = :targetMonth', {
        targetMonth,
      });
    }

    // Filtro por año y mes separados
    if (year && month) {
      const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;
      queryBuilder.andWhere('contribution.targetMonth = :formattedMonth', {
        formattedMonth,
      });
    } else if (year) {
      queryBuilder.andWhere('contribution.targetMonth LIKE :year', {
        year: `${year}-%`,
      });
    }

    // Filtro por estado
    if (status) {
      queryBuilder.andWhere('contribution.status = :status', { status });
    }

    // Filtro por tipo
    if (type) {
      queryBuilder.andWhere('contribution.type = :type', { type });
    }

    // Búsqueda por nombre de usuario
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Ordenamiento
    const validSortColumns = [
      'createdAt',
      'targetMonth',
      'amount',
      'paymentDate',
      'status',
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`contribution.${sortColumn}`, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByUser(userId: number): Promise<Contribution[]> {
    return this.contributionRepository.find({
      where: { userId },
      relations: ['creator'],
      order: { targetMonth: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Contribution> {
    const contribution = await this.contributionRepository.findOne({
      where: { id },
      relations: ['user', 'creator'],
    });

    if (!contribution) {
      throw new NotFoundException(`Contribution #${id} not found`);
    }

    return contribution;
  }

  async update(
    id: number,
    updateContributionDto: UpdateContributionDto,
  ): Promise<Contribution> {
    const contribution = await this.findOne(id);
    Object.assign(contribution, updateContributionDto);
    return this.contributionRepository.save(contribution);
  }

  async remove(id: number): Promise<void> {
    const contribution = await this.findOne(id);
    await this.contributionRepository.remove(contribution);
  }

  async getMonthlySummary(targetMonth: string): Promise<MonthlySummary> {
    const contributions = await this.contributionRepository.find({
      where: { targetMonth },
      relations: ['user'],
    });

    const paid = contributions.filter((c) => c.status === ContributionStatus.PAID);
    const pending = contributions.filter(
      (c) => c.status === ContributionStatus.PENDING,
    );
    const overdue = contributions.filter((c) => c.status === ContributionStatus.OVERDUE);

    return {
      targetMonth,
      totalExpected: contributions.reduce((sum, c) => sum + Number(c.amount), 0),
      totalPaid: paid.reduce((sum, c) => sum + Number(c.amount), 0),
      totalPending: pending.reduce((sum, c) => sum + Number(c.amount), 0),
      totalOverdue: overdue.reduce((sum, c) => sum + Number(c.amount), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      totalMembers: contributions.length,
    };
  }

  async getYearlySummary(
    year: number,
  ): Promise<{ months: MonthlySummary[]; totals: Omit<MonthlySummary, 'targetMonth' | 'totalMembers'> }> {
    const months: MonthlySummary[] = [];

    for (let month = 1; month <= 12; month++) {
      const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
      const summary = await this.getMonthlySummary(targetMonth);
      months.push(summary);
    }

    const totals = {
      totalExpected: months.reduce((sum, m) => sum + m.totalExpected, 0),
      totalPaid: months.reduce((sum, m) => sum + m.totalPaid, 0),
      totalPending: months.reduce((sum, m) => sum + m.totalPending, 0),
      totalOverdue: months.reduce((sum, m) => sum + m.totalOverdue, 0),
      paidCount: months.reduce((sum, m) => sum + m.paidCount, 0),
      pendingCount: months.reduce((sum, m) => sum + m.pendingCount, 0),
      overdueCount: months.reduce((sum, m) => sum + m.overdueCount, 0),
    };

    return { months, totals };
  }

  async markOverdueContributions(): Promise<number> {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Marcar como vencidos los aportes pendientes de meses anteriores
    const result = await this.contributionRepository
      .createQueryBuilder()
      .update(Contribution)
      .set({ status: ContributionStatus.OVERDUE })
      .where('status = :status', { status: ContributionStatus.PENDING })
      .andWhere('targetMonth < :currentMonth', { currentMonth })
      .execute();

    return result.affected || 0;
  }

  async getUserContributionStatus(
    userId: number,
    year: number,
  ): Promise<{ month: string; status: string; amount: number | null }[]> {
    const status: { month: string; status: string; amount: number | null }[] = [];

    for (let month = 1; month <= 12; month++) {
      const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
      const contribution = await this.contributionRepository.findOne({
        where: { userId, targetMonth },
      });

      status.push({
        month: targetMonth,
        status: contribution?.status || 'Sin registro',
        amount: contribution ? Number(contribution.amount) : null,
      });
    }

    return status;
  }
}
