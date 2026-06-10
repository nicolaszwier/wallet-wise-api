import { Category, CategorySource } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

export function resolveCategoryDescription(
  category: Pick<Category, 'source' | 'description' | 'customLabel'>,
  i18n: I18nService,
  lang: string,
): string {
  if (category.source === CategorySource.CUSTOM) {
    return category.description;
  }

  if (category.customLabel) {
    return category.customLabel;
  }

  const translationKey = `categories.${category.description}`;
  const translated = i18n.t(translationKey, {
    lang,
    defaultValue: category.description,
  });

  if (
    translated === translationKey ||
    (typeof translated === 'string' && translated.startsWith('categories.'))
  ) {
    return category.description;
  }

  return String(translated);
}

export function mapCategoryForResponse<T extends Category>(
  category: T,
  i18n: I18nService,
  lang: string,
) {
  return {
    ...category,
    description: resolveCategoryDescription(category, i18n, lang),
  };
}
