import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fine, FineStatus, FineCategory } from '../../entities/fine.entity';
import { CreateFineDto, UpdateFineDto } from './dto';

export interface FinesFilterDto {
  userId?: number;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFines {
  data: Fine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FinesSummary {
  totalFines: number;
  pendingFines: number;
  paidFines: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  byCategory: { category: string; count: number; amount: number }[];
}

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
  ) {}

  async create(createFineDto: CreateFineDto, createdBy?: number): Promise<Fine> {
    const fine = this.fineRepository.create({
      ...createFineDto,
      status: createFineDto.status || FineStatus.PENDING,
      category: createFineDto.category || FineCategory.OTHER,
      createdBy,
    });
    return this.fineRepository.save(fine);
  }

  async findAll(filters: FinesFilterDto = {}): Promise<PaginatedFines> {
    const { userId, status, category, search, page = 1, limit = 10 } = filters;

    const queryBuilder = this.fineRepository
      .createQueryBuilder('fine')
      .leftJoinAndSelect('fine.user', 'user')
      .leftJoinAndSelect('fine.creator', 'creator');

    if (userId) {
      queryBuilder.andWhere('fine.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('fine.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('fine.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(fine.reason LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('fine.createdAt', 'DESC');

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

  async findByUser(userId: number): Promise<Fine[]> {
    return this.fineRepository.find({
      where: { userId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Fine> {
    const fine = await this.fineRepository.findOne({
      where: { id },
      relations: ['user', 'creator'],
    });

    if (!fine) {
      throw new NotFoundException(`Multa #${id} no encontrada`);
    }

    return fine;
  }

  async update(id: number, updateFineDto: UpdateFineDto): Promise<Fine> {
    const fine = await this.findOne(id);
    Object.assign(fine, updateFineDto);
    return this.fineRepository.save(fine);
  }

  async remove(id: number): Promise<void> {
    const fine = await this.findOne(id);
    await this.fineRepository.remove(fine);
  }

  async markAsPaid(id: number): Promise<Fine> {
    const fine = await this.findOne(id);
    fine.status = FineStatus.PAID;
    fine.paidAt = new Date();
    return this.fineRepository.save(fine);
  }

  async getSummary(): Promise<FinesSummary> {
    const fines = await this.fineRepository.find();

    const pendingFines = fines.filter((f) => f.status === FineStatus.PENDING);
    const paidFines = fines.filter((f) => f.status === FineStatus.PAID);

    const totalPendingAmount = pendingFines.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    );
    const totalPaidAmount = paidFines.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    );

    // Group by category
    const categoryMap = new Map<string, { count: number; amount: number }>();
    for (const fine of fines) {
      const cat = fine.category || FineCategory.OTHER;
      const current = categoryMap.get(cat) || { count: 0, amount: 0 };
      categoryMap.set(cat, {
        count: current.count + 1,
        amount: current.amount + Number(fine.amount),
      });
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
    }));

    return {
      totalFines: fines.length,
      pendingFines: pendingFines.length,
      paidFines: paidFines.length,
      totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
      totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
      byCategory,
    };
  }

  async getUserFinesSummary(userId: number): Promise<{
    total: number;
    pending: number;
    pendingAmount: number;
  }> {
    const fines = await this.findByUser(userId);
    const pending = fines.filter((f) => f.status === FineStatus.PENDING);
    const pendingAmount = pending.reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      total: fines.length,
      pending: pending.length,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
    };
  }
}
