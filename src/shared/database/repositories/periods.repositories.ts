import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class PeriodsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(findManyDto: Prisma.PeriodFindManyArgs) {
    return this.prismaService.period.findMany(findManyDto);
  }

  findFirst(findFirstDto: Prisma.PeriodFindFirstArgs) {
    return this.prismaService.period.findFirst(findFirstDto);
  }

  create(createDto: Prisma.PeriodCreateArgs) {
    return this.prismaService.period.create(createDto);
  }

  createMany(createDto: Prisma.PeriodCreateManyArgs) {
    return this.prismaService.period.createMany(createDto);
  }

  update(updateDto: Prisma.PeriodUpdateArgs) {
    return this.prismaService.period.update(updateDto);
  }

  updateMany(updateDto: Prisma.PeriodUpdateManyArgs) {
    return this.prismaService.period.updateMany(updateDto);
  }

  delete(deleteDto: Prisma.PeriodDeleteArgs) {
    return this.prismaService.period.delete(deleteDto);
  }
}
