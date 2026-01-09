import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import { FineStatus, FineCategory } from '../../../entities/fine.entity';

export class CreateFineDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El usuario es requerido' })
  userId: number;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsNotEmpty({ message: 'El monto es requerido' })
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(FineCategory, { message: 'La categoría debe ser válida' })
  @IsOptional()
  category?: FineCategory;

  @IsEnum(FineStatus, { message: 'El estado debe ser válido' })
  @IsOptional()
  status?: FineStatus;
}
