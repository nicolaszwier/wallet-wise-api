import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { TransactionType } from 'src/modules/transactions/model/TransactionType';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './services/categories.service';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@ActiveUserId() userId: string) {
    return this.categoriesService.findAllByUserId(userId);
  }

  @Get('icon-options')
  getIconOptions(@Query('type') type?: TransactionType) {
    return this.categoriesService.getIconOptions(type);
  }

  @Post()
  create(@ActiveUserId() userId: string, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Put(':categoryId')
  update(
    @ActiveUserId() userId: string,
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, categoryId, updateCategoryDto);
  }

  @Patch(':categoryId/archive')
  archive(@ActiveUserId() userId: string, @Param('categoryId') categoryId: string) {
    return this.categoriesService.archive(userId, categoryId);
  }

  @Delete(':categoryId')
  remove(@ActiveUserId() userId: string, @Param('categoryId') categoryId: string) {
    return this.categoriesService.remove(userId, categoryId);
  }
}
