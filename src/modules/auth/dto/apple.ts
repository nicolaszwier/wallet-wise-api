import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppleDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  name?: string;
}
