import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizePlainName } from './sports-lexicon';

test('multi-word English names become a single Arabic string', () => {
  const value = localizePlainName('ar', 'Premier League 2');
  assert.equal(typeof value, 'string');
  assert.ok(!Array.isArray(value));
  assert.equal(value.charAt(0).length, 1);
});
