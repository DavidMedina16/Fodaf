import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFineDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
