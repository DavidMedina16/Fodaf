import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../../entities/app-config.entity';
import { CreateAppConfigDto, UpdateAppConfigDto } from './dto';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private readonly configRepository: Repository<AppConfig>,
  ) {}

  async create(createConfigDto: CreateAppConfigDto): Promise<AppConfig> {
    const config = this.configRepository.create(createConfigDto);
    return this.configRepository.save(config);
  }

  async findAll(): Promise<AppConfig[]> {
    return this.configRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<AppConfig> {
    const config = await this.configRepository.findOne({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Config with key '${key}' not found`);
    }

    return config;
  }

  async findOne(id: number): Promise<AppConfig> {
    const config = await this.configRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`Config #${id} not found`);
    }

    return config;
  }

  async update(id: number, updateConfigDto: UpdateAppConfigDto): Promise<AppConfig> {
    const config = await this.findOne(id);
    Object.assign(config, updateConfigDto);
    return this.configRepository.save(config);
  }

  async remove(id: number): Promise<void> {
    const config = await this.findOne(id);
    await this.configRepository.remove(config);
  }

  async getValue(key: string): Promise<string | null> {
    try {
      const config = await this.findByKey(key);
      return config.value;
    } catch {
      return null;
    }
  }
}
