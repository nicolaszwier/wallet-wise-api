import { Injectable } from '@nestjs/common';
import { RecurringConfigRecord } from '../model/recurring-config.types';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { PeriodsService } from 'src/modules/periods/services/periods.service';
import { RecurringConfigsRepository } from 'src/shared/database/repositories/recurring-configs.repository';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import {
  advanceRecurrenceDate,
  getForecastHorizonFromDate,
  getForecastHorizonFromToday,
  getRecurrenceOccurrenceDates,
  getStartOfDayUtc,
  parseCalendarDate,
  toCalendarDateStorage,
} from 'src/shared/utils/utils';

dayjs.extend(utc);

type GenerationMode = 'initial' | 'maintain' | 'regenerate';

@Injectable()
export class RecurringGenerationService {
  constructor(
    private readonly transactionsRepo: TransactionsRepository,
    private readonly recurringConfigsRepo: RecurringConfigsRepository,
    private readonly periodsService: PeriodsService,
  ) {}

  async generateForConfig(
    config: RecurringConfigRecord,
    mode: GenerationMode,
    options?: { skipRecalculate?: boolean },
  ) {
    const today = dayjs().utc().startOf('day');
    const { fromBound, toBound } = this.getBounds(config, mode, today);

    if (fromBound.isAfter(toBound, 'day')) {
      return { generatedCount: 0, lastGeneratedDate: config.lastGeneratedDate, affectedPeriodIds: [] };
    }

    const occurrenceDates = getRecurrenceOccurrenceDates(config, fromBound, toBound);
    const periodIds = new Set<string>();
    let lastGeneratedDate: Date | null = config.lastGeneratedDate;
    let generatedCount = 0;

    for (const occurrenceDate of occurrenceDates) {
      const startOfDay = getStartOfDayUtc(occurrenceDate);
      const endOfDay = startOfDay.endOf('day').toDate();

      const existing = await this.transactionsRepo.findFirst({
        where: {
          recurringConfigId: config.id,
          date: {
            gte: startOfDay.toDate(),
            lte: endOfDay,
          },
        },
      });

      if (existing) {
        lastGeneratedDate = occurrenceDate;
        continue;
      }

      const periodId = await this.periodsService.getPeriodId(
        config.userId,
        config.planningId,
        occurrenceDate.toISOString(),
      );

      await this.transactionsRepo.create({
        data: {
          userId: config.userId,
          planningId: config.planningId,
          categoryId: config.categoryId,
          periodId,
          description: config.description,
          amount: config.amount,
          type: config.type,
          date: toCalendarDateStorage(occurrenceDate),
          isPaid: false,
          recurringConfigId: config.id,
          dateCreated: dayjs().utc(true).format(),
        },
      });

      periodIds.add(periodId);
      lastGeneratedDate = occurrenceDate;
      generatedCount += 1;
    }

    const affectedPeriodIds = Array.from(periodIds);

    if (!options?.skipRecalculate && affectedPeriodIds.length > 0) {
      await this.periodsService.recalculateBalances(config.userId, affectedPeriodIds);
    }

    if (lastGeneratedDate) {
      await this.recurringConfigsRepo.update({
        where: { id: config.id },
        data: { lastGeneratedDate },
      });
    }

    return {
      generatedCount,
      lastGeneratedDate,
      affectedPeriodIds,
    };
  }

  async deleteFutureUnpaidTransactions(configId: string) {
    const today = dayjs().utc().startOf('day').toDate();

    const transactionsToDelete = await this.transactionsRepo.findMany({
      where: {
        recurringConfigId: configId,
        isPaid: false,
        date: { gt: today },
      },
      select: { id: true, periodId: true, userId: true },
    });

    if (transactionsToDelete.length === 0) {
      return [];
    }

    await this.transactionsRepo.deleteMany({
      where: {
        recurringConfigId: configId,
        isPaid: false,
        date: { gt: today },
      },
    });

    return transactionsToDelete;
  }

  async regenerateForConfig(config: RecurringConfigRecord) {
    const deleted = await this.deleteFutureUnpaidTransactions(config.id);
    const affectedPeriodIds = new Set(deleted.map((transaction) => transaction.periodId));

    const result = await this.generateForConfig({ ...config, lastGeneratedDate: null }, 'regenerate', {
      skipRecalculate: true,
    });

    result.affectedPeriodIds.forEach((periodId) => affectedPeriodIds.add(periodId));

    if (affectedPeriodIds.size > 0) {
      await this.periodsService.recalculateBalances(config.userId, Array.from(affectedPeriodIds));
    }

    return result;
  }

  async maintainForecast(config: RecurringConfigRecord) {
    const horizon = getForecastHorizonFromToday();

    if (config.lastGeneratedDate && !getStartOfDayUtc(config.lastGeneratedDate).isBefore(horizon, 'day')) {
      return { generatedCount: 0, lastGeneratedDate: config.lastGeneratedDate };
    }

    return this.generateForConfig(config, 'maintain');
  }

  private getBounds(config: RecurringConfigRecord, mode: GenerationMode, today: dayjs.Dayjs) {
    const startDate = parseCalendarDate(config.startDate);

    if (mode === 'initial') {
      const fromBound = startDate.isAfter(today, 'day') ? startDate : today;
      return {
        fromBound,
        toBound: getForecastHorizonFromDate(fromBound.toDate()),
      };
    }

    if (mode === 'regenerate') {
      const fromBound = startDate.isAfter(today, 'day') ? startDate : today;
      return {
        fromBound,
        toBound: getForecastHorizonFromToday(),
      };
    }

    const fromBound = config.lastGeneratedDate
      ? advanceRecurrenceDate(getStartOfDayUtc(config.lastGeneratedDate), config.frequency, config.recurringDay)
      : startDate.isAfter(today, 'day')
        ? startDate
        : today;

    return {
      fromBound,
      toBound: getForecastHorizonFromToday(),
    };
  }
}
