import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEntitled, isGeoAllowed, isWithinWindow, normalizeCountry } from './entitlement';

test('geo allow-list is open when empty and strict when set', () => {
  assert.equal(isGeoAllowed('EG', []), true);
  assert.equal(isGeoAllowed('EG', ['SA', 'EG']), true);
  assert.equal(isGeoAllowed('US', ['SA', 'EG']), false);
  assert.equal(isGeoAllowed(null, ['EG']), false);
});

test('entitlement ranks free below premium and vip', () => {
  assert.equal(isEntitled('FREE', 'FREE'), true);
  assert.equal(isEntitled('FREE', 'PREMIUM'), false);
  assert.equal(isEntitled('PREMIUM', 'PREMIUM'), true);
  assert.equal(isEntitled('VIP', 'PREMIUM'), true);
});

test('playback window uses kickoff padding when dates are missing', () => {
  const kickoff = new Date('2026-09-08T18:00:00Z');
  assert.equal(isWithinWindow(new Date('2026-09-08T17:50:00Z'), null, null, kickoff), true);
  assert.equal(isWithinWindow(new Date('2026-09-08T17:40:00Z'), null, null, kickoff), false);
  assert.equal(isWithinWindow(new Date('2026-09-08T21:10:00Z'), null, null, kickoff), false);
});

test('country codes are normalized', () => {
  assert.equal(normalizeCountry('eg'), 'EG');
  assert.equal(normalizeCountry('Egypt'), null);
});
