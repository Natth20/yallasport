import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackToken, verifyPlaybackToken } from './playback-token';

test('playback tokens expire and reject tampering', () => {
  process.env.STREAM_TOKEN_SECRET = 'test-secret';
  const token = createPlaybackToken({ assetId: 'asset-1', userId: 'user-1', country: 'EG' }, 60_000);
  const valid = verifyPlaybackToken(token);
  assert.equal(valid?.assetId, 'asset-1');
  assert.equal(verifyPlaybackToken(token.slice(0, -2) + 'xx'), null);

  const expired = createPlaybackToken({ assetId: 'asset-1', userId: 'user-1', country: 'EG' }, -1);
  assert.equal(verifyPlaybackToken(expired), null);
});
