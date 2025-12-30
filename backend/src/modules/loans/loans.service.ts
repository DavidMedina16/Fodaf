import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../entities/loan.entity';
import { CreateLoanDto, UpdateLoanDto } from './dto';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async create(createLoanDto: CreateLoanDto, createdBy?: number): Promise<Loan> {
    const loan = this.loanRepository.create({
      ...createLoanDto,
      createdBy,
    });
    return this.loanRepository.save(loan);
  }

  async findAll(): Promise<Loan[]> {
    return this.loanRepository.find({
      relations: ['user', 'creator', 'installments'],
      order: { createdAt: 'DESC' },
    });
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
      throw new NotFoundException(`Loan #${id} not found`);
    }

    return loan;
  }

  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.findOne(id);
    Object.assign(loan, updateLoanDto);
    return this.loanRepository.save(loan);
  }

  async remove(id: number): Promise<void> {
    const loan = await this.findOne(id);
    await this.loanRepository.remove(loan);
  }
}
