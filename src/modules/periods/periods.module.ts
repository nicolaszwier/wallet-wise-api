import { Module } from '@nestjs/common';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './services/periods.service';
import { ValidatePeriodOwnershipService } from './services/validate-period-ownership.service';

@Module({
  controllers: [PeriodsController],
  providers: [PeriodsService, ValidatePeriodOwnershipService],
  exports: [PeriodsService, ValidatePeriodOwnershipService],
})
export class PeriodsModule {}
