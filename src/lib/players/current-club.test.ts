import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCurrentClub } from './current-club';

test('loan destination is the current club, not a free agent', () => {
  const result = resolveCurrentClub({
    currentSeason: 2026,
    openStints: [],
    seasonTeams: [],
    transfers: [
      {
        date: new Date('2026-08-01'),
        type: 'Loan',
        fromTeam: 'Chelsea',
        toTeam: 'Celtic',
      },
    ],
  });
  assert.equal(result.confirmedFreeAgent, false);
  assert.equal(result.club?.name, 'Celtic');
  assert.equal(result.onLoanFrom?.name, 'Chelsea');
});

test('latest season statistics beat a closed historical stint', () => {
  const result = resolveCurrentClub({
    currentSeason: 2026,
    openStints: [],
    seasonTeams: [
      { id: '49', name: 'Chelsea', logoUrl: null, season: 2026, appearances: 4 },
    ],
    transfers: [],
  });
  assert.equal(result.club?.name, 'Chelsea');
  assert.equal(result.confirmedFreeAgent, false);
});

test('contract ended without a destination is a confirmed free agent', () => {
  const result = resolveCurrentClub({
    currentSeason: 2026,
    openStints: [],
    seasonTeams: [],
    transfers: [
      {
        date: new Date('2025-07-01'),
        type: 'Contract ended',
        fromTeam: 'Chelsea',
        toTeam: null,
      },
    ],
  });
  assert.equal(result.club, null);
  assert.equal(result.confirmedFreeAgent, true);
});
