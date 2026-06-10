import { Module } from '@nestjs/common';
import { PeriodsModule } from '../periods/periods.module';
import { PlanningsModule } from '../plannings/plannings.module';
import { CategoriesModule } from '../categories/categories.module';
import { RecurringConfigsController } from './recurring-configs.controller';
import { RecurringConfigsService } from './services/recurring-configs.service';
import { RecurringForecastCronService } from './services/recurring-forecast-cron.service';
import { RecurringGenerationService } from './services/recurring-generation.service';
import { ValidateRecurringOwnershipService } from './services/validate-recurring-ownership.service';

@Module({
  imports: [PeriodsModule, PlanningsModule, CategoriesModule],
  controllers: [RecurringConfigsController],
  providers: [
    RecurringConfigsService,
    RecurringGenerationService,
    ValidateRecurringOwnershipService,
    RecurringForecastCronService,
  ],
  exports: [RecurringGenerationService, RecurringConfigsService],
})
export class RecurringConfigsModule {}
