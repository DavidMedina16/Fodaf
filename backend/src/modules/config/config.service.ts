import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AppConfig,
  ConfigCategory,
  ConfigType,
} from '../../entities/app-config.entity';
import { CreateAppConfigDto, UpdateAppConfigDto } from './dto';

export interface SystemConfig {
  [key: string]: {
    value: string;
    description: string;
    type: ConfigType;
    category: ConfigCategory;
    id: number;
  };
}

export interface SystemConfigByCategory {
  [category: string]: SystemConfig;
}

export interface BulkUpdateConfigDto {
  configs: { key: string; value: string }[];
}

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
      order: { category: 'ASC', key: 'ASC' },
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

  async update(
    id: number,
    updateConfigDto: UpdateAppConfigDto,
  ): Promise<AppConfig> {
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

  async getNumericValue(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    const configs = await this.findAll();
    const result: SystemConfig = {};

    for (const config of configs) {
      result[config.key] = {
        value: config.value,
        description: config.description,
        type: config.type,
        category: config.category,
        id: config.id,
      };
    }

    return result;
  }

  async getSystemConfigByCategory(): Promise<SystemConfigByCategory> {
    const configs = await this.findAll();
    const result: SystemConfigByCategory = {};

    for (const config of configs) {
      if (!result[config.category]) {
        result[config.category] = {};
      }
      result[config.category][config.key] = {
        value: config.value,
        description: config.description,
        type: config.type,
        category: config.category,
        id: config.id,
      };
    }

    return result;
  }

  async bulkUpdate(
    bulkUpdateDto: BulkUpdateConfigDto,
  ): Promise<{ updated: number; configs: AppConfig[] }> {
    const updatedConfigs: AppConfig[] = [];

    for (const item of bulkUpdateDto.configs) {
      try {
        const config = await this.findByKey(item.key);
        config.value = item.value;
        const saved = await this.configRepository.save(config);
        updatedConfigs.push(saved);
      } catch {
        // Skip configs that don't exist
      }
    }

    return {
      updated: updatedConfigs.length,
      configs: updatedConfigs,
    };
  }

  async updateByKey(key: string, value: string): Promise<AppConfig> {
    const config = await this.findByKey(key);
    config.value = value;
    return this.configRepository.save(config);
  }
}
