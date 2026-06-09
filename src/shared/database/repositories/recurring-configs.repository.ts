import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class RecurringConfigsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(findManyDto: Prisma.RecurringConfigFindManyArgs) {
    return this.prismaService.recurringConfig.findMany(findManyDto);
  }

  findFirst(findFirstDto: Prisma.RecurringConfigFindFirstArgs) {
    return this.prismaService.recurringConfig.findFirst(findFirstDto);
  }

  create(createDto: Prisma.RecurringConfigCreateArgs) {
    return this.prismaService.recurringConfig.create(createDto);
  }

  update(updateDto: Prisma.RecurringConfigUpdateArgs) {
    return this.prismaService.recurringConfig.update(updateDto);
  }

  deleteMany(deleteDto: Prisma.RecurringConfigDeleteManyArgs) {
    return this.prismaService.recurringConfig.deleteMany(deleteDto);
  }
}
