import { reportCaughtError } from '@/lib/ops/caught';
import { sportsData } from '@/lib/sports-data';
import { persistNormalizedMatch } from '@/lib/sports-data/persistence';
import { cronFixtureDateKeys } from '@/lib/sports-data/match-window';

export async function runSportsSync() {
  const dateKeys = cronFixtureDateKeys();
  const [liveMatches, ...datedBatches] = await Promise.all([
    sportsData.getLiveMatches(),
    ...dateKeys.map((date) => sportsData.getMatchesByDate(date)),
  ]);
  const allFixtures = Array.from(
    new Map(
      [...datedBatches.flat(), ...liveMatches].map((match) => [String(match.externalId), match]),
    ).values(),
  );
  let synced = 0;
  for (const match of allFixtures) {
    try {
      await persistNormalizedMatch(match);
      synced += 1;
    } catch (error) {
      reportCaughtError("src/lib/sports-data/run-sync.ts:21", error);
      // skip one fixture
    }
  }
  return { synced, live: liveMatches.length };
}
