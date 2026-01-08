import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Loan, LoanStatus } from '../../entities/loan.entity';
import { LoanInstallment, InstallmentStatus } from '../../entities/loan-installment.entity';
import { Contribution, ContributionStatus } from '../../entities/contribution.entity';
import { CreateLoanDto, UpdateLoanDto } from './dto';
import { LoanCalculationService, LoanCalculation } from './loan-calculation.service';

export interface LoansFilterDto {
  userId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLoans {
  data: Loan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// Factor multiplicador para calcular límite de crédito (ej: 3x los aportes)
const CREDIT_LIMIT_FACTOR = 3;

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private readonly installmentRepository: Repository<LoanInstallment>,
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    private readonly calculationService: LoanCalculationService,
  ) {}

  async create(createLoanDto: CreateLoanDto, createdBy?: number, skipValidation = false): Promise<Loan> {
    // Validar límite de crédito (solo si no se omite la validación)
    if (!skipValidation) {
      await this.validateLoanRequest(createLoanDto.userId, createLoanDto.amount);
    }

    // Calcular amortización
    const calculation = this.calculationService.simulate(
      createLoanDto.amount,
      createLoanDto.interestRate,
      createLoanDto.termMonths,
    );

    // Calcular fecha de fin basada en el plazo
    const startDate = createLoanDto.startDate
      ? new Date(createLoanDto.startDate)
      : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + createLoanDto.termMonths);

    const loan = this.loanRepository.create({
      ...createLoanDto,
      startDate,
      endDate,
      monthlyPayment: calculation.monthlyPayment,
      totalAmount: calculation.totalAmount,
      totalInterest: calculation.totalInterest,
      status: createLoanDto.status || LoanStatus.PENDING,
      createdBy,
    });

