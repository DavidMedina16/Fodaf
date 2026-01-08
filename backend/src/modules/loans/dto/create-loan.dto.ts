import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateLoanDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'La tasa de interés debe ser mayor o igual a 0' })
  @Max(100, { message: 'La tasa de interés no puede ser mayor a 100%' })
  interestRate: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'El plazo debe ser de al menos 1 mes' })
  @Max(60, { message: 'El plazo no puede exceder 60 meses' })
  termMonths: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
