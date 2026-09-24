import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictionAccuracy, rankByPoints, scorerDeskSlug, settledStreak } from './rank';

test('global rank is one past everyone with more points', () => {
  assert.equal(rankByPoints(0), 1);
  assert.equal(rankByPoints(11), 12);
});

test('accuracy is null until a slip is settled', () => {
  assert.equal(predictionAccuracy(0, 0), null);
  assert.equal(predictionAccuracy(3, 4), 75);
});

test('streak stops at the first miss, newest first', () => {
  assert.equal(settledStreak([{ isCorrect: true }, { isCorrect: true }, { isCorrect: false }]), 2);
  assert.equal(settledStreak([{ isCorrect: null }, { isCorrect: true }]), 0);
});

test('scorer links use the ledger slug-id form', () => {
  assert.equal(scorerDeskSlug('Erling Haaland', '1100'), 'erling-haaland-1100');
});
