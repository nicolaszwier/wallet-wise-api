import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from './repositories/users.repositories';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PlanningsRepository } from './repositories/plannings.repositories';
import { PeriodsRepository } from './repositories/periods.repositories';

@Global()
@Module({
  providers: [PrismaService, UsersRepository, TransactionsRepository, PlanningsRepository, PeriodsRepository],
  exports: [UsersRepository, TransactionsRepository, PlanningsRepository, PeriodsRepository],
})
export class DatabaseModule {}
