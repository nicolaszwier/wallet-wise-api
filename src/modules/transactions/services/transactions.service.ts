import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RecurringConfigsService } from 'src/modules/recurring-configs/services/recurring-configs.service';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionType } from '../model/TransactionType';
import { ValidateTransactionOwnershipService } from './validate-transaction-ownership.service';
import { PeriodsService } from 'src/modules/periods/services/periods.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { getEndOfMonth, getStartOfMonth, toCalendarDateStorage } from 'src/shared/utils/utils';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Category, CategorySource, Transaction } from '@prisma/client';
import { MonthlyBalance } from '../model/Balance';
import { ValidateCategoryService } from 'src/modules/categories/services/validate-category.service';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { mapCategoryForResponse, resolveCategoryDescription } from 'src/shared/utils/category-display.util';
import { rollUpChildCategoryBalances } from 'src/shared/utils/category-balance.util';

dayjs.extend(utc);

type TransactionResponse = Transaction & {
  category: Category
}
type MonthlyBalanceResponse = MonthlyBalance;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepo: TransactionsRepository,
    private readonly validateTransactionOwnershipService: ValidateTransactionOwnershipService,
    private readonly periodsService: PeriodsService,
    private readonly i18n: I18nService,
    private readonly recurringConfigsService: RecurringConfigsService,
    private readonly validateCategoryService: ValidateCategoryService,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const {
      planningId,
      categoryId,
      description,
      amount,
      date,
      isPaid,
      type,
      isRecurring,
      frequency,
      endDate,
    } = createTransactionDto;

    try {
      await this.validateEntitiesOwnership({
        userId,
      });
      await this.validateCategoryService.validateForTransaction(userId, categoryId, type);
      const normalizedDate = toCalendarDateStorage(date);
      const periodId = await this.periodsService.getPeriodId(userId, planningId, normalizedDate.toISOString());
      const transaction = await this.transactionsRepo.create({
        data: {
          userId,
          planningId,
          categoryId,
          periodId: periodId,
          description,
          amount: type === TransactionType.EXPENSE ? amount * -1 : amount,
          type,
          date: normalizedDate,
          isPaid,
          dateCreated: dayjs().utc(true).format(),
        },
      });

      const periodIds = new Set<string>([periodId]);

      if (isRecurring && frequency) {
        const { affectedPeriodIds } = await this.recurringConfigsService.createFromTransaction(
          userId,
          transaction,
          { frequency, endDate },
        );
        affectedPeriodIds.forEach((id) => periodIds.add(id));

        const updated = await this.transactionsRepo.findFirst({ where: { id: transaction.id } });
        await this.periodsService.recalculateBalances(userId, Array.from(periodIds));

        return {
          statusCode: HttpStatus.CREATED,
          message: 'created',
          data: updated ?? transaction,
          error: null,
        };
      }

      await this.periodsService.recalculateBalances(userId, [periodId]);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'created',
        data: transaction,
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

  async createMany(userId: string, createTransactionDto: CreateTransactionDto[]) {
    const transactions = [];

    try {
      await this.validateEntitiesOwnership({
        userId,
      });

      for await (const transaction of createTransactionDto) {
        const { planningId, categoryId, description, amount, date, isPaid, type } = transaction;

        try {
          await this.validateCategoryService.validateForTransaction(userId, categoryId, type);
          const periodId = await this.periodsService.getPeriodId(userId, planningId, date);
          transactions.push({
            userId,
            planningId,
            categoryId,
            periodId: periodId,
            description,
            amount: type === TransactionType.EXPENSE ? amount * -1 : amount,
            type,
            date: dayjs(date).utc().format(),
            isPaid,
            dateCreated: dayjs().utc(true).format(),
          });
        } catch (error) {
          console.log(error);
          throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
        }
      }

      await this.transactionsRepo.createMany({
        data: transactions,
      });

      //sorts the array of transactions to get the oldest periodId to recalculate the balances
      // transactions.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
      const periodIds: string[] = transactions.map((el) => el.periodId);

      // tech debt: improve logic of recalculating balances
      await this.periodsService.recalculateBalances(userId, periodIds);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'created',
        error: null,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  findAllByUserId(
    userId: string,
    filters: {
      periodId?: string;
      sortOrder?: string;
    },
  ) {
    return this.transactionsRepo.findMany({
      where: {
        userId,
        periodId: filters.periodId,
      },
    });
  }

  async findAllPendingDueInAWeek(userId: string, planningId: string) {
    const response = await this.transactionsRepo.findMany({
      where: {
        userId,
        planningId: planningId,
        isPaid: false,
        date: { lte: dayjs().utc().add(7, 'day').toDate() },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    }) as TransactionResponse[];

    return response.map((el) => {
      return {
        ...el,
        category: mapCategoryForResponse(el.category, this.i18n, I18nContext.current()?.lang ?? 'en'),
      };
    }) || []
  }

  // if month and year are not passed, return the balance for the current month
  async findMonthlyBalance(userId: string, planningId: string, month: string, year: string) {
    const date = year && month ? new Date(Number(year), Number(month) - 1) : new Date();

    const result = await this.transactionsRepo.agregate({
      pipeline: [
        {
          $match: {
            user_id: userId,
            planning_id: {
              $oid: planningId,
            },
            date: {
              $gte: {
                $date: getStartOfMonth(date),
              },
              $lt: {
                $date: getEndOfMonth(date),
              },
            },
          },
        },
        {
          $addFields: {
            year: {
              $year: '$date',
            },
            month: {
              $month: '$date',
            },
          },
        },
        {
          $group: {
            _id: {
              categoryId: '$category_id',
              type: '$type',
              year: '$year',
              month: '$month',
            },
            totalBalance: {
              $sum: '$amount',
            },
            totalPaidBalance: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$is_paid', true],
                  },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id.categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category',
        },
        {
          $project: {
            categoryId: {
              $toString: '$_id.categoryId',
            },
            type: '$_id.type',
            description: '$category.description',
            icon: '$category.icon',
            balance: '$totalBalance',
            balancePaidOnly: '$totalPaidBalance',
            year: '$_id.year',
            month: '$_id.month',
          },
        },
        {
          $group: {
            _id: {
              user_id: '$user_id',
              year: '$year',
              month: '$month',
            },
            categories: {
              $push: {
                categoryId: '$categoryId',
                type: '$type',
                description: '$description',
                icon: '$icon',
                balance: '$balance',
                balancePaidOnly: '$balancePaidOnly',
              },
            },
            totalExpenses: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$type', 'EXPENSE'],
                  },
                  '$balance',
                  0,
                ],
              },
            },
            totalExpensesPaidOnly: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$type', 'EXPENSE'],
                  },
                  '$balance_paid_only',
                  0,
                ],
              },
            },
            totalIncomes: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$type', 'INCOME'],
                  },
                  '$balance',
                  0,
                ],
              },
            },
            totalIncomesPaidOnly: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$type', 'INCOME'],
                  },
                  '$balance_paid_only',
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            user_id: '$_id.user_id',
            year: '$_id.year',
            month: '$_id.month',
            expenses: '$totalExpenses',
            expensesPaidOnly: '$totalExpensesPaidOnly',
            incomes: '$totalIncomes',
            incomesPaidOnly: '$totalIncomesPaidOnly',
            categories: 1,
          },
        },
      ],
    }) as unknown as MonthlyBalanceResponse[];

    if (result && result?.length === 0) {
      return { 
        year: year,
        month: month,
        expenses: 0,
        expensesPaidOnly: 0,
        incomes: 0,
        incomesPaidOnly: 0,
        categories: [],
      } as MonthlyBalanceResponse;
    }

    const userCategories = await this.categoriesRepo.findMany({ where: { userId } });
    const categoryById = new Map(userCategories.map((category) => [category.id, category]));
    const categoryMeta = new Map(
      userCategories.map((category) => [
        category.id,
        {
          parentCategoryId: category.parentCategoryId,
          description: category.description,
          icon: category.icon,
          type: category.type,
        },
      ]),
    );
    const lang = I18nContext.current()?.lang ?? 'en';
    const rolledUpCategories = rollUpChildCategoryBalances(result[0]?.categories ?? [], categoryMeta);
    
    return {
      ...result[0],
      categories: rolledUpCategories.map((el) => {
        const category = categoryById.get(el.categoryId);

        return {
          ...el,
          parentCategoryId: category?.parentCategoryId ?? null,
          description: resolveCategoryDescription(
            {
              source: category?.source ?? CategorySource.SEED,
              description: category?.description ?? el.description,
              customLabel: category?.customLabel ?? null,
            },
            this.i18n,
            lang,
          ),
        };
      }),
    } as MonthlyBalanceResponse;
  }

  async update(userId: string, transactionId: string, updateTransactionDto: UpdateTransactionDto) {
    const { date, description, type, amount, categoryId, isPaid, periodId, planningId } = updateTransactionDto;

    try {
      await this.validateEntitiesOwnership({
        userId,
        transactionId,
        periodId,
      });
      await this.validateCategoryService.validateForTransaction(userId, categoryId, type);
      const newPeriodId = await this.periodsService.getPeriodId(userId, planningId, date);
      await this.transactionsRepo.update({
        where: { id: transactionId },
        data: {
          periodId: newPeriodId,
          categoryId,
          date,
          description,
          type,
          amount: type === TransactionType.EXPENSE ? amount * -1 : amount,
          isPaid,
        },
      });

      // precisa recalcular o period balances do periodId e do newPeriodId tambem
      // tech debt: melhorar a logica para nao precisar chamar a mesma funcao duas vezes
      await this.periodsService.recalculateBalances(userId, [periodId]);
      if (periodId !== newPeriodId) {
        await this.periodsService.recalculateBalances(userId, [newPeriodId]);
      }

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

  async pay(userId: string, periodId: string, transactionId: string) {
    try {
      await this.validateEntitiesOwnership({
        userId,
        transactionId,
        periodId,
      });
      await this.transactionsRepo.update({
        where: { id: transactionId },
        data: {
          isPaid: true,
        },
      });

      await this.periodsService.recalculateBalances(userId, [periodId]);

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

  async remove(userId: string, periodId: string, transactionId: string) {
    await this.validateEntitiesOwnership({ userId, transactionId, periodId });

    await this.transactionsRepo.delete({
      where: { id: transactionId },
    });

    await this.periodsService.recalculateBalances(userId, [periodId]);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'removed',
      error: null,
    };
  }

  private async validateEntitiesOwnership({
    userId,
    transactionId,
    periodId,
  }: {
    userId: string;
    transactionId?: string;
    periodId?: string;
  }) {
    await Promise.all([
      transactionId && periodId && this.validateTransactionOwnershipService.validate(userId, transactionId, periodId),
    ]);
  }
}
