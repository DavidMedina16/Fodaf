import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventTransaction } from '../../entities/event-transaction.entity';
import { CreateEventTransactionDto } from './dto';

@Injectable()
export class EventTransactionsService {
  constructor(
    @InjectRepository(EventTransaction)
    private readonly transactionRepository: Repository<EventTransaction>,
  ) {}

  async create(
    createTransactionDto: CreateEventTransactionDto,
    createdBy?: number,
  ): Promise<EventTransaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      createdBy,
    });
    return this.transactionRepository.save(transaction);
  }

  async findByEvent(eventId: number): Promise<EventTransaction[]> {
    return this.transactionRepository.find({
      where: { eventId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<EventTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['event', 'creator'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    return transaction;
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.remove(transaction);
  }
}
