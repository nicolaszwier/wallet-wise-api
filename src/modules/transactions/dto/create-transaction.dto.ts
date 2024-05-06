import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '../model/Transaction';
import { Category } from '../model/Category';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  planningId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsBoolean()
  isPaid: boolean;

  @IsNotEmpty()
  @IsEnum(Category)
  category: Category;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}
