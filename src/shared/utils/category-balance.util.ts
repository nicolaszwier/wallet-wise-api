import { TransactionType } from 'src/modules/transactions/model/TransactionType';

export interface BalanceCategoryRow {
  categoryId: string;
  parentCategoryId?: string | null;
  type: TransactionType | string;
  description: string;
  icon: string;
  balance: number;
  balancePaidOnly: number;
}

interface CategoryMeta {
  parentCategoryId: string | null;
  description: string;
  icon: string;
  type: TransactionType | string;
}

export function rollUpChildCategoryBalances(
  categories: BalanceCategoryRow[],
  categoryMeta: Map<string, CategoryMeta>,
): BalanceCategoryRow[] {
  const byId = new Map<string, BalanceCategoryRow>();

  for (const row of categories) {
    byId.set(row.categoryId, { ...row });
  }

  for (const row of categories) {
    const meta = categoryMeta.get(row.categoryId);
    const parentId = meta?.parentCategoryId;

    if (!parentId) {
      continue;
    }

    if (!byId.has(parentId)) {
      const parentMeta = categoryMeta.get(parentId);

      if (!parentMeta) {
        continue;
      }

      byId.set(parentId, {
        categoryId: parentId,
        parentCategoryId: null,
        type: parentMeta.type,
        description: parentMeta.description,
        icon: parentMeta.icon,
        balance: 0,
        balancePaidOnly: 0,
      });
    }

    const parent = byId.get(parentId)!;
    parent.balance += row.balance;
    parent.balancePaidOnly += row.balancePaidOnly;
  }

  return Array.from(byId.values())
    .filter((row) => !categoryMeta.get(row.categoryId)?.parentCategoryId)
    .map((row) => ({
      ...row,
      parentCategoryId: categoryMeta.get(row.categoryId)?.parentCategoryId ?? null,
    }));
}
