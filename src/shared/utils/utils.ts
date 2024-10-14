import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(utc);

export function getStartOfWeek(date: Date) {
  return dayjs(date).utc().startOf('isoWeek').toDate();
}

export function getEndOfWeek(date: Date) {
  return dayjs(date).utc().endOf('isoWeek').toDate();
}

export function getStartOfMonth(date: Date) {
  return dayjs(date).utc().startOf('month').toDate();
}

export function getEndOfMonth(date: Date) {
  return dayjs(date).utc().endOf('month').toDate();
}
