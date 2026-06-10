import { TransactionType } from "./TransactionType"

export interface MonthlyBalance {
  year: string,
  month: string,
  expenses: number,
  expensesPaidOnly: number,
  incomes: number,
  incomesPaidOnly: number,
  categories: BalanceCategory[]
}

interface BalanceCategory {
  categoryId: string,
  parentCategoryId?: string | null,
  type: TransactionType,
  description: string,
  icon: string,
  balance: number,
  balancePaidOnly: number
}