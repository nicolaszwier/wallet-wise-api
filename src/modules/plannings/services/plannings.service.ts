import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';
import { CreatePlanningDto } from '../dto/create-planning.dto';
import { ValidatePlanningOwnershipService } from './validate-planning-ownership.service';
import { UpdatePlanningDto } from '../dto/update-planning.dto';
import { currenciesList } from 'src/shared/database/data/currencies';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class PlanningsService {
  constructor(
    private readonly planningsRepo: PlanningsRepository,
    private readonly validatePlanningOwnershipService: ValidatePlanningOwnershipService,
    private readonly i18n: I18nService,
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
        isDefault: true,
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
        isDefault: isDefault,
      },
    });
  }

  async update(userId: string, planningId: string, updatePlanningDto: UpdatePlanningDto) {
    try {
      await this.validatePlanningOwnershipService.validate(userId, planningId);
      const { description, currency } = updatePlanningDto;
      await this.planningsRepo.update({
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
          isDefault: true,
        },
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

    if (planning?.isDefault) {
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

  findAllCurrencies() {
    return currenciesList.map((el) => {
      return {
        [el]: this.i18n.t(`currencies.currency.${el}`, { lang: I18nContext.current().lang }),
      };
    });
  }
}
