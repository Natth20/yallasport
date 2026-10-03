import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AD_PLACEMENTS,
  isAdPlacementId,
  isAdsenseSlotId,
  isSafeAdHtml,
  isSafeAdHref,
} from './catalog';

test('five public ad placements exist', () => {
  assert.equal(AD_PLACEMENTS.length, 5);
  assert.equal(isAdPlacementId('header-banner'), true);
  assert.equal(isAdPlacementId('home-mid'), true);
  assert.equal(isAdPlacementId('unknown'), false);
});

test('ad hrefs allow https and internal paths only', () => {
  assert.equal(isSafeAdHref('/contact'), true);
  assert.equal(isSafeAdHref('https://example.com/offer'), true);
  assert.equal(isSafeAdHref('javascript:alert(1)'), false);
  assert.equal(isSafeAdHref(''), false);
});

test('ad html rejects scripts', () => {
  assert.equal(isSafeAdHtml('<img src="https://cdn.example/a.jpg" alt="">'), true);
  assert.equal(isSafeAdHtml('<script>alert(1)</script>'), false);
  assert.equal(isAdsenseSlotId('1234567890'), true);
  assert.equal(isAdsenseSlotId('abc'), false);
});
