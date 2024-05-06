import { Injectable } from '@nestjs/common';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { ValidatePeriodOwnershipService } from './validate-period-ownership.service';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as utc from 'dayjs/plugin/utc';
import { Period } from '@prisma/client';
import { SortOrder } from '../model/SortOrder';

dayjs.extend(isoWeek);
dayjs.extend(utc);

@Injectable()
export class PeriodsService {
  constructor(
    private readonly periodsRepo: PeriodsRepository,
    private readonly validatePeriodOwnershipService: ValidatePeriodOwnershipService,
  ) {}

  async findAllByUserId(
    userId: string,
    planningId: string,
    filters: {
      includeTransactions: boolean;
      sortOrder: SortOrder;
    } = { includeTransactions: true, sortOrder: SortOrder.desc },
  ) {
    await this.validatePeriodOwnershipService.validatePlanningParam(planningId);

    return this.periodsRepo.findMany({
      where: { userId, planningId },
      orderBy: { periodStart: filters.sortOrder || SortOrder.desc },
      include: {
        transactions: filters.includeTransactions,
      },
    });
  }

  findByPeriodId(periodId: string) {
    return this.periodsRepo.findFirst({
      where: { id: periodId },
      include: {
        transactions: true,
      },
    });
  }

  async getPeriodId(userId, planningId: string, transactionDate: string) {
    const date = new Date(transactionDate);

    const periodStart = this.getStartOfWeek(date);
    const periodEnd = this.getEndOfWeek(date);

    let period = await this.periodsRepo.findFirst({
      where: {
        userId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    if (!period) {
      period = await this.create(userId, {
        planningId,
        periodBalance: 0,
        expectedAllTimeBalance: 0,
        periodStart,
        periodEnd,
      });
    }

    return period.id;
  }

  private getStartOfWeek(date: Date) {
    return dayjs(date).utc().startOf('isoWeek').toDate();
  }

  private getEndOfWeek(date: Date) {
    return dayjs(date).utc().endOf('isoWeek').toDate();
  }

  create(userId: string, createPeriodDto: CreatePeriodDto) {
    const { planningId, periodBalance, expectedAllTimeBalance, periodStart, periodEnd } = createPeriodDto;

    return this.periodsRepo.create({
      data: {
        userId,
        planningId,
        periodBalance,
        expectedAllTimeBalance,
        periodStart,
        periodEnd,
      },
    });
  }

  async recalculateBalances(userId, periodId: string) {
    const period = (await this.findByPeriodId(periodId)) as Period & {
      transactions: [{ amount: number }];
    };
    if (!period) return;
    const result = await this.recalculatePeriodBalance(period);
    return this.recalculateAllTimeBalance(result);
  }

  async recalculatePeriodBalance(
    period: Period & {
      transactions: [{ amount: number }];
    },
  ) {
    const initialValue = 0;
    const totalBalance = period.transactions.reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      initialValue,
    );

    return this.updatePeriodBalance(period.userId, period.id, {
      expectedAllTimeBalance: period.expectedAllTimeBalance,
      periodBalance: totalBalance,
    });
  }

  async recalculateAllTimeBalance(period: Period) {
    const previousWeekPeriod = await this.periodsRepo.findFirst({
      where: {
        userId: period.userId,
        planningId: period.planningId,
        periodStart: { lt: period.periodStart },
      },
      orderBy: { periodStart: SortOrder.desc },
    });
    let lastAllTimeBalance = previousWeekPeriod?.expectedAllTimeBalance;

    const periods = await this.periodsRepo.findMany({
      where: {
        userId: period.userId,
        planningId: period.planningId,
        periodStart: { gte: period.periodStart },
      },
      orderBy: { periodStart: SortOrder.asc },
    });

    const updatedPeriods = periods.map(({ expectedAllTimeBalance, periodBalance, userId, id }, index, arr) => {
      const previousPeriod = arr[index - 1];
      if (previousPeriod) {
        expectedAllTimeBalance = lastAllTimeBalance + periodBalance;
        lastAllTimeBalance = expectedAllTimeBalance;
      } else {
        if (id === period.id) {
          expectedAllTimeBalance = (lastAllTimeBalance || 0) + periodBalance;
          lastAllTimeBalance = expectedAllTimeBalance;
        }
      }
      return { expectedAllTimeBalance, periodBalance, userId, id };
    });

    return await Promise.all(
      updatedPeriods.map((period) => this.updatePeriodBalance(period.userId, period.id, period)),
    );
  }

  async updatePeriodBalance(
    userId: string,
    periodId: string,
    {
      periodBalance,
      expectedAllTimeBalance,
    }: {
      periodBalance: number;
      expectedAllTimeBalance: number;
    },
  ) {
    await this.validatePeriodOwnershipService.validate(userId, periodId);
    return this.periodsRepo.update({
      where: { id: periodId },
      data: {
        periodBalance,
        expectedAllTimeBalance,
      },
    });
  }

  async updatePeriodsAllTimeBalance(userId: string, periodId: string, expectedAllTimeBalance: number) {
    await this.validatePeriodOwnershipService.validate(userId, periodId);
    return this.periodsRepo.update({
      where: { id: periodId },
      data: {
        expectedAllTimeBalance: expectedAllTimeBalance,
      },
    });
  }

  async remove(userId: string, periodId: string) {
    await this.validatePeriodOwnershipService.validate(userId, periodId);

    await this.periodsRepo.delete({
      where: { id: periodId },
    });

    return null;
  }
}
