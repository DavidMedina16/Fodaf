import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment, InvestmentStatus } from '../../entities/investment.entity';
import { CreateInvestmentDto, UpdateInvestmentDto } from './dto';
import { InvestmentCalculationService, InvestmentSimulation } from './investment-calculation.service';

export interface InvestmentsFilterDto {
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

export interface PaginatedInvestments {
  data: Investment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export interface InvestmentWithCalculations extends Investment {
  daysRemaining: number;
  accruedReturn: number;
  progress: number;
}

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
    private readonly calculationService: InvestmentCalculationService,
  ) {}

  async create(createInvestmentDto: CreateInvestmentDto): Promise<Investment> {
    const startDate = new Date(createInvestmentDto.startDate);

    // Calcular fecha de vencimiento
    const endDate = this.calculationService.calculateEndDate(
      startDate,
      createInvestmentDto.termDays,
    );

    // Calcular rendimientos
    const { expectedReturn, totalAtMaturity } = this.calculationService.calculateReturn(
      createInvestmentDto.amountInvested,
      createInvestmentDto.interestRate,
      createInvestmentDto.termDays,
    );

    const investment = this.investmentRepository.create({
      ...createInvestmentDto,
      startDate,
      endDate,
      expectedReturn,
      totalAtMaturity,
      status: createInvestmentDto.status || InvestmentStatus.ACTIVE,
    });

    return this.investmentRepository.save(investment);
  }

  async findAll(filters: InvestmentsFilterDto = {}): Promise<PaginatedInvestments> {
    const {
      status,
      bankName,
      search,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      page = 1,
      limit = 10,
    } = filters;

    const queryBuilder = this.investmentRepository.createQueryBuilder('investment');

    // Filtro por estado
    if (status) {
      queryBuilder.andWhere('investment.status = :status', { status });
    }

    // Filtro por banco
    if (bankName) {
      queryBuilder.andWhere('investment.bankName LIKE :bankName', {
        bankName: `%${bankName}%`,
      });
    }

    // Búsqueda general
    if (search) {
      queryBuilder.andWhere('investment.bankName LIKE :search', {
        search: `%${search}%`,
      });
    }

    // Filtro por rango de fecha de inicio
    if (startDateFrom && startDateTo) {
      queryBuilder.andWhere('investment.startDate BETWEEN :startFrom AND :startTo', {
        startFrom: startDateFrom,
        startTo: startDateTo,
      });
    } else if (startDateFrom) {
      queryBuilder.andWhere('investment.startDate >= :startFrom', {
        startFrom: startDateFrom,
      });
    } else if (startDateTo) {
      queryBuilder.andWhere('investment.startDate <= :startTo', {
        startTo: startDateTo,
      });
    }

    // Filtro por rango de fecha de vencimiento
    if (endDateFrom && endDateTo) {
      queryBuilder.andWhere('investment.endDate BETWEEN :endFrom AND :endTo', {
        endFrom: endDateFrom,
        endTo: endDateTo,
      });
    } else if (endDateFrom) {
      queryBuilder.andWhere('investment.endDate >= :endFrom', {
        endFrom: endDateFrom,
      });
    } else if (endDateTo) {
      queryBuilder.andWhere('investment.endDate <= :endTo', {
        endTo: endDateTo,
      });
    }

    // Ordenar por fecha de vencimiento (próximas primero)
    queryBuilder.orderBy('investment.endDate', 'ASC');

    // Paginación
    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Inversión #${id} no encontrada`);
    }

