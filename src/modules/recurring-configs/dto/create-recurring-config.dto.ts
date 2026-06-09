import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { RecurrenceFrequency } from '../model/RecurrenceFrequency';
import { TransactionType } from 'src/modules/transactions/model/TransactionType';

export class CreateRecurringConfigDto {
  @IsString()
  @IsNotEmpty()
  planningId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
