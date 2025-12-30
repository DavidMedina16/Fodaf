import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsNumber()
  @IsOptional()
  amountInvested?: number;

  @IsNumber()
  @IsOptional()
  expectedReturn?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
