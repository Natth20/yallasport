import { reportCaughtError } from '@/lib/ops/caught';
/** Stored instants are UTC (Prisma DateTime). Display uses this IANA zone. Riyadh has no DST. */
export const DEFAULT_TIMEZONE = 'Asia/Riyadh';

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    return true;
  } catch (error) {
    reportCaughtError("src/lib/datetime/format.ts:7", error, { persist: false });
    return false;
  }
}

export function normalizeTimezone(timezone?: string | null) {
  return timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
}

export function formatKickoff(
  value: string | Date,
  timezone: string,
  locale: 'ar' | 'en' = 'ar',
  options: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    timeZone: normalizeTimezone(timezone),
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...options,
  }).format(new Date(value));
}

export function timezoneLabel(timezone: string, locale: 'ar' | 'en' = 'ar') {
  const part = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en', {
    timeZone: normalizeTimezone(timezone),
    timeZoneName: 'short',
  }).formatToParts(new Date()).find((item) => item.type === 'timeZoneName');
  return part?.value ?? timezone;
}

export function dateKeyInTimezone(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return asUtc - date.getTime();
}

function addCalendarDay(dateKey: string) {
  const next = new Date(`${dateKey}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export function zonedLocalToUtc(dateKey: string, time: string, timezone: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second || 0);
  let instant = localAsUtc;
  for (let index = 0; index < 3; index += 1) {
    instant = localAsUtc - timezoneOffsetMs(new Date(instant), timezone);
  }
  return new Date(instant);
}

export function dayBoundsInTimezone(dateKey: string, timezone: string) {
  const start = zonedLocalToUtc(dateKey, '00:00:00', timezone);
  const end = zonedLocalToUtc(addCalendarDay(dateKey), '00:00:00', timezone);
  return { start, end };
}

export function hourInTimezone(value: Date, timezone: string) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: normalizeTimezone(timezone),
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(value)
  );
}

export function currentHourInTimezone(timezone: string) {
  return hourInTimezone(new Date(), timezone);
}
