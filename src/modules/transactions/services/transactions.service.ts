import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionType } from '../model/Transaction';
import { ValidateTransactionOwnershipService } from './validate-transaction-ownership.service';
import { PeriodsService } from 'src/modules/periods/services/periods.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepo: TransactionsRepository,
    private readonly validateTransactionOwnershipService: ValidateTransactionOwnershipService,
    private readonly periodsService: PeriodsService,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { planningId, categoryId, description, amount, date, isPaid, type } = createTransactionDto;

    try {
      await this.validateEntitiesOwnership({
        userId,
      });
      const periodId = await this.periodsService.getPeriodId(userId, planningId, date);
      await this.transactionsRepo.create({
        data: {
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
        },
      });

      await this.periodsService.recalculateBalances(userId, [periodId]);

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

  async createMany(userId: string, createTransactionDto: CreateTransactionDto[]) {
    const transactions = [];

    try {
      await this.validateEntitiesOwnership({
        userId,
      });

      for await (const transaction of createTransactionDto) {
        const { planningId, categoryId, description, amount, date, isPaid, type } = transaction;

        try {
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

  findAllPendingDueInAWeek(userId: string, planningId: string) {
    return this.transactionsRepo.findMany({
      where: {
        userId,
        planningId: planningId,
        isPaid: false,
        date: { lte: dayjs().utc().add(7, 'day').toDate() },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });
  }

  async update(userId: string, transactionId: string, updateTransactionDto: UpdateTransactionDto) {
    const { date, description, type, amount, categoryId, isPaid, periodId, planningId } = updateTransactionDto;

    try {
      await this.validateEntitiesOwnership({
        userId,
        transactionId,
        periodId,
      });
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
