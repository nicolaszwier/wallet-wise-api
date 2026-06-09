import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringConfigDto } from './create-recurring-config.dto';

export class UpdateRecurringConfigDto extends PartialType(CreateRecurringConfigDto) {}
