import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findFirst(findFirstDto: Prisma.CategoryFindFirstArgs) {
    return this.prismaService.category.findFirst(findFirstDto);
  }

  findMany(findManyDto: Prisma.CategoryFindManyArgs) {
    return this.prismaService.category.findMany(findManyDto);
  }

  create(createDto: Prisma.CategoryCreateArgs) {
    return this.prismaService.category.create(createDto);
  }

  update(updateDto: Prisma.CategoryUpdateArgs) {
    return this.prismaService.category.update(updateDto);
  }

  delete(deleteDto: Prisma.CategoryDeleteArgs) {
    return this.prismaService.category.delete(deleteDto);
  }

  deleteMany(deleteDto: Prisma.CategoryDeleteManyArgs) {
    return this.prismaService.category.deleteMany(deleteDto);
  }

  count(where: Prisma.CategoryWhereInput) {
    return this.prismaService.category.count({ where });
  }

  countTransactionUsage(categoryId: string) {
    return this.prismaService.transaction.count({ where: { categoryId } });
  }

  countRecurringUsage(categoryId: string) {
    return this.prismaService.recurringConfig.count({ where: { categoryId } });
  }

  countActiveChildren(categoryId: string) {
    return this.prismaService.category.count({
      where: { parentCategoryId: categoryId, active: true },
    });
  }

  migrateLegacyData() {
    return Promise.all([
      this.prismaService.$runCommandRaw({
        update: 'categories',
        updates: [
          {
            q: { $or: [{ type: null }, { type: { $exists: false } }] },
            u: { $set: { type: 'EXPENSE' } },
            multi: true,
          },
        ],
      }),
      this.prismaService.$runCommandRaw({
        update: 'categories',
        updates: [
          {
            q: { source: { $nin: ['SEED', 'CUSTOM'] } },
            u: { $set: { source: 'SEED' } },
            multi: true,
          },
        ],
      }),
    ]);
  }
}
