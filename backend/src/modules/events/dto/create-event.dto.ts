import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from '../../../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del evento es requerido' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString({}, { message: 'La fecha del evento debe ser válida' })
  @IsNotEmpty({ message: 'La fecha del evento es requerida' })
  eventDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'La ubicación no puede exceder 255 caracteres' })
  location?: string;

  @IsNumber({}, { message: 'La meta de recaudación debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'La meta de recaudación debe ser mayor o igual a 0' })
  fundraisingGoal?: number;

  @IsEnum(EventStatus, { message: 'El estado debe ser válido' })
  @IsOptional()
  status?: EventStatus;
}