    return investment;
  }

  async findOneWithCalculations(id: number): Promise<InvestmentWithCalculations> {
    const investment = await this.findOne(id);

    const daysRemaining = this.calculationService.getDaysRemaining(investment.endDate);
    const accruedReturn = this.calculationService.getAccruedReturn(
      Number(investment.amountInvested),
      Number(investment.interestRate),
      investment.startDate,
    );

    // Calcular progreso (días transcurridos / días totales)
    const totalDays = investment.termDays;
    const daysElapsed = totalDays - daysRemaining;
    const progress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

    return {
      ...investment,
      daysRemaining,
      accruedReturn,
      progress,
    };
  }

  async update(id: number, updateInvestmentDto: UpdateInvestmentDto): Promise<Investment> {
    const investment = await this.findOne(id);

    // Aplicar cambios del DTO
    Object.assign(investment, updateInvestmentDto);

    // Si cambia monto, tasa o plazo, recalcular
    const amountInvested = Number(investment.amountInvested);
    const interestRate = Number(investment.interestRate);
    const termDays = investment.termDays;
    const startDate = updateInvestmentDto.startDate
      ? new Date(updateInvestmentDto.startDate)
      : investment.startDate;

    // Recalcular si cambió algún parámetro
    if (
      updateInvestmentDto.amountInvested !== undefined ||
      updateInvestmentDto.interestRate !== undefined ||
      updateInvestmentDto.termDays !== undefined ||
      updateInvestmentDto.startDate !== undefined
    ) {
      investment.startDate = startDate;
      investment.endDate = this.calculationService.calculateEndDate(startDate, termDays);
      const { expectedReturn, totalAtMaturity } = this.calculationService.calculateReturn(
        amountInvested,
        interestRate,
        termDays,
      );
      investment.expectedReturn = expectedReturn;
      investment.totalAtMaturity = totalAtMaturity;
    }

    return this.investmentRepository.save(investment);
  }

  async remove(id: number): Promise<void> {
    const investment = await this.findOne(id);
    await this.investmentRepository.remove(investment);
  }

  /**
   * Marcar inversión como finalizada
   */
  async finish(id: number): Promise<Investment> {
    const investment = await this.findOne(id);
    investment.status = InvestmentStatus.FINISHED;
    return this.investmentRepository.save(investment);
  }

  /**
   * Renovar inversión (crea una nueva basada en la anterior)
   */
  async renew(
    id: number,
    newTermDays?: number,
    newInterestRate?: number,
    reinvestReturns: boolean = true,
  ): Promise<Investment> {
    const original = await this.findOne(id);

    // Marcar la original como renovada
    original.status = InvestmentStatus.RENEWED;
    await this.investmentRepository.save(original);

    // Calcular nuevo monto (capital + intereses si se reinvierten)
    const newAmount = reinvestReturns
      ? Number(original.totalAtMaturity)
      : Number(original.amountInvested);

    // Crear nueva inversión
    const startDate = new Date();
    const termDays = newTermDays ?? original.termDays;
    const interestRate = newInterestRate ?? Number(original.interestRate);

    const endDate = this.calculationService.calculateEndDate(startDate, termDays);
    const { expectedReturn, totalAtMaturity } = this.calculationService.calculateReturn(
      newAmount,
      interestRate,
      termDays,
    );

    const newInvestment = this.investmentRepository.create({
      bankName: original.bankName,
      amountInvested: newAmount,
      interestRate,
      termDays,
      startDate,
      endDate,
      expectedReturn,
      totalAtMaturity,
      status: InvestmentStatus.ACTIVE,
      notes: `Renovación de inversión #${original.id}`,
    });

    return this.investmentRepository.save(newInvestment);
  }

  /**
   * Obtener resumen de inversiones
   */
  async getSummary(): Promise<InvestmentsSummary> {
    const investments = await this.investmentRepository.find();

    const activeInvestments = investments.filter(
      (i) => i.status === InvestmentStatus.ACTIVE,
    );
    const finishedInvestments = investments.filter(
      (i) => i.status === InvestmentStatus.FINISHED,
    );
    const renewedInvestments = investments.filter(
      (i) => i.status === InvestmentStatus.RENEWED,
    );

    // Totales generales
    const totalInvested = investments.reduce(
      (sum, i) => sum + Number(i.amountInvested),
      0,
    );
    const totalExpectedReturn = investments.reduce(
      (sum, i) => sum + Number(i.expectedReturn),
      0,
    );
    const totalAtMaturity = investments.reduce(
      (sum, i) => sum + Number(i.totalAtMaturity),
      0,
    );

    // Totales de inversiones activas
    const activeInvested = activeInvestments.reduce(
      (sum, i) => sum + Number(i.amountInvested),
      0,
    );
    const activeExpectedReturn = activeInvestments.reduce(
      (sum, i) => sum + Number(i.expectedReturn),
      0,
    );

    // Próximos vencimientos (próximos 30 días)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingMaturities = activeInvestments
      .filter((i) => {
        const endDate = new Date(i.endDate);
        return endDate >= today && endDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    // Tasa de interés promedio (solo activas)
    const averageInterestRate =
      activeInvestments.length > 0
        ? activeInvestments.reduce((sum, i) => sum + Number(i.interestRate), 0) /
          activeInvestments.length
        : 0;

    return {
      totalInvestments: investments.length,
      activeInvestments: activeInvestments.length,
      finishedInvestments: finishedInvestments.length,
      renewedInvestments: renewedInvestments.length,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalExpectedReturn: Math.round(totalExpectedReturn * 100) / 100,
      totalAtMaturity: Math.round(totalAtMaturity * 100) / 100,
      activeInvested: Math.round(activeInvested * 100) / 100,
      activeExpectedReturn: Math.round(activeExpectedReturn * 100) / 100,
      upcomingMaturities,
      averageInterestRate: Math.round(averageInterestRate * 100) / 100,
    };
  }

  /**
   * Simular inversión sin guardar
   */
  simulate(
    amountInvested: number,
    interestRate: number,
    termDays: number,
  ): InvestmentSimulation {
    return this.calculationService.simulate(amountInvested, interestRate, termDays);
  }

  /**
   * Actualizar estados automáticamente (inversiones vencidas)
   */
  async updateExpiredInvestments(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.investmentRepository
      .createQueryBuilder()
      .update(Investment)
      .set({ status: InvestmentStatus.FINISHED })
      .where('status = :status', { status: InvestmentStatus.ACTIVE })
      .andWhere('endDate < :today', { today })
      .execute();

    return result.affected || 0;
  }
}