    return this.loanRepository.save(loan);
  }

  async findAll(filters: LoansFilterDto = {}): Promise<PaginatedLoans> {
    const { userId, status, search, page = 1, limit = 10 } = filters;

    const where: FindOptionsWhere<Loan> = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.loanRepository.findAndCount({
      where,
      relations: ['user', 'creator', 'installments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: number): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { userId },
      relations: ['installments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: ['user', 'creator', 'installments'],
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo #${id} no encontrado`);
    }

    return loan;
  }

  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.findOne(id);

    // Si cambia el monto, tasa o plazo, recalcular
    if (
      updateLoanDto.amount !== undefined ||
      updateLoanDto.interestRate !== undefined ||
      updateLoanDto.termMonths !== undefined
    ) {
      const amount = updateLoanDto.amount ?? loan.amount;
      const interestRate = updateLoanDto.interestRate ?? loan.interestRate;
      const termMonths = updateLoanDto.termMonths ?? loan.termMonths;

      const calculation = this.calculationService.simulate(
        Number(amount),
        Number(interestRate),
        termMonths,
      );

      updateLoanDto['monthlyPayment'] = calculation.monthlyPayment;
      updateLoanDto['totalAmount'] = calculation.totalAmount;
      updateLoanDto['totalInterest'] = calculation.totalInterest;
    }

    Object.assign(loan, updateLoanDto);
    return this.loanRepository.save(loan);
  }

  async remove(id: number): Promise<void> {
    const loan = await this.findOne(id);
    await this.loanRepository.remove(loan);
  }

  /**
   * Aprobar un préstamo y generar la tabla de amortización
   */
  async approve(id: number, approvedBy: number): Promise<Loan> {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException(
        `El préstamo debe estar en estado ${LoanStatus.PENDING} para ser aprobado`,
      );
    }

    // Actualizar estado
    loan.status = LoanStatus.APPROVED;
    const startDate = loan.startDate || new Date();
    loan.startDate = startDate;

    // Generar tabla de amortización
    const calculation = this.calculationService.generateAmortizationSchedule(
      Number(loan.amount),
      Number(loan.interestRate),
      loan.termMonths,
      startDate,
    );

    // Actualizar valores calculados
    loan.monthlyPayment = calculation.monthlyPayment;
    loan.totalAmount = calculation.totalAmount;
    loan.totalInterest = calculation.totalInterest;

    // Calcular fecha de fin
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + loan.termMonths);
    loan.endDate = endDate;

    // Guardar préstamo
    await this.loanRepository.save(loan);

    // Crear las cuotas
    const installments = calculation.amortizationSchedule.map((row) =>
      this.installmentRepository.create({
        loanId: loan.id,
        installmentNumber: row.installmentNumber,
        amountCapital: row.amountCapital,
        amountInterest: row.amountInterest,
        totalAmount: row.totalAmount,
        remainingBalance: row.remainingBalance,
        dueDate: row.dueDate,
        createdBy: approvedBy,
      }),
    );

    await this.installmentRepository.save(installments);

    return this.findOne(id);
  }

  /**
   * Rechazar un préstamo
   */
  async reject(id: number, rejectedBy: number): Promise<Loan> {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException(
        `El préstamo debe estar en estado ${LoanStatus.PENDING} para ser rechazado`,
      );
    }

    loan.status = LoanStatus.REJECTED;
    return this.loanRepository.save(loan);
  }

  /**
   * Obtener tabla de amortización de un préstamo
   */
  async getAmortizationSchedule(id: number): Promise<LoanCalculation> {
    const loan = await this.findOne(id);

    return this.calculationService.generateAmortizationSchedule(
      Number(loan.amount),
      Number(loan.interestRate),
      loan.termMonths,
      loan.startDate || new Date(),
    );
  }

  /**
   * Simular préstamo (sin guardar)
   */
  simulate(
    amount: number,
    interestRate: number,
    termMonths: number,
  ): LoanCalculation {
    return this.calculationService.generateAmortizationSchedule(
      amount,
      interestRate,
      termMonths,
    );
  }

  /**
   * Obtener resumen de préstamos
   */
  async getSummary(): Promise<{
    totalLoans: number;
    pendingLoans: number;
    approvedLoans: number;
    totalLent: number;
    totalPending: number;
  }> {
    const loans = await this.loanRepository.find();

    const pendingLoans = loans.filter((l) => l.status === LoanStatus.PENDING);
    const approvedLoans = loans.filter((l) => l.status === LoanStatus.APPROVED);

    const totalLent = approvedLoans.reduce(
      (sum, loan) => sum + Number(loan.amount),
      0,
    );

    const totalPending = pendingLoans.reduce(
      (sum, loan) => sum + Number(loan.amount),
      0,
    );

    return {
      totalLoans: loans.length,
      pendingLoans: pendingLoans.length,
      approvedLoans: approvedLoans.length,
      totalLent,
      totalPending,
    };
  }

  /**
   * Obtener el límite de crédito de un usuario
   */
  async getCreditLimit(userId: number): Promise<CreditLimitInfo> {
    const reasons: string[] = [];

    // 1. Obtener total de aportes pagados del usuario
    const contributions = await this.contributionRepository.find({
      where: { userId, status: ContributionStatus.PAID },
    });

    const totalContributions = contributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    // 2. Obtener préstamos activos (aprobados pero no pagados)
    const activeLoans = await this.loanRepository.find({
      where: { userId, status: LoanStatus.APPROVED },
    });

    const activeLoansAmount = activeLoans.reduce(
      (sum, loan) => sum + Number(loan.amount),
      0,
    );

    // 3. Obtener préstamos pendientes de aprobación
    const pendingLoans = await this.loanRepository.find({
      where: { userId, status: LoanStatus.PENDING },
    });

    const pendingLoansAmount = pendingLoans.reduce(
      (sum, loan) => sum + Number(loan.amount),
      0,
    );

    // 4. Calcular límite de crédito (factor x aportes)
    const creditLimit = totalContributions * CREDIT_LIMIT_FACTOR;

    // 5. Calcular crédito disponible
    const availableCredit = Math.max(
      0,
      creditLimit - activeLoansAmount - pendingLoansAmount,
    );

    // 6. Verificar si puede solicitar préstamo
    let canRequestLoan = true;

    // Verificar si tiene préstamo pendiente de aprobación
    if (pendingLoans.length > 0) {
      canRequestLoan = false;
      reasons.push('Ya tiene un préstamo pendiente de aprobación');
    }

    // Verificar si tiene cuotas vencidas
    const overdueInstallments = await this.installmentRepository
      .createQueryBuilder('installment')
      .innerJoin('installment.loan', 'loan')
      .where('loan.userId = :userId', { userId })
      .andWhere('loan.status = :status', { status: LoanStatus.APPROVED })
      .andWhere('installment.status = :installmentStatus', {
        installmentStatus: InstallmentStatus.OVERDUE,
      })
      .getCount();

    if (overdueInstallments > 0) {
      canRequestLoan = false;
      reasons.push(`Tiene ${overdueInstallments} cuota(s) vencida(s)`);
    }

    // Verificar si tiene crédito disponible
    if (availableCredit <= 0) {
      canRequestLoan = false;
      reasons.push('No tiene crédito disponible');
    }

    // Verificar si tiene aportes
    if (totalContributions === 0) {
      canRequestLoan = false;
      reasons.push('No tiene aportes registrados');
    }

    return {
      totalContributions,
      activeLoansAmount,
      pendingLoansAmount,
      creditLimit,
      availableCredit,
      canRequestLoan,
      reasons,
    };
  }

  /**
   * Validar si un usuario puede solicitar un préstamo por el monto dado
   */
  async validateLoanRequest(userId: number, amount: number): Promise<void> {
    const creditInfo = await this.getCreditLimit(userId);

    if (!creditInfo.canRequestLoan) {
      throw new BadRequestException(
        `No puede solicitar préstamo: ${creditInfo.reasons.join(', ')}`,
      );
    }

    if (amount > creditInfo.availableCredit) {
      throw new BadRequestException(
        `El monto solicitado ($${amount.toLocaleString()}) excede su crédito disponible ($${creditInfo.availableCredit.toLocaleString()})`,
      );
    }
  }
}
