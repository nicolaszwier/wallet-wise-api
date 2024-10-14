import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';

@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@ActiveUserId() userId: string, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Post('many')
  createMany(@ActiveUserId() userId: string, @Body() createTransactionDto: CreateTransactionDto[]) {
    return this.transactionsService.createMany(userId, createTransactionDto);
  }

  @Put('pay/:periodId/:transactionId')
  pay(
    @ActiveUserId() userId: string,
    @Param('periodId') periodId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.pay(userId, periodId, transactionId);
  }

  @Get(':periodId')
  findAll(@ActiveUserId() userId: string, @Param('periodId') periodId: string) {
    return this.transactionsService.findAllByUserId(userId, { periodId });
  }

  @Get('due-this-week/:planningId')
  findAllPendingDueInAWeek(@ActiveUserId() userId: string, @Param('planningId') planningId: string) {
    return this.transactionsService.findAllPendingDueInAWeek(userId, planningId);
  }

  @Get('monthly_balance/:planningId')
  findMonthlyBalance(
    @ActiveUserId() userId: string,
    @Param('planningId') planningId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.transactionsService.findMonthlyBalance(userId, planningId, month, year);
  }

  @Put(':transactionId')
  update(
    @ActiveUserId() userId: string,
    @Param('transactionId') transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, transactionId, updateTransactionDto);
  }

  @Delete(':periodId/:transactionId')
  // @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @ActiveUserId() userId: string,
    @Param('periodId') periodId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.remove(userId, periodId, transactionId);
  }
}
