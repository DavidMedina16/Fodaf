import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;
}
