import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';

@Injectable()
export class ValidatePlanningOwnershipService {
  constructor(private readonly planningsRepo: PlanningsRepository) {}

  async validate(userId: string, planningId: string) {
    const planning = await this.planningsRepo.findFirst({
      where: { id: planningId, userId },
    });

    if (!planning) {
      throw new NotFoundException('Planning not found.');
    }

    return planning;
  }
}
