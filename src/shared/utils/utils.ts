import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as utc from 'dayjs/plugin/utc';
import { RecurrenceFrequency, RecurrenceFrequencyValue } from 'src/modules/recurring-configs/model/RecurrenceFrequency';
import { RecurringConfigSchedule } from 'src/modules/recurring-configs/model/recurring-config.types';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);

export const FORECAST_MONTHS = 3;

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

export function getStartOfDayUtc(date: Date | string) {
  return dayjs(date).utc().startOf('day');
}

/** Parse a calendar date (YYYY-MM-DD) without timezone shifting the day. */
export function parseCalendarDate(date: Date | string) {
  if (typeof date === 'string') {
    const dateOnly = date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return dayjs.utc(dateOnly, 'YYYY-MM-DD').startOf('day');
    }
  }

  return getStartOfDayUtc(date);
}

export function toCalendarDateStorage(date: Date | string) {
  return parseCalendarDate(date).toDate();
}

export function getForecastHorizonFromToday() {
  return dayjs().utc().startOf('day').add(FORECAST_MONTHS, 'month');
}

export function getForecastHorizonFromDate(date: Date | string) {
  return getStartOfDayUtc(date).add(FORECAST_MONTHS, 'month');
}

function buildMonthlyDate(base: dayjs.Dayjs, recurringDay: number) {
  const day = Math.min(recurringDay, base.daysInMonth());
  return base.date(day).startOf('day');
}

export function advanceRecurrenceDate(current: dayjs.Dayjs, frequency: RecurrenceFrequencyValue, recurringDay: number) {
  switch (frequency) {
    case RecurrenceFrequency.WEEKLY:
      return current.add(1, 'week').startOf('day');
    case RecurrenceFrequency.MONTHLY:
      return buildMonthlyDate(current.add(1, 'month').startOf('month'), recurringDay);
    case RecurrenceFrequency.YEARLY:
      return buildMonthlyDate(current.add(1, 'year').startOf('month'), recurringDay);
  }
}

export function getRecurrenceOccurrenceDates(
  config: RecurringConfigSchedule,
  fromBound: dayjs.Dayjs,
  toBound: dayjs.Dayjs,
) {
  const dates: Date[] = [];
  let current = parseCalendarDate(config.startDate);

  while (current.isBefore(fromBound, 'day')) {
    current = advanceRecurrenceDate(current, config.frequency, config.recurringDay);
  }

  const endDate = config.endDate ? parseCalendarDate(config.endDate) : null;

  while (current.isSameOrBefore(toBound, 'day')) {
    if (endDate && current.isAfter(endDate, 'day')) {
      break;
    }
    dates.push(current.toDate());
    current = advanceRecurrenceDate(current, config.frequency, config.recurringDay);
  }

  return dates;
}
