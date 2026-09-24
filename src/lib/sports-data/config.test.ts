import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLiveSportsApi } from './config';

test('sports abstraction stays empty without a real key', () => {
  const previous = process.env.SPORTS_API_KEY;
  process.env.SPORTS_API_KEY = '';
  assert.equal(isLiveSportsApi(), false);
  process.env.SPORTS_API_KEY = 'placeholder-api-key';
  assert.equal(isLiveSportsApi(), false);
  process.env.SPORTS_API_KEY = previous;
});

test('sports abstraction goes live only with a real key', () => {
  const previous = process.env.SPORTS_API_KEY;
  process.env.SPORTS_API_KEY = 'real-test-key';
  assert.equal(isLiveSportsApi(), true);
  process.env.SPORTS_API_KEY = previous;
});
