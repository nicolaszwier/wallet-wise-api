import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/auth.guard';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PlanningsModule } from './modules/plannings/plannings.module';
import { PeriodsModule } from './modules/periods/periods.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    AuthModule,
    PlanningsModule,
    PeriodsModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
