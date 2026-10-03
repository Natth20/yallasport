import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapApiFootballStandings } from './standings-map';

test('maps official standings fields and never uses team id as points', () => {
  const rows = mapApiFootballStandings({
    response: [
      {
        league: {
          id: 39,
          season: 2026,
          standings: [
            [
              {
                rank: 1,
                team: { id: 50, name: 'Manchester City', logo: 'city.png' },
                points: 15,
                goalsDiff: 8,
                all: { played: 5, win: 5, draw: 0, lose: 0, goals: { for: 13, against: 5 } },
              },
              {
                rank: 2,
                team: { id: 42, name: 'Arsenal', logo: 'ars.png' },
                points: 12,
                goalsDiff: 4,
                all: { played: 5, win: 4, draw: 0, lose: 1, goals: { for: 8, against: 4 } },
              },
            ],
          ],
        },
      },
    ],
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].team.externalId, '50');
  assert.equal(rows[0].points, 15);
  assert.equal(rows[0].played, 5);
  assert.equal(rows[0].won, 5);
  assert.equal(rows[0].goalDiff, 8);
  assert.notEqual(rows[0].points, 50);
  assert.equal(rows[1].points, 12);
});

test('flattens a single league-phase table nested as groups', () => {
  const rows = mapApiFootballStandings({
    response: [
      {
        league: {
          standings: [
            [
              {
                rank: 2,
                team: { id: 157, name: 'Bayern München' },
                points: 3,
                goalsDiff: 5,
                all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 5, against: 0 } },
              },
              {
                rank: 1,
                team: { id: 85, name: 'Paris Saint Germain' },
                points: 3,
                goalsDiff: 5,
                all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 6, against: 1 } },
              },
            ],
          ],
        },
      },
    ],
  });
  assert.deepEqual(
    rows.map((row) => row.team.name),
    ['Paris Saint Germain', 'Bayern München'],
  );
});

test('keeps group-stage order when ranks repeat across groups', () => {
  const row = (rank: number, id: number, name: string) => ({
    rank,
    team: { id, name },
    points: 6,
    goalsDiff: 2,
    all: { played: 3, win: 2, draw: 0, lose: 1, goals: { for: 4, against: 2 } },
  });
  const mapped = mapApiFootballStandings({
    response: [
      {
        league: {
          standings: [
            [row(1, 1, 'A1'), row(2, 2, 'A2')],
            [row(1, 3, 'B1'), row(2, 4, 'B2')],
          ],
        },
      },
    ],
  });
  assert.deepEqual(
    mapped.map((item) => item.team.name),
    ['A1', 'A2', 'B1', 'B2'],
  );
});

test('skips rows that are missing the official all/points block', () => {
  const rows = mapApiFootballStandings({
    response: [
      {
        league: {
          standings: [
            [
              { rank: 1, team: { id: 50, name: 'Manchester City' }, points: 15 },
              {
                rank: 2,
                team: { id: 42, name: 'Arsenal' },
                points: 12,
                all: { played: 5, win: 4, draw: 0, lose: 1, goals: { for: 8, against: 4 } },
              },
            ],
          ],
        },
      },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].team.name, 'Arsenal');
});
