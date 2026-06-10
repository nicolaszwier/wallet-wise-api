import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionType } from 'src/modules/transactions/model/TransactionType';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  description: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  parentCategoryId?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
