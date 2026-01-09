import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { InvestmentStatus } from '../../../entities/investment.entity';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del banco es requerido' })
  @MaxLength(255, { message: 'El nombre del banco no puede exceder 255 caracteres' })
  bankName: string;

  @IsNumber({}, { message: 'El monto invertido debe ser un número' })
  @IsNotEmpty({ message: 'El monto invertido es requerido' })
  @Min(1, { message: 'El monto invertido debe ser mayor a 0' })
  amountInvested: number;

  @IsNumber({}, { message: 'La tasa de interés debe ser un número' })
  @IsNotEmpty({ message: 'La tasa de interés es requerida' })
  @Min(0.01, { message: 'La tasa de interés debe ser mayor a 0' })
  @Max(100, { message: 'La tasa de interés no puede exceder 100%' })
  interestRate: number;

  @IsNumber({}, { message: 'El plazo debe ser un número' })
  @IsNotEmpty({ message: 'El plazo en días es requerido' })
  @Min(1, { message: 'El plazo debe ser de al menos 1 día' })
  @Max(1825, { message: 'El plazo no puede exceder 5 años (1825 días)' })
  termDays: number;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  startDate: string;

  @IsEnum(InvestmentStatus, { message: 'El estado debe ser Activa, Finalizada o Renovada' })
  @IsOptional()
  status?: InvestmentStatus;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  notes?: string;
}
