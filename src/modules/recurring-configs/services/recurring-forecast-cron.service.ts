import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecurringConfigsRepository } from 'src/shared/database/repositories/recurring-configs.repository';
import { RecurringGenerationService } from './recurring-generation.service';

@Injectable()
export class RecurringForecastCronService {
  private readonly logger = new Logger(RecurringForecastCronService.name);

  constructor(
    private readonly recurringConfigsRepo: RecurringConfigsRepository,
    private readonly recurringGenerationService: RecurringGenerationService,
  ) {}

  @Cron('0 0 * * *')
  async maintainForecasts() {
    const activeConfigs = await this.recurringConfigsRepo.findMany({
      where: { active: true },
    });

    for (const config of activeConfigs) {
      try {
        const result = await this.recurringGenerationService.maintainForecast(config);
        if (result.generatedCount > 0) {
          this.logger.log(
            `Generated ${result.generatedCount} transactions for recurring config ${config.id}`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to maintain forecast for config ${config.id}`, error);
      }
    }
  }
}
