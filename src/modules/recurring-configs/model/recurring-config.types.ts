import { TransactionType } from 'src/modules/transactions/model/TransactionType';
import { RecurrenceFrequencyValue } from './RecurrenceFrequency';

export type TransactionTypeValue = `${TransactionType}`;

export type RecurringConfigSchedule = {
  startDate: Date;
  endDate: Date | null;
  frequency: RecurrenceFrequencyValue;
  recurringDay: number;
};

export type RecurringConfigRecord = RecurringConfigSchedule & {
  id: string;
  userId: string;
  planningId: string;
  categoryId: string;
  amount: number;
  description: string;
  type: TransactionTypeValue;
  lastGeneratedDate: Date | null;
  active: boolean;
  dateCreated: Date;
};
