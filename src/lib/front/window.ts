import { DEFAULT_TIMEZONE, dateKeyInTimezone, dayBoundsInTimezone } from '@/lib/datetime/format';

export function frontDayWindow(now = new Date()) {
  const timezone = DEFAULT_TIMEZONE;
  const todayKey = dateKeyInTimezone(now, timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);
  return { timezone, todayKey, start, end, now };
}

/** Live + yesterday through the day after tomorrow — real fixtures only, no invented board. */
export function frontBoardWindow(now = new Date()) {
  const timezone = DEFAULT_TIMEZONE;
  const todayKey = dateKeyInTimezone(now, timezone);
  const yesterdayKey = dateKeyInTimezone(new Date(now.getTime() - 86_400_000), timezone);
  const horizonKey = dateKeyInTimezone(new Date(now.getTime() + 2 * 86_400_000), timezone);
  const { start } = dayBoundsInTimezone(yesterdayKey, timezone);
  const { end } = dayBoundsInTimezone(horizonKey, timezone);
  return { timezone, todayKey, start, end, now };
}
