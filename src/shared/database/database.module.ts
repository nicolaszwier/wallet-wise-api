import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from './repositories/users.repositories';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PlanningsRepository } from './repositories/plannings.repositories';
import { PeriodsRepository } from './repositories/periods.repositories';
import { CategoriesRepository } from './repositories/categories.repositories';

@Global()
@Module({
  providers: [
    PrismaService,
    UsersRepository,
    CategoriesRepository,
    TransactionsRepository,
    PlanningsRepository,
    PeriodsRepository,
  ],
  exports: [UsersRepository, CategoriesRepository, TransactionsRepository, PlanningsRepository, PeriodsRepository],
})
export class DatabaseModule {}
