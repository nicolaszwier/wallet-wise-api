import { Injectable } from '@nestjs/common';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';
import { CreatePlanningDto } from '../dto/create-planning.dto';
import { ValidatePlanningOwnershipService } from './validate-planning-ownership.service';
import { UpdatePlanningDto } from '../dto/update-planning.dto';

@Injectable()
export class PlanningsService {
  constructor(
    private readonly planningsRepo: PlanningsRepository,
    private readonly validatePlanningOwnershipService: ValidatePlanningOwnershipService,
  ) {}

  findAllByUserId(userId: string) {
    return this.planningsRepo.findMany({
      where: { userId, active: true },
      select: {
        id: true,
        description: true,
        currency: true,
        initialBalance: true,
        dateOfCreation: true,
      },
    });
  }

  create(userId: string, createPlanningDto: CreatePlanningDto) {
    const { description, initialBalance, currency } = createPlanningDto;

    return this.planningsRepo.create({
      data: {
        userId,
        description,
        initialBalance,
        currency,
        active: true,
        dateOfCreation: new Date(),
      },
    });
  }

  async update(userId: string, planningId: string, updatePlanningDto: UpdatePlanningDto) {
    await this.validatePlanningOwnershipService.validate(userId, planningId);

    const { description, currency } = updatePlanningDto;

    return this.planningsRepo.update({
      where: { id: planningId },
      data: {
        description,
        currency,
      },
      select: {
        id: true,
        description: true,
        currency: true,
        active: true,
      },
    });
  }

  async remove(userId: string, planningId: string) {
    await this.validatePlanningOwnershipService.validate(userId, planningId);

    await this.planningsRepo.delete({
      where: { id: planningId },
    });

    return null;
  }
}
