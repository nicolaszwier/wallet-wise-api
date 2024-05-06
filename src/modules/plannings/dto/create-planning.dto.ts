import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CurrencyType } from '../model/Currency';

export class CreatePlanningDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  initialBalance: number;

  @IsNotEmpty()
  @IsEnum(CurrencyType)
  currency: CurrencyType;
}
