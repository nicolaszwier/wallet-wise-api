import { HttpStatus, Injectable } from '@nestjs/common';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import { UsersRepository } from 'src/shared/database/repositories/users.repositories';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly categoriesRepo: CategoriesRepository,
    private readonly transactionsRepo: TransactionsRepository,
    private readonly periodsRepo: PeriodsRepository,
    private readonly planningsRepo: PlanningsRepository,
  ) {}

  getUserById(userId: string) {
    return this.usersRepo.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        categories: { orderBy: { description: 'asc' } },
      },
    });
  }

  async deleteAccount(userId: string) {
    try {
      await this.usersRepo.transaction([
        this.categoriesRepo.deleteMany({ where: { userId: userId } }),
        this.transactionsRepo.deleteMany({ where: { userId: userId } }),
        this.periodsRepo.deleteMany({ where: { userId: userId } }),
        this.planningsRepo.deleteMany({ where: { userId: userId } }),
        this.usersRepo.delete({ where: { id: userId } }),
      ]);

      return {
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Account successfully deleted',
        error: null,
      };
    } catch (error) {
      console.log('Error on deleting account ------------', error);
      throw {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error on deleting account',
        error: null,
      };
    }
  }
}
