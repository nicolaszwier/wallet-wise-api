import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsController } from './transactions.controller';
import { ValidateTransactionOwnershipService } from './services/validate-transaction-ownership.service';
import { PeriodsModule } from '../periods/periods.module';
import { RecurringConfigsModule } from '../recurring-configs/recurring-configs.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [PeriodsModule, RecurringConfigsModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, ValidateTransactionOwnershipService],
})
export class TransactionsModule {}
