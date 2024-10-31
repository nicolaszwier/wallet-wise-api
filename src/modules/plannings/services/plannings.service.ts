import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
        currentBalance: true,
        expectedBalance: true,
        dateOfCreation: true,
        default: true,
      },
    });
  }

  create(userId: string, isDefault: boolean, createPlanningDto: CreatePlanningDto) {
    const { description, currency } = createPlanningDto;

    return this.planningsRepo.create({
      data: {
        userId,
        description,
        currentBalance: 0,
        expectedBalance: 0,
        currency,
        active: true,
        dateOfCreation: new Date(),
        default: isDefault,
      },
    });
  }

  async update(userId: string, planningId: string, updatePlanningDto: UpdatePlanningDto) {
    try {
      // await this.validatePlanningOwnershipService.validate(userId, planningId);
      // const { description, currency } = updatePlanningDto;
      await this.planningsRepo.update({
        // where: { id: planningId },
        data: {
          default: false,
          // currency,
        },
        // select: {
        //   id: true,
        //   description: true,
        //   currency: true,
        //   active: true,
        //   default: true,
        // },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'updated',
        error: null,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  async updateTotals(
    userId: string,
    planningId: string,
    { currentBalance, expectedBalance }: { currentBalance: number; expectedBalance: number },
  ) {
    await this.validatePlanningOwnershipService.validate(userId, planningId);

    return this.planningsRepo.update({
      where: { id: planningId },
      data: {
        currentBalance,
        expectedBalance,
      },
    });
  }

  async remove(userId: string, planningId: string) {
    const planning = await this.validatePlanningOwnershipService.validate(userId, planningId);

    if (planning?.default) {
      throw new HttpException('A default planning cannot be removed', HttpStatus.BAD_REQUEST);
    }

    await this.planningsRepo.update({
      where: { id: planningId },
      data: {
        active: false,
      },
    });

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'removed',
      error: null,
    };
  }
}
