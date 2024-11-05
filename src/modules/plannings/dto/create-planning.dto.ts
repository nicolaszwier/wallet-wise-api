import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CurrencyType } from '../model/Currency';

export class CreatePlanningDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsString()
  currency: CurrencyType;
}
