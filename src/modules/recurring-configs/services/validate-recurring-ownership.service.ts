import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringConfigsRepository } from 'src/shared/database/repositories/recurring-configs.repository';

@Injectable()
export class ValidateRecurringOwnershipService {
  constructor(private readonly recurringConfigsRepo: RecurringConfigsRepository) {}

  async validate(userId: string, configId: string) {
    const config = await this.recurringConfigsRepo.findFirst({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException('Recurring config not found.');
    }

    return config;
  }
}
