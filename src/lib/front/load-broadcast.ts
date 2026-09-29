import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { listTonightTvGuide } from '@/lib/streaming/catalog';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { frontDayWindow } from './window';
import type { FrontBroadcast } from './types';

export async function loadFrontBroadcast(locale: string): Promise<FrontBroadcast[]> {
  const { todayKey, start, end } = frontDayWindow();
  const rows = await cachedJson(`front:tv:${todayKey}:v2`, 60, () =>
    listTonightTvGuide({ start, end }).catch(swallow('front.tv', [])),
  );

  return rows.slice(0, 12).map((row) => ({
    id: row.id,
    channelName: localizePlainName(locale, row.channel.name),
    channelLogo: row.channel.logoUrl,
    kickoffAt: new Date(row.match.kickoffAt).toISOString(),
    homeName: localizePlainName(locale, row.match.homeTeam.name),
    awayName: localizePlainName(locale, row.match.awayTeam.name),
    matchId: row.match.id,
    leagueName: localizePlainName(locale, row.match.league.name),
  }));
}
