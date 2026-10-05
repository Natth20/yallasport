import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontTransfer } from './types';

async function _loadFrontTransfers(locale: string): Promise<FrontTransfer[]> {
  const rows = await cachedJson('front:transfers:v3', 90, () =>
    prisma.transfer
      .findMany({
        orderBy: { date: 'desc' },
        take: 16,
        include: { player: { select: { name: true, slug: true, photoUrl: true } } },
      })
      .catch(swallow('front.transfers', [])),
  );

  return rows.map((row) => ({
    id: row.id,
    date: new Date(row.date).toISOString(),
    fee: row.fee,
    kind: row.type ?? null,
    fromTeam: row.fromTeam ? localizePlainName(locale, row.fromTeam) : null,
    toTeam: row.toTeam ? localizePlainName(locale, row.toTeam) : null,
    fromLogo: row.fromLogo,
    toLogo: row.toLogo,
    playerName: localizePlainName(locale, row.player.name),
    playerSlug: row.player.slug,
    playerPhoto: row.player.photoUrl,
  }));
}

const _getCachedFrontTransfers = cache(_loadFrontTransfers);

export async function loadFrontTransfers(locale: string): Promise<FrontTransfer[]> {
  return _getCachedFrontTransfers(locale);
}
