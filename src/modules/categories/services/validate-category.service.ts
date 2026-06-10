import { BadRequestException, Injectable } from '@nestjs/common';
import { Category, CategorySource, TransactionType } from '@prisma/client';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';

@Injectable()
export class ValidateCategoryService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  async validateForTransaction(
    userId: string,
    categoryId: string,
    type: TransactionType,
  ): Promise<Category> {
    const category = await this.categoriesRepo.findFirst({
      where: { id: categoryId, userId, active: true },
    });

    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    if (category.type !== type) {
      throw new BadRequestException('Category type does not match transaction type.');
    }

    return category;
  }

  async ensureNotInUse(categoryId: string) {
    const [transactionCount, recurringCount] = await Promise.all([
      this.categoriesRepo.countTransactionUsage(categoryId),
      this.categoriesRepo.countRecurringUsage(categoryId),
    ]);

    if (transactionCount > 0 || recurringCount > 0) {
      throw new BadRequestException('Category is in use and cannot be archived or deleted.');
    }
  }

  async ensureNoActiveChildren(categoryId: string) {
    const activeChildren = await this.categoriesRepo.countActiveChildren(categoryId);

    if (activeChildren > 0) {
      throw new BadRequestException('Archive subcategories before archiving this category.');
    }
  }

  ensureCustomOnly(category: Category) {
    if (category.source === CategorySource.SEED) {
      throw new BadRequestException('Default categories cannot be deleted.');
    }
  }
}
