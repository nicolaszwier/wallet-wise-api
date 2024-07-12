import { SortOrder } from './SortOrder';

export interface PeriodsRequestFilters {
  startDate: string;
  endDate: string;
  includeIncomes: boolean;
  includeExpenses: boolean;
  sortOrder: SortOrder;
  includeTransactions: boolean;
}
