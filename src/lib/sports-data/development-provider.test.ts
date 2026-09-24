import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DevelopmentProvider } from './providers/development-provider';

test('empty sports provider never invents fixtures or tables', async () => {
  const provider = new DevelopmentProvider();
  assert.deepEqual(await provider.getLiveMatches(), []);
  assert.deepEqual(await provider.getStandings('39', '2026'), []);
  assert.deepEqual(await provider.getTopScorers('39', '2026'), []);
  assert.deepEqual(await provider.getH2H('1', '2'), []);
  assert.deepEqual(await provider.getMatchesByDate('2026-09-21'), []);
});
