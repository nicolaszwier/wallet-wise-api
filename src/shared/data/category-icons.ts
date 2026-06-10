import { TransactionType } from '@prisma/client';

export interface CategoryIconOption {
  key: string;
  types: TransactionType[];
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: 'dollarsign.circle.fill', types: [TransactionType.INCOME] },
  { key: 'ellipsis.circle.fill', types: [TransactionType.INCOME, TransactionType.EXPENSE] },
  { key: 'creditcard.circle.fill', types: [TransactionType.EXPENSE] },
  { key: 'fork.knife.circle.fill', types: [TransactionType.EXPENSE] },
  { key: 'book.fill', types: [TransactionType.EXPENSE] },
  { key: 'play.tv.fill', types: [TransactionType.EXPENSE] },
  { key: 'newspaper.fill', types: [TransactionType.EXPENSE] },
  { key: 'gift.fill', types: [TransactionType.INCOME, TransactionType.EXPENSE] },
  { key: 'basket.fill', types: [TransactionType.EXPENSE] },
  { key: 'heart.fill', types: [TransactionType.EXPENSE] },
  { key: 'checkmark.shield.fill', types: [TransactionType.EXPENSE] },
  { key: 'house.fill', types: [TransactionType.EXPENSE] },
  { key: 'square.and.arrow.down.fill', types: [TransactionType.EXPENSE] },
  { key: 'cart.fill', types: [TransactionType.EXPENSE] },
  { key: 'dollarsign.arrow.circlepath', types: [TransactionType.EXPENSE] },
  { key: 'car.fill', types: [TransactionType.EXPENSE] },
  { key: 'airplane.circle.fill', types: [TransactionType.EXPENSE] },
  { key: 'wrench.and.screwdriver.fill', types: [TransactionType.EXPENSE] },
  { key: 'bag.fill', types: [TransactionType.EXPENSE] },
  { key: 'cup.and.saucer.fill', types: [TransactionType.EXPENSE] },
  { key: 'pawprint.fill', types: [TransactionType.EXPENSE] },
  { key: 'figure.run', types: [TransactionType.EXPENSE] },
  { key: 'phone.fill', types: [TransactionType.EXPENSE] },
  { key: 'bolt.fill', types: [TransactionType.EXPENSE] },
  { key: 'graduationcap.fill', types: [TransactionType.EXPENSE] },
  { key: 'briefcase.fill', types: [TransactionType.INCOME, TransactionType.EXPENSE] },
  { key: 'banknote.fill', types: [TransactionType.INCOME] },
  { key: 'chart.line.uptrend.xyaxis', types: [TransactionType.INCOME] },
  // Additional expense icons
  { key: 'fuelpump.fill', types: [TransactionType.EXPENSE] },
  { key: 'bus.fill', types: [TransactionType.EXPENSE] },
  { key: 'gamecontroller.fill', types: [TransactionType.EXPENSE] },
  { key: 'music.note', types: [TransactionType.EXPENSE] },
  { key: 'film.fill', types: [TransactionType.EXPENSE] },
  { key: 'camera.fill', types: [TransactionType.EXPENSE] },
  { key: 'hammer.fill', types: [TransactionType.EXPENSE] },
  { key: 'leaf.fill', types: [TransactionType.EXPENSE] },
  { key: 'cross.case.fill', types: [TransactionType.EXPENSE] },
  { key: 'pill.fill', types: [TransactionType.EXPENSE] },
  { key: 'tshirt.fill', types: [TransactionType.EXPENSE] },
  { key: 'building.2.fill', types: [TransactionType.EXPENSE] },
  { key: 'wifi', types: [TransactionType.EXPENSE] },
  { key: 'drop.fill', types: [TransactionType.EXPENSE] },
  { key: 'flame.fill', types: [TransactionType.EXPENSE] },
  { key: 'dumbbell.fill', types: [TransactionType.EXPENSE] },
  { key: 'bicycle', types: [TransactionType.EXPENSE] },
  { key: 'ticket.fill', types: [TransactionType.EXPENSE] },
  { key: 'figure.child', types: [TransactionType.EXPENSE] },
  { key: 'person.2.fill', types: [TransactionType.EXPENSE] },
  { key: 'scissors', types: [TransactionType.EXPENSE] },
  { key: 'headphones', types: [TransactionType.EXPENSE] },
  { key: 'printer.fill', types: [TransactionType.EXPENSE] },
  { key: 'wineglass.fill', types: [TransactionType.EXPENSE] },
  { key: 'shippingbox.fill', types: [TransactionType.EXPENSE] },
  { key: 'takeoutbag.and.cup.and.straw.fill', types: [TransactionType.EXPENSE] },
  { key: 'beach.umbrella.fill', types: [TransactionType.EXPENSE] },
  { key: 'mappin.circle.fill', types: [TransactionType.EXPENSE] },
  { key: 'figure.walk', types: [TransactionType.EXPENSE] },
  { key: 'sparkles', types: [TransactionType.EXPENSE] },
  { key: 'doc.text.fill', types: [TransactionType.EXPENSE] },
  { key: 'tag.fill', types: [TransactionType.EXPENSE] },
  { key: 'key.fill', types: [TransactionType.EXPENSE] },
  // Additional income icons
  { key: 'building.columns.fill', types: [TransactionType.INCOME] },
  { key: 'chart.bar.fill', types: [TransactionType.INCOME] },
  { key: 'laptopcomputer', types: [TransactionType.INCOME] },
  { key: 'storefront.fill', types: [TransactionType.INCOME] },
  { key: 'tray.full.fill', types: [TransactionType.INCOME] },
  { key: 'arrow.uturn.backward.circle.fill', types: [TransactionType.INCOME] },
  { key: 'pencil.and.scribble', types: [TransactionType.INCOME] },
  { key: 'person.crop.circle.fill', types: [TransactionType.INCOME] },
  { key: 'wallet.pass.fill', types: [TransactionType.INCOME] },
  { key: 'centsign.circle.fill', types: [TransactionType.INCOME] },
  { key: 'chart.pie.fill', types: [TransactionType.INCOME] },
  { key: 'arrow.up.right.circle.fill', types: [TransactionType.INCOME] },
];

export const CATEGORY_ICON_KEYS = new Set(CATEGORY_ICON_OPTIONS.map((option) => option.key));

export function isAllowedCategoryIcon(icon: string, type?: TransactionType): boolean {
  if (!CATEGORY_ICON_KEYS.has(icon)) {
    return false;
  }

  if (!type) {
    return true;
  }

  return CATEGORY_ICON_OPTIONS.some((option) => option.key === icon && option.types.includes(type));
}
