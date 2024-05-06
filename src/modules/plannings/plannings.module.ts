import { Module } from '@nestjs/common';
import { PlanningsController } from './plannings.controller';
import { PlanningsService } from './services/plannings.service';
import { ValidatePlanningOwnershipService } from './services/validate-planning-ownership.service';

@Module({
  controllers: [PlanningsController],
  providers: [PlanningsService, ValidatePlanningOwnershipService],
  exports: [ValidatePlanningOwnershipService],
})
export class PlanningsModule {}
