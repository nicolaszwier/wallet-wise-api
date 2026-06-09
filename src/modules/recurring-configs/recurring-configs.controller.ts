import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { CreateRecurringConfigDto } from './dto/create-recurring-config.dto';
import { UpdateRecurringConfigDto } from './dto/update-recurring-config.dto';
import { RecurringConfigsService } from './services/recurring-configs.service';

@Controller('api/recurring-configs')
export class RecurringConfigsController {
  constructor(private readonly recurringConfigsService: RecurringConfigsService) {}

  @Post()
  create(@ActiveUserId() userId: string, @Body() dto: CreateRecurringConfigDto) {
    return this.recurringConfigsService.create(userId, dto);
  }

  @Get('health/forecast')
  checkForecastHealth(@ActiveUserId() userId: string) {
    return this.recurringConfigsService.checkForecastHealth(userId);
  }

  @Get('detail/:configId')
  findOne(@ActiveUserId() userId: string, @Param('configId') configId: string) {
    return this.recurringConfigsService.findOne(userId, configId);
  }

  @Get(':planningId')
  findAll(@ActiveUserId() userId: string, @Param('planningId') planningId: string) {
    return this.recurringConfigsService.findAllByPlanning(userId, planningId);
  }

  @Put(':configId')
  update(
    @ActiveUserId() userId: string,
    @Param('configId') configId: string,
    @Body() dto: UpdateRecurringConfigDto,
  ) {
    return this.recurringConfigsService.update(userId, configId, dto);
  }

  @Delete(':configId')
  remove(@ActiveUserId() userId: string, @Param('configId') configId: string) {
    return this.recurringConfigsService.remove(userId, configId);
  }
}
