import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RecurrenceFrequency, Transaction, TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { RecurringConfigsRepository } from 'src/shared/database/repositories/recurring-configs.repository';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import { ValidatePlanningOwnershipService } from 'src/modules/plannings/services/validate-planning-ownership.service';
import { getForecastHorizonFromToday, parseCalendarDate, toCalendarDateStorage } from 'src/shared/utils/utils';
import { CreateRecurringConfigDto } from '../dto/create-recurring-config.dto';
import { UpdateRecurringConfigDto } from '../dto/update-recurring-config.dto';
import { RecurringGenerationService } from './recurring-generation.service';
import { ValidateRecurringOwnershipService } from './validate-recurring-ownership.service';
import { PeriodsService } from 'src/modules/periods/services/periods.service';

dayjs.extend(utc);

@Injectable()
export class RecurringConfigsService {
  constructor(
    private readonly recurringConfigsRepo: RecurringConfigsRepository,
    private readonly categoriesRepo: CategoriesRepository,
    private readonly validatePlanningOwnershipService: ValidatePlanningOwnershipService,
    private readonly validateRecurringOwnershipService: ValidateRecurringOwnershipService,
    private readonly recurringGenerationService: RecurringGenerationService,
    private readonly periodsService: PeriodsService,
    private readonly transactionsRepo: TransactionsRepository,
  ) {}

  async create(userId: string, dto: CreateRecurringConfigDto) {
    try {
      await this.validatePlanningOwnershipService.validate(userId, dto.planningId);
      await this.validateCategory(userId, dto.categoryId, dto.type);

      const startDate = parseCalendarDate(dto.startDate);
      const recurringDay = startDate.date();
      const signedAmount = dto.type === TransactionType.EXPENSE ? dto.amount * -1 : dto.amount;

      const config = await this.recurringConfigsRepo.create({
        data: {
          userId,
          planningId: dto.planningId,
          categoryId: dto.categoryId,
          amount: signedAmount,
          description: dto.description,
          type: dto.type,
          frequency: dto.frequency,
          startDate: toCalendarDateStorage(dto.startDate),
          endDate: dto.endDate ? toCalendarDateStorage(dto.endDate) : null,
          recurringDay,
          lastGeneratedDate: null,
          active: true,
          dateCreated: dayjs().utc(true).toDate(),
        },
      });

      await this.recurringGenerationService.generateForConfig(config, 'initial');

      return {
        statusCode: HttpStatus.CREATED,
        message: 'created',
        data: config,
        error: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  async createFromTransaction(
    userId: string,
    transaction: Transaction,
    options: { frequency: RecurrenceFrequency; endDate?: string },
  ) {
    await this.validatePlanningOwnershipService.validate(userId, transaction.planningId);
    await this.validateCategory(userId, transaction.categoryId, transaction.type);

    const startDate = parseCalendarDate(transaction.date);
    const recurringDay = startDate.date();

    const config = await this.recurringConfigsRepo.create({
      data: {
        userId,
        planningId: transaction.planningId,
        categoryId: transaction.categoryId,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        frequency: options.frequency,
        startDate: toCalendarDateStorage(transaction.date),
        endDate: options.endDate ? toCalendarDateStorage(options.endDate) : null,
        recurringDay,
        lastGeneratedDate: null,
        active: true,
        dateCreated: dayjs().utc(true).toDate(),
      },
    });

    await this.transactionsRepo.update({
      where: { id: transaction.id },
      data: { recurringConfigId: config.id },
    });

    const { affectedPeriodIds } = await this.recurringGenerationService.generateForConfig(config, 'initial', {
      skipRecalculate: true,
    });

    return { config, affectedPeriodIds };
  }

  async findAllByPlanning(userId: string, planningId: string) {
    await this.validatePlanningOwnershipService.validate(userId, planningId);

    return this.recurringConfigsRepo.findMany({
      where: { userId, planningId, active: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(userId: string, configId: string) {
    return this.validateRecurringOwnershipService.validate(userId, configId);
  }

  async update(userId: string, configId: string, dto: UpdateRecurringConfigDto) {
    try {
      const existing = await this.validateRecurringOwnershipService.validate(userId, configId);

      if (dto.planningId) {
        await this.validatePlanningOwnershipService.validate(userId, dto.planningId);
      }

      const type = dto.type ?? existing.type;
      if (dto.categoryId) {
        await this.validateCategory(userId, dto.categoryId, type);
      }

      const startDate = dto.startDate ? parseCalendarDate(dto.startDate) : parseCalendarDate(existing.startDate);
      const amount = dto.amount
        ? type === TransactionType.EXPENSE
          ? dto.amount * -1
          : dto.amount
        : existing.amount;

      const updated = await this.recurringConfigsRepo.update({
        where: { id: configId },
        data: {
          planningId: dto.planningId,
          categoryId: dto.categoryId,
          description: dto.description,
          amount,
          type: dto.type,
          frequency: dto.frequency,
          startDate: dto.startDate ? toCalendarDateStorage(dto.startDate) : undefined,
          endDate: dto.endDate !== undefined ? (dto.endDate ? toCalendarDateStorage(dto.endDate) : null) : undefined,
          recurringDay: dto.startDate ? startDate.date() : undefined,
          lastGeneratedDate: null,
        },
      });

      await this.recurringGenerationService.regenerateForConfig(updated);

      return {
        statusCode: HttpStatus.OK,
        message: 'updated',
        data: updated,
        error: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  async remove(userId: string, configId: string) {
    try {
      const config = await this.validateRecurringOwnershipService.validate(userId, configId);
      const deleted = await this.recurringGenerationService.deleteFutureUnpaidTransactions(configId);
      const periodIds = [...new Set(deleted.map((transaction) => transaction.periodId))];

      await this.recurringConfigsRepo.update({
        where: { id: configId },
        data: { active: false },
      });

      if (periodIds.length > 0) {
        await this.periodsService.recalculateBalances(userId, periodIds);
      }

      return {
        statusCode: HttpStatus.NO_CONTENT,
        message: 'removed',
        error: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  async checkForecastHealth(userId: string) {
    const horizon = getForecastHorizonFromToday().toDate();
    const today = dayjs().utc().startOf('day').toDate();

    const activeConfigs = await this.recurringConfigsRepo.findMany({
      where: { active: true, userId },
    });

    const forecast: Record<string, Date[]> = {};

    for (const config of activeConfigs) {
      const futureTransactions = await this.transactionsRepo.findMany({
        where: {
          recurringConfigId: config.id,
          date: { gt: today, lte: horizon },
        },
        orderBy: { date: 'asc' },
      });

      forecast[config.id] = futureTransactions.map((transaction) => transaction.date);
    }

    return {
      totalConfigs: activeConfigs.length,
      configsWithFutureTransactions: Object.keys(forecast).length,
      nextGenerationDate: horizon,
      forecast,
    };
  }

  private async validateCategory(userId: string, categoryId: string, type: TransactionType) {
    const category = await this.categoriesRepo.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    if (category.type !== type) {
      throw new BadRequestException('Category type does not match transaction type.');
    }
  }
}
