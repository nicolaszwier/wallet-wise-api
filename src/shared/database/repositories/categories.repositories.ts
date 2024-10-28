import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  deleteMany(deleteDto: Prisma.CategoryDeleteManyArgs) {
    return this.prismaService.category.deleteMany(deleteDto);
  }
}
