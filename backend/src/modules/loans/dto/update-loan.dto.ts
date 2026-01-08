import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateLoanDto } from './create-loan.dto';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @IsNumber()
  @IsOptional()
  monthlyPayment?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  totalInterest?: number;
}
