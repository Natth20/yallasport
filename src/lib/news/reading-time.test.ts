import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listedReadingMinutes, readingTimeMinutes } from './reading-time';

test('short RSS teaser is not a one-minute read', () => {
  assert.equal(readingTimeMinutes('Celtic v Rangers: live updates from the derby.'), 0);
  assert.equal(
    listedReadingMinutes({
      title: 'Celtic v Rangers: live',
      excerpt: 'Updates from Old Firm derby.',
      readingTime: 1,
    }),
    0,
  );
});

test('a stored full-article duration still shows on the list', () => {
  assert.equal(
    listedReadingMinutes({
      title: 'Short teaser',
      excerpt: 'Lead sentence only.',
      readingTime: 4,
    }),
    4,
  );
});

test('arabic copy uses character count, not a hardcoded minute', () => {
  const body = Array.from({ length: 40 }, () => 'محمد صلاح يقود طرابزون سبور لفوز كبير في الدوري التركي بعد هاتريك رائع.').join(' ');
  const mins = readingTimeMinutes(body);
  assert.ok(mins >= 2, `expected a real duration, got ${mins}`);
});
