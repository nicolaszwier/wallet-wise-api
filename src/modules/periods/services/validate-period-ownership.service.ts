import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';

@Injectable()
export class ValidatePeriodOwnershipService {
  constructor(private readonly periodRepo: PeriodsRepository) {}

  async validate(userId: string, periodId: string) {
    const isOwner = await this.periodRepo.findFirst({
      where: { id: periodId, userId },
    });

    if (!isOwner) {
      throw new NotFoundException('Period not found.');
    }
  }

  async validatePlanningParam(planningId: string) {
    //error by Prisma: provided hex string representation must be exactly 12 bytes, instead got: "2343fds", length 7.
    if (planningId.length < 11) {
      throw new BadRequestException('Invalid planning id.');
    }
  }
}
