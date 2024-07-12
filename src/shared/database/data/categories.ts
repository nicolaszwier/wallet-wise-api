import { TransactionType } from 'src/modules/transactions/model/Transaction';

export const defaultCategories = [
  {
    active: true,
    description: 'Income',
    icon: 'dollarsign.circle.fill',
    color: '.green',
    type: TransactionType.INCOME,
  },
  {
    active: true,
    description: 'Others',
    icon: 'ellipsis.circle.fill',
    color: '.gray',
    type: TransactionType.INCOME,
  },
  {
    active: true,
    description: 'Others',
    icon: 'ellipsis.circle.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Credit card',
    icon: 'creditcard.circle.fill',
    color: '.orange',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Dining',
    icon: 'fork.knife.circle.fill',
    color: '.red',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Entertainment',
    icon: 'play.tv.fill',
    color: '.red',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Taxes',
    icon: 'newspaper.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Gifts',
    icon: 'gift.fill',
    color: '.purple',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Groceries',
    icon: 'basket.fill',
    color: '.blue',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Health',
    icon: 'heart.fill',
    color: '.red',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Insurance',
    icon: 'checkmark.shield.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Rent',
    icon: 'house.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Savings',
    icon: 'square.and.arrow.down.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Shopping',
    icon: 'cart.fill',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Subscriptions',
    icon: 'dollarsign.arrow.circlepath',
    color: '.gray',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Transportation',
    icon: 'car.fill',
    color: '.orange',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Travel',
    icon: 'airplane.circle.fill',
    color: '.purple',
    type: TransactionType.EXPENSE,
  },
  {
    active: true,
    description: 'Utilities',
    icon: 'wrench.and.screwdriver.fill',
    color: '.purple',
    type: TransactionType.EXPENSE,
  },
];
