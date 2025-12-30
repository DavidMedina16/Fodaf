import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanInstallment } from '../../entities/loan-installment.entity';
import { CreateLoanInstallmentDto } from './dto';

@Injectable()
export class LoanInstallmentsService {
  constructor(
    @InjectRepository(LoanInstallment)
    private readonly installmentRepository: Repository<LoanInstallment>,
  ) {}

  async create(
    createInstallmentDto: CreateLoanInstallmentDto,
    createdBy?: number,
  ): Promise<LoanInstallment> {
    const installment = this.installmentRepository.create({
      ...createInstallmentDto,
      createdBy,
    });
    return this.installmentRepository.save(installment);
  }

  async findByLoan(loanId: number): Promise<LoanInstallment[]> {
    return this.installmentRepository.find({
      where: { loanId },
      relations: ['creator'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LoanInstallment> {
    const installment = await this.installmentRepository.findOne({
      where: { id },
      relations: ['loan', 'creator'],
    });

    if (!installment) {
      throw new NotFoundException(`Installment #${id} not found`);
    }

    return installment;
  }

  async remove(id: number): Promise<void> {
    const installment = await this.findOne(id);
    await this.installmentRepository.remove(installment);
  }
}
