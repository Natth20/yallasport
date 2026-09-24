import { test } from 'node:test';
import assert from 'node:assert/strict';
import { belongsOnTodayBoard, cronFixtureDateKeys, todayOrLiveWhere } from './match-window';

const start = new Date('2026-09-21T21:00:00.000Z');
const end = new Date('2026-09-22T21:00:00.000Z');
const now = new Date('2026-09-21T22:00:00.000Z');

test('today board keeps a kickoff inside the zoned day', () => {
  assert.equal(
    belongsOnTodayBoard({ status: 'NOT_STARTED', kickoffAt: new Date('2026-09-22T18:00:00.000Z') }, start, end, now),
    true,
  );
});

test('today board drops a finished match older than 24h', () => {
  assert.equal(
    belongsOnTodayBoard({ status: 'FINISHED', kickoffAt: new Date('2026-09-20T18:00:00.000Z') }, start, end, now),
    false,
  );
});

test('live match older than 12h is not treated as today-live', () => {
  assert.equal(
    belongsOnTodayBoard({ status: 'LIVE', kickoffAt: new Date('2026-09-20T08:00:00.000Z') }, start, end, now),
    false,
  );
});

test('cron fixture keys cover yesterday today tomorrow in UTC', () => {
  const keys = cronFixtureDateKeys(new Date('2026-09-21T12:00:00.000Z'));
  assert.deepEqual(keys, ['2026-09-20', '2026-09-21', '2026-09-22']);
});

test('todayOrLiveWhere includes live floor and day window', () => {
  const where = todayOrLiveWhere(start, end, now);
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR.length, 2);
});
