import { test } from 'node:test';
import assert from 'node:assert/strict';
import { looksLikePersonName, transferDedupeKey, validateTransferMove } from './validate';

test('rejects a player name used as destination club', () => {
  const bad = validateTransferMove({
    playerName: 'Renato Sanches',
    fromTeam: 'PSG',
    toTeam: 'Sanches Renato',
    date: new Date('2026-07-01'),
  });
  assert.equal(bad.ok, false);
  assert.equal(validateTransferMove({
    playerName: 'Kylian Mbappe',
    fromTeam: 'PSG',
    toTeam: 'Real Madrid',
    date: new Date('2026-07-01'),
  }).ok, true);
});

test('person-like club names are flagged', () => {
  assert.equal(looksLikePersonName('Sanches Renato'), true);
  assert.equal(looksLikePersonName('Real Madrid'), false);
});

test('dedupe key is stable for the same move', () => {
  const date = new Date('2026-07-01T12:00:00Z');
  assert.equal(
    transferDedupeKey({ playerId: 'p1', fromTeam: 'PSG', toTeam: 'Real Madrid', date, type: 'Transfer' }),
    transferDedupeKey({ playerId: 'p1', fromTeam: 'PSG', toTeam: 'Real Madrid', date, type: '€20M' }),
  );
});
