import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';

@Injectable()
export class ValidatePlanningOwnershipService {
  constructor(private readonly planningsRepo: PlanningsRepository) {}

  async validate(userId: string, planningId: string) {
    const isOwner = await this.planningsRepo.findFirst({
      where: { id: planningId, userId },
    });

    if (!isOwner) {
      throw new NotFoundException('Planning not found.');
    }
  }
}
