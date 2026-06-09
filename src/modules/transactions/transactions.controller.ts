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

  @Put('pay/:periodId([a-f0-9]{24})/:transactionId([a-f0-9]{24})')
  pay(
    @ActiveUserId() userId: string,
    @Param('periodId') periodId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.pay(userId, periodId, transactionId);
  }

  @Get('due-this-week')
  findAllPendingDueInAWeekByQuery(@ActiveUserId() userId: string, @Query('planningId') planningId: string) {
    return this.transactionsService.findAllPendingDueInAWeek(userId, planningId);
  }

  @Get('due-this-week/:planningId([a-f0-9]{24})')
  findAllPendingDueInAWeek(@ActiveUserId() userId: string, @Param('planningId') planningId: string) {
    return this.transactionsService.findAllPendingDueInAWeek(userId, planningId);
  }

  @Get('monthly_balance')
  findMonthlyBalanceByQuery(
    @ActiveUserId() userId: string,
    @Query('planningId') planningId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.transactionsService.findMonthlyBalance(userId, planningId, month, year);
  }

  @Get('monthly_balance/:planningId([a-f0-9]{24})')
  findMonthlyBalance(
    @ActiveUserId() userId: string,
    @Param('planningId') planningId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.transactionsService.findMonthlyBalance(userId, planningId, month, year);
  }

  @Get(':periodId([a-f0-9]{24})')
  findAll(@ActiveUserId() userId: string, @Param('periodId') periodId: string) {
    return this.transactionsService.findAllByUserId(userId, { periodId });
  }

  @Put(':transactionId([a-f0-9]{24})')
  update(
    @ActiveUserId() userId: string,
    @Param('transactionId') transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, transactionId, updateTransactionDto);
  }

  @Delete(':periodId([a-f0-9]{24})/:transactionId([a-f0-9]{24})')
  // @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @ActiveUserId() userId: string,
    @Param('periodId') periodId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.remove(userId, periodId, transactionId);
  }
}
