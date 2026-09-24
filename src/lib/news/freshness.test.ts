import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newsFreshSince, parseRssPublishedAt, shouldImportRssStory } from './freshness';

test('fresh news window is 48 hours', () => {
  const now = new Date('2026-09-21T12:00:00.000Z');
  assert.equal(newsFreshSince(now).toISOString(), '2026-09-19T12:00:00.000Z');
});

test('RSS dates in the future are rejected', () => {
  assert.equal(parseRssPublishedAt({ isoDate: '2026-09-22T20:00:00.000Z' }), null);
});

test('RSS dates older than 14 days are not imported', () => {
  const now = new Date('2026-09-21T12:00:00.000Z');
  assert.equal(shouldImportRssStory(new Date('2026-08-01T12:00:00.000Z'), now), false);
  assert.equal(shouldImportRssStory(new Date('2026-09-20T12:00:00.000Z'), now), true);
});
