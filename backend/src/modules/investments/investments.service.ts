import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../../entities/investment.entity';
import { CreateInvestmentDto, UpdateInvestmentDto } from './dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async create(createInvestmentDto: CreateInvestmentDto): Promise<Investment> {
    const investment = this.investmentRepository.create(createInvestmentDto);
    return this.investmentRepository.save(investment);
  }

  async findAll(): Promise<Investment[]> {
    return this.investmentRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Investment #${id} not found`);
    }

    return investment;
  }

  async update(
    id: number,
    updateInvestmentDto: UpdateInvestmentDto,
  ): Promise<Investment> {
    const investment = await this.findOne(id);
    Object.assign(investment, updateInvestmentDto);
    return this.investmentRepository.save(investment);
  }

  async remove(id: number): Promise<void> {
    const investment = await this.findOne(id);
    await this.investmentRepository.remove(investment);
  }
}
