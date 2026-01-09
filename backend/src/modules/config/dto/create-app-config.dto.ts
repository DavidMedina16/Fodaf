import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ConfigCategory,
  ConfigType,
} from '../../../entities/app-config.entity';

export class CreateAppConfigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  value?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsEnum(ConfigType)
  @IsOptional()
  type?: ConfigType;

  @IsEnum(ConfigCategory)
  @IsOptional()
  category?: ConfigCategory;
}
