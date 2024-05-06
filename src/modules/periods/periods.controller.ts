import { Controller, Get, Param, Query } from '@nestjs/common';
import { PeriodsService } from './services/periods.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { SortOrder } from './model/SortOrder';

@Controller('api/periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get(':planningId')
  findAll(
    @ActiveUserId() userId: string,
    @Param('planningId') planningId: string,
    @Query('sortOrder') sortOrder: SortOrder,
  ) {
    return this.periodsService.findAllByUserId(userId, planningId, {
      sortOrder,
      includeTransactions: true,
    });
  }
}
