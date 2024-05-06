import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { PlanningsService } from './services/plannings.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { UpdatePlanningDto } from './dto/update-planning.dto';

@Controller('api/plannings')
export class PlanningsController {
  constructor(private readonly planningsService: PlanningsService) {}

  @Get()
  findAll(@ActiveUserId() userId: string) {
    return this.planningsService.findAllByUserId(userId);
  }

  @Post()
  create(@ActiveUserId() userId: string, @Body() createPlanningDto: CreatePlanningDto) {
    return this.planningsService.create(userId, createPlanningDto);
  }

  @Put(':planningId')
  update(
    @ActiveUserId() userId: string,
    @Param('planningId') planningId: string,
    @Body() updatePlanningDto: UpdatePlanningDto,
  ) {
    return this.planningsService.update(userId, planningId, updatePlanningDto);
  }

  @Delete(':planningId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @ActiveUserId() userId: string,
    @Param('planningId')
    planningId: string,
  ) {
    return this.planningsService.remove(userId, planningId);
  }
}
