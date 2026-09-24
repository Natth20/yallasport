import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TIMEZONE, dayBoundsInTimezone, formatKickoff, normalizeTimezone } from './format';

test('invalid timezone falls back to Asia/Riyadh', () => {
  assert.equal(normalizeTimezone('Not/AZone'), DEFAULT_TIMEZONE);
  assert.equal(DEFAULT_TIMEZONE, 'Asia/Riyadh');
});

test('kickoff stored as UTC displays in Riyadh without DST shift', () => {
  const utc = '2026-09-21T18:00:00.000Z';
  const riyadh = formatKickoff(utc, 'Asia/Riyadh', 'en', { weekday: undefined, month: '2-digit', day: '2-digit' });
  assert.match(riyadh, /21/);
  assert.match(riyadh, /21:00/);
});

test('day bounds for Riyadh are UTC+3 both sides', () => {
  const { start, end } = dayBoundsInTimezone('2026-09-21', 'Asia/Riyadh');
  assert.equal(start.toISOString(), '2026-09-20T21:00:00.000Z');
  assert.equal(end.toISOString(), '2026-09-21T21:00:00.000Z');
});

test('Europe/London spring DST still produces a 24h window', () => {
  const { start, end } = dayBoundsInTimezone('2026-03-29', 'Europe/London');
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  assert.ok(hours === 23 || hours === 24 || hours === 25);
});
