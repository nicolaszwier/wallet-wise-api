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
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeExpenses') includeExpenses: boolean,
    @Query('includeIncomes') includeIncomes: boolean,
    @Query('sortOrder') sortOrder: SortOrder,
  ) {
    return this.periodsService.findAllByUserId(userId, planningId, {
      sortOrder,
      includeTransactions: true,
      startDate,
      endDate,
      includeExpenses: Boolean(includeExpenses),
      includeIncomes: Boolean(includeIncomes),
    });
  }
}
