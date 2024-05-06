import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePeriodDto {
  @IsNumber()
  @IsOptional()
  periodBalance: number;

  @IsNumber()
  @IsOptional()
  expectedAllTimeBalance: number;
}
