import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  eventId: number;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
