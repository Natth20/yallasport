import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontTransfer } from './types';

export async function loadFrontTransfers(locale: string): Promise<FrontTransfer[]> {
  const rows = await cachedJson('front:transfers:v1', 180, () =>
    prisma.transfer
      .findMany({
        orderBy: { date: 'desc' },
        take: 10,
        include: { player: { select: { name: true, slug: true, photoUrl: true } } },
      })
      .catch(swallow('front.transfers', [])),
  );

  return rows.map((row) => ({
    id: row.id,
    date: new Date(row.date).toISOString(),
    fee: row.fee,
    fromTeam: row.fromTeam ? localizePlainName(locale, row.fromTeam) : null,
    toTeam: row.toTeam ? localizePlainName(locale, row.toTeam) : null,
    playerName: localizePlainName(locale, row.player.name),
    playerSlug: row.player.slug,
    playerPhoto: row.player.photoUrl,
  }));
}
