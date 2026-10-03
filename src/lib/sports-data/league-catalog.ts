import { sportsData } from '@/lib/sports-data';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { upsertLeague } from '@/lib/sports-data/persistence';
import { reportCaughtError } from '@/lib/ops/caught';

type ApiLeagues = {
  response?: Array<{
    league?: { id?: number; name?: string; logo?: string };
    country?: { name?: string | null };
  }>;
};

function slugifyLeague(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'league';
}

/**
 * Pull the full competition catalog from the source and persist it.
 * No-ops without a live key, so it is safe to call from the daily cron.
 * When the key is present it fills every league the source lists — the
 * "371 competitions" catalog — without inventing any that the source omits.
 */
export async function syncLeagueCatalog(): Promise<{ upserted: number; skipped: boolean }> {
  if (!isLiveSportsApi()) return { upserted: 0, skipped: true };

  const pack = await sportsData.getRaw<ApiLeagues>('/leagues').catch((error) => {
    reportCaughtError('league-catalog.fetch', error);
    return null;
  });
  const rows = pack?.response || [];
  if (rows.length === 0) return { upserted: 0, skipped: true };

  let upserted = 0;
  for (const row of rows) {
    const id = row.league?.id;
    const name = row.league?.name?.trim();
    if (id == null || !name) continue;
    try {
      await upsertLeague({
        externalId: String(id),
        name,
        slug: slugifyLeague(name),
        logoUrl: row.league?.logo || null,
        country: row.country?.name || null,
      });
      upserted += 1;
    } catch (error) {
      reportCaughtError('league-catalog.upsert', error);
    }
  }
  return { upserted, skipped: false };
}
