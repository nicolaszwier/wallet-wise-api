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
    const { planningId, description, amount, category, date, isPaid, type } = createTransactionDto;

    try {
      await this.validateEntitiesOwnership({
        userId,
      });
      const periodId = await this.periodsService.getPeriodId(userId, planningId, date);
      await this.transactionsRepo.create({
        data: {
          userId,
          planningId,
          periodId: periodId,
          description,
          amount: type === TransactionType.EXPENSE ? amount * -1 : amount,
          type,
          category,
          date: dayjs(date).utc().format(),
          isPaid,
          dateCreated: dayjs().utc(true).format(),
        },
      });

      await this.periodsService.recalculateBalances(userId, periodId);

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

  async update(userId: string, transactionId: string, updateTransactionDto: UpdateTransactionDto) {
    const { date, description, type, amount, category, isPaid, periodId, planningId } = updateTransactionDto;

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
          date,
          description,
          type,
          amount: type === TransactionType.EXPENSE ? amount * -1 : amount,
          category,
          isPaid,
        },
      });

      await this.periodsService.recalculateBalances(userId, periodId);

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

      await this.periodsService.recalculateBalances(userId, periodId);

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

    await this.periodsService.recalculateBalances(userId, periodId);

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
