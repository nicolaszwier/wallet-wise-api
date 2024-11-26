import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { ValidatePeriodOwnershipService } from './validate-period-ownership.service';
import { Category, Period, Transaction } from '@prisma/client';
import { SortOrder } from '../model/SortOrder';
import { PlanningsService } from 'src/modules/plannings/services/plannings.service';
import { PeriodsRequestFilters } from '../model/PeriodsRequestFilters';
import { getEndOfWeek, getStartOfWeek } from 'src/shared/utils/utils';
import { I18nService, I18nContext } from 'nestjs-i18n';

type PeriodResponse = Period & {
  transactions: (Transaction & {
    category: Category
  })[];
}

@Injectable()
export class PeriodsService {
  constructor(
    private readonly periodsRepo: PeriodsRepository,
    private readonly validatePeriodOwnershipService: ValidatePeriodOwnershipService,
    private readonly planningsService: PlanningsService,
    private readonly i18n: I18nService,
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
    try {
      await this.validatePeriodOwnershipService.validatePlanningParam(planningId);

      const periodStart = getStartOfWeek(new Date(filters.startDate));
      const periodEnd = getEndOfWeek(new Date(filters.endDate));
      //todo - implement filters by transaction type and transaction status
      const periods = await this.periodsRepo.findMany({
        where: {
          userId,
          planningId,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        orderBy: { periodStart: filters.sortOrder || SortOrder.desc },
        include: {
          transactions: filters.includeTransactions ? { include: { category: true } } : false,
        },
      }) as unknown as PeriodResponse[];

      // Prisma currently does not support ordering nested relations directly in MongoDB so it's necessary to do on code level
      if (filters.includeTransactions) {
        periods?.forEach((period) => {
          period.transactions.sort((a, b) => Date.parse(a.date.toString()) - Date.parse(b.date.toString()));
        });
      }

      return periods.map(period => {
        return {
          ...period,
          transactions: period.transactions.map(el => {
            return {
              ...el,
              category: {
                ...el.category,
                description: this.i18n.t(`categories.${el.category.description}`, { lang: I18nContext.current().lang }),
              }
            }
          })
        }
      }) || [];
    } catch (error) {
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  findByPeriodId(periodId: string) {
    return this.periodsRepo.findFirst({
      where: { id: periodId },
      include: {
        transactions: true,
      },
    });
  }

  private findManyByPeriodIds(periodIds: string[]) {
    return this.periodsRepo.findMany({
      where: { id: { in: periodIds } },
      include: {
        transactions: true,
      },
      orderBy: { periodStart: 'asc' },
    });
  }

  async getPeriodId(userId, planningId: string, transactionDate: string) {
    const date = new Date(transactionDate);
    const periodStart = getStartOfWeek(date);
    const periodEnd = getEndOfWeek(date);

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

  async recalculateBalances(userId, periodIds: string[]) {
    const periods = (await this.findManyByPeriodIds(periodIds)) as (Period & {
      transactions: [{ amount: number; isPaid: boolean }];
    })[];
    if (periods?.length < 1) return;
    const promises = periods.map((period) => this.recalculatePeriodBalance(period));
    const result = await Promise.all(promises);
    // gets the oldest period and recalculate all balances since then
    return this.recalculateAllTimeBalance(result?.[0]);
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
