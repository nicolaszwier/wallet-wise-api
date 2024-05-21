import { HttpStatus, Injectable } from '@nestjs/common';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { ValidatePeriodOwnershipService } from './validate-period-ownership.service';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as utc from 'dayjs/plugin/utc';
import { Period, TransactionType } from '@prisma/client';
import { SortOrder } from '../model/SortOrder';
import { PlanningsService } from 'src/modules/plannings/services/plannings.service';
import { PeriodsRequestFilters } from '../model/PeriodsRequestFilters';

dayjs.extend(isoWeek);
dayjs.extend(utc);

@Injectable()
export class PeriodsService {
  constructor(
    private readonly periodsRepo: PeriodsRepository,
    private readonly validatePeriodOwnershipService: ValidatePeriodOwnershipService,
    private readonly planningsService: PlanningsService,
  ) {}

  async findAllByUserId(
    userId: string,
    planningId: string,
    filters: PeriodsRequestFilters = {
      includeTransactions: true,
      sortOrder: SortOrder.desc,
      startDate: '',
      endDate: '',
      includeIncomes: true,
      includeExpenses: true,
    },
  ) {
    await this.validatePeriodOwnershipService.validatePlanningParam(planningId);

    const periodStart = this.getStartOfWeek(new Date(filters.startDate));
    const periodEnd = this.getEndOfWeek(new Date(filters.endDate));
    //todo - implement filters by transaction type and transaction status
    return this.periodsRepo.findMany({
      where: {
        userId,
        planningId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
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
        planningId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    if (!period) {
      period = await this.create(userId, {
        planningId,
        periodBalance: 0,
        periodBalancePaidOnly: 0,
        expectedAllTimeBalance: 0,
        expectedAllTimeBalancePaidOnly: 0,
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
    const {
      planningId,
      periodBalance,
      periodBalancePaidOnly,
      expectedAllTimeBalance,
      expectedAllTimeBalancePaidOnly,
      periodStart,
      periodEnd,
    } = createPeriodDto;

    return this.periodsRepo.create({
      data: {
        userId,
        planningId,
        periodBalance,
        periodBalancePaidOnly,
        expectedAllTimeBalance,
        expectedAllTimeBalancePaidOnly,
        periodStart,
        periodEnd,
      },
    });
  }

  async recalculateBalances(userId, periodId: string) {
    const period = (await this.findByPeriodId(periodId)) as Period & {
      transactions: [{ amount: number; isPaid: boolean }];
    };
    if (!period) return;
    const result = await this.recalculatePeriodBalance(period);
    return this.recalculateAllTimeBalance(result);
  }

  async recalculatePeriodBalance(
    period: Period & {
      transactions: [{ amount: number; isPaid: boolean }];
    },
  ) {
    const initialValue = 0;
    const totalBalance = period.transactions.reduce(
      (accumulator, currentValue) => accumulator + currentValue.amount,
      initialValue,
    );

    const totalBalancePaidOnly = period.transactions
      .filter((transaction) => transaction.isPaid)
      .reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);

    return this.updatePeriodBalance(period.userId, period.id, {
      expectedAllTimeBalance: period.expectedAllTimeBalance,
      expectedAllTimeBalancePaidOnly: period.expectedAllTimeBalancePaidOnly,
      periodBalance: totalBalance,
      periodBalancePaidOnly: totalBalancePaidOnly,
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
    let lastAllTimeBalancePaidOnly = previousWeekPeriod?.expectedAllTimeBalancePaidOnly;

    const periods = await this.periodsRepo.findMany({
      where: {
        userId: period.userId,
        planningId: period.planningId,
        periodStart: { gte: period.periodStart },
      },
      orderBy: { periodStart: SortOrder.asc },
    });

    const updatedPeriods = periods.map(
      (
        { expectedAllTimeBalance, expectedAllTimeBalancePaidOnly, periodBalance, periodBalancePaidOnly, userId, id },
        index,
        arr,
      ) => {
        const previousPeriod = arr[index - 1];
        if (previousPeriod) {
          expectedAllTimeBalance = lastAllTimeBalance + periodBalance;
          expectedAllTimeBalancePaidOnly = lastAllTimeBalancePaidOnly + periodBalancePaidOnly;
          lastAllTimeBalance = expectedAllTimeBalance;
          lastAllTimeBalancePaidOnly = expectedAllTimeBalancePaidOnly;
        } else {
          if (id === period.id) {
            expectedAllTimeBalance = (lastAllTimeBalance || 0) + periodBalance;
            expectedAllTimeBalancePaidOnly = (lastAllTimeBalancePaidOnly || 0) + periodBalancePaidOnly;
            lastAllTimeBalance = expectedAllTimeBalance;
            lastAllTimeBalancePaidOnly = expectedAllTimeBalancePaidOnly;
          }
        }
        return {
          expectedAllTimeBalance,
          expectedAllTimeBalancePaidOnly,
          periodBalance,
          periodBalancePaidOnly,
          userId,
          id,
        };
      },
    );

    // atualizar aqui a planning com os totais
    await this.planningsService.updateTotals(period.userId, period.planningId, {
      currentBalance: lastAllTimeBalancePaidOnly,
      expectedBalance: lastAllTimeBalance,
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
      periodBalancePaidOnly,
      expectedAllTimeBalance,
      expectedAllTimeBalancePaidOnly,
    }: {
      periodBalance: number;
      periodBalancePaidOnly: number;
      expectedAllTimeBalance: number;
      expectedAllTimeBalancePaidOnly: number;
    },
  ) {
    await this.validatePeriodOwnershipService.validate(userId, periodId);
    return this.periodsRepo.update({
      where: { id: periodId },
      data: {
        periodBalance,
        periodBalancePaidOnly,
        expectedAllTimeBalance,
        expectedAllTimeBalancePaidOnly,
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

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'removed',
      error: null,
    };
  }
}
