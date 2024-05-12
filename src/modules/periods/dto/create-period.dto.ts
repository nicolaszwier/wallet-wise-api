import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  @IsNotEmpty()
  planningId: string;

  @IsNumber()
  @IsNotEmpty()
  periodBalance: number;

  @IsNumber()
  @IsNotEmpty()
  periodBalancePaidOnly: number;

  @IsNumber()
  @IsNotEmpty()
  expectedAllTimeBalance: number;

  @IsNumber()
  @IsNotEmpty()
  expectedAllTimeBalancePaidOnly: number;

  @IsNotEmpty()
  @IsDate()
  periodStart: Date;

  @IsNotEmpty()
  @IsDate()
  periodEnd: Date;
}
