import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fine } from '../../entities/fine.entity';
import { CreateFineDto, UpdateFineDto } from './dto';

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(Fine)
    private readonly fineRepository: Repository<Fine>,
  ) {}

  async create(createFineDto: CreateFineDto, createdBy?: number): Promise<Fine> {
    const fine = this.fineRepository.create({
      ...createFineDto,
      createdBy,
    });
    return this.fineRepository.save(fine);
  }

  async findAll(): Promise<Fine[]> {
    return this.fineRepository.find({
      relations: ['user', 'creator'],
      order: { createdAt: 'DESC' },
    });
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
      throw new NotFoundException(`Fine #${id} not found`);
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
}
