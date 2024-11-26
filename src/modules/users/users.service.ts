import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { PeriodsRepository } from 'src/shared/database/repositories/periods.repositories';
import { PlanningsRepository } from 'src/shared/database/repositories/plannings.repositories';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';
import { UsersRepository } from 'src/shared/database/repositories/users.repositories';
import { CreateSupportRequestDto } from './dto/create-user-support.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { Category, SupportStatus } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';

dayjs.extend(utc);

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly categoriesRepo: CategoriesRepository,
    private readonly transactionsRepo: TransactionsRepository,
    private readonly periodsRepo: PeriodsRepository,
    private readonly planningsRepo: PlanningsRepository,
    private readonly i18n: I18nService,
  ) {}

  async getUserById(userId: string) {
    const result = await  this.usersRepo.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        picture: true,
        categories: { orderBy: { description: 'asc' } },
      },
    }) as unknown as {
      name: string,
      email: string,
      categories: Category[]
    };

    return {
      ...result,
      categories: result?.categories?.map(el => {
        return {
          ...el,
          description: this.i18n.t(`categories.${el.description}`, { lang: I18nContext.current().lang })
        }
      }) 
    }
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
      throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
    }
  }

  async createSupport(createUserSupportDto: CreateSupportRequestDto) {
    const { email, name, message, subject, origin } = createUserSupportDto;

    try {
      await this.usersRepo.createSupport({
        data: {
          email,
          name,
          message,
          subject,
          origin,
          status: SupportStatus.PENDING,
          date: dayjs().utc(true).format(),
        },
      });

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
}
