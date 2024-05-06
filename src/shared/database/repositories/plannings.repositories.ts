import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class PlanningsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(findManyDto: Prisma.PlanningFindManyArgs) {
    return this.prismaService.planning.findMany(findManyDto);
  }

  findFirst(findFirstDto: Prisma.PlanningFindFirstArgs) {
    return this.prismaService.planning.findFirst(findFirstDto);
  }

  create(createDto: Prisma.PlanningCreateArgs) {
    return this.prismaService.planning.create(createDto);
  }

  update(updateDto: Prisma.PlanningUpdateArgs) {
    return this.prismaService.planning.update(updateDto);
  }

  delete(deleteDto: Prisma.PlanningDeleteArgs) {
    return this.prismaService.planning.delete(deleteDto);
  }
}
