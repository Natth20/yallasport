import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordFor, remapMatchSides, shareBar } from '../../components/versus/versus';

test('H2H record uses remapped provider ids, not Prisma ids', () => {
  const map = new Map([
    ['541', 'db-madrid'],
    ['529', 'db-barca'],
  ]);
  const rows = [
    remapMatchSides(
      { homeTeamId: '541', awayTeamId: '529', homeScore: 2, awayScore: 1 },
      map,
    ),
    remapMatchSides(
      { homeTeamId: '529', awayTeamId: '541', homeScore: 0, awayScore: 0 },
      map,
    ),
  ];
  assert.deepEqual(recordFor(rows, 'db-madrid'), { won: 1, drawn: 1, lost: 0, skipped: 0, played: 2 });
  assert.deepEqual(recordFor(rows, 'db-barca'), { won: 0, drawn: 1, lost: 1, skipped: 0, played: 2 });
});

test('share bar stays empty when both sides have no data', () => {
  assert.equal(shareBar(0, 0).empty, true);
  assert.equal(shareBar(3, 1).empty, false);
  assert.equal(shareBar(3, 1).pct, 75);
});
