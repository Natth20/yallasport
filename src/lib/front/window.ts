import { DEFAULT_TIMEZONE, dateKeyInTimezone, dayBoundsInTimezone } from '@/lib/datetime/format';

export function frontDayWindow(now = new Date()) {
  const timezone = DEFAULT_TIMEZONE;
  const todayKey = dateKeyInTimezone(now, timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);
  return { timezone, todayKey, start, end, now };
}
