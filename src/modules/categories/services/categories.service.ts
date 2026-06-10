import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CategorySource, TransactionType } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CATEGORY_ICON_OPTIONS, isAllowedCategoryIcon } from 'src/shared/data/category-icons';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { mapCategoryForResponse } from 'src/shared/utils/category-display.util';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ValidateCategoryService } from './validate-category.service';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    private readonly categoriesRepo: CategoriesRepository,
    private readonly validateCategoryService: ValidateCategoryService,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    await this.categoriesRepo.migrateLegacyData();
  }

  getIconOptions(type?: TransactionType) {
    const options = type
      ? CATEGORY_ICON_OPTIONS.filter((option) => option.types.includes(type))
      : CATEGORY_ICON_OPTIONS;

    return {
      statusCode: HttpStatus.OK,
      message: null,
      error: null,
      data: options,
    };
  }

  async findAllByUserId(userId: string) {
    const categories = await this.categoriesRepo.findMany({
      where: { userId },
      orderBy: [{ parentCategoryId: 'asc' }, { description: 'asc' }],
    });

    const lang = I18nContext.current()?.lang ?? 'en';

    return {
      statusCode: HttpStatus.OK,
      message: null,
      error: null,
      data: categories.map((category) => mapCategoryForResponse(category, this.i18n, lang)),
    };
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { description, icon, type, parentCategoryId, color } = createCategoryDto;

    if (!isAllowedCategoryIcon(icon, type)) {
      throw new BadRequestException('Icon is not allowed for this category type.');
    }

    let resolvedType = type;
    let parentCategory = null;

    if (parentCategoryId) {
      parentCategory = await this.categoriesRepo.findFirst({
        where: { id: parentCategoryId, userId, active: true },
      });

      if (!parentCategory) {
        throw new BadRequestException('Parent category not found.');
      }

      if (parentCategory.parentCategoryId) {
        throw new BadRequestException('Subcategories can only be created under root categories.');
      }

      if (parentCategory.type !== type) {
        throw new BadRequestException('Subcategory type must match parent category type.');
      }

      resolvedType = parentCategory.type;
    }

    const category = await this.categoriesRepo.create({
      data: {
        userId,
        description,
        icon,
        type: resolvedType,
        color: color ?? '.gray',
        active: true,
        source: CategorySource.CUSTOM,
        parentCategoryId: parentCategoryId ?? null,
      },
    });

    const lang = I18nContext.current()?.lang ?? 'en';

    return {
      statusCode: HttpStatus.CREATED,
      message: 'created',
      error: null,
      data: mapCategoryForResponse(category, this.i18n, lang),
    };
  }

  async update(userId: string, categoryId: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOwnedCategory(userId, categoryId);
    const { description, customLabel, icon } = updateCategoryDto;

    if (icon && !isAllowedCategoryIcon(icon, category.type)) {
      throw new BadRequestException('Icon is not allowed for this category type.');
    }

    const data: {
      icon?: string;
      description?: string;
      customLabel?: string | null;
    } = {};

    if (icon) {
      data.icon = icon;
    }

    if (category.source === CategorySource.SEED) {
      if (description) {
        throw new BadRequestException('Default category keys cannot be renamed directly.');
      }

      if (customLabel !== undefined) {
        data.customLabel = customLabel.trim() ? customLabel.trim() : null;
      }
    } else if (description) {
      data.description = description.trim();
    }

    const updated = await this.categoriesRepo.update({
      where: { id: categoryId },
      data,
    });

    const lang = I18nContext.current()?.lang ?? 'en';

    return {
      statusCode: HttpStatus.OK,
      message: 'updated',
      error: null,
      data: mapCategoryForResponse(updated, this.i18n, lang),
    };
  }

  async archive(userId: string, categoryId: string) {
    const category = await this.findOwnedCategory(userId, categoryId);

    await this.validateCategoryService.ensureNotInUse(categoryId);
    await this.validateCategoryService.ensureNoActiveChildren(categoryId);

    const updated = await this.categoriesRepo.update({
      where: { id: categoryId },
      data: { active: false },
    });

    const lang = I18nContext.current()?.lang ?? 'en';

    return {
      statusCode: HttpStatus.OK,
      message: 'archived',
      error: null,
      data: mapCategoryForResponse(updated, this.i18n, lang),
    };
  }

  async remove(userId: string, categoryId: string) {
    const category = await this.findOwnedCategory(userId, categoryId);

    this.validateCategoryService.ensureCustomOnly(category);
    await this.validateCategoryService.ensureNotInUse(categoryId);
    await this.validateCategoryService.ensureNoActiveChildren(categoryId);

    await this.categoriesRepo.delete({ where: { id: categoryId } });

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'removed',
      error: null,
    };
  }

  private async findOwnedCategory(userId: string, categoryId: string) {
    const category = await this.categoriesRepo.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }
}
