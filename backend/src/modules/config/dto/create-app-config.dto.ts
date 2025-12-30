import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppConfigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  value?: string;
}
