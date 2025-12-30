import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateLoanInstallmentDto {
  @IsNumber()
  @IsNotEmpty()
  loanId: number;

  @IsNumber()
  @IsOptional()
  amountCapital?: number;

  @IsNumber()
  @IsOptional()
  amountInterest?: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
