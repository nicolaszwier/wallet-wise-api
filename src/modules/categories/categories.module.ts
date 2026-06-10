import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './services/categories.service';
import { ValidateCategoryService } from './services/validate-category.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, ValidateCategoryService],
  exports: [CategoriesService, ValidateCategoryService],
})
export class CategoriesModule {}
