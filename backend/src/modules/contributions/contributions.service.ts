import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contribution } from '../../entities/contribution.entity';
import { CreateContributionDto, UpdateContributionDto } from './dto';

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

  async findAll(): Promise<Contribution[]> {
    return this.contributionRepository.find({
      relations: ['user', 'creator'],
      order: { createdAt: 'DESC' },
    });
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
}
