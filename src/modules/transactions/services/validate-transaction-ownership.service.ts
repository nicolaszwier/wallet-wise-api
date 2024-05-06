import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repository';

@Injectable()
export class ValidateTransactionOwnershipService {
  constructor(private readonly transactionsRepo: TransactionsRepository) {}

  async validate(userId: string, transactionId: string, periodId: string) {
    const isOwner = await this.transactionsRepo.findFirst({
      where: { id: transactionId, userId, periodId },
    });

    if (!isOwner) {
      throw new NotFoundException('Transaction not found.');
    }
  }
}
