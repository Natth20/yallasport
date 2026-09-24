import 'server-only';

import { prisma } from '@/lib/prisma';
import { STREAMING_ENABLED } from './flag';
import { isGeoAllowed, isWithinWindow } from './entitlement';

const PLAYABLE = ['READY', 'LIVE'] as const;

const assetInclude = {
  match: {
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      league: { select: { id: true, name: true, slug: true, logoUrl: true, country: true } },
    },
  },
  channel: true,
  license: true,
  episode: {
    include: {
      show: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          posterUrl: true,
          releaseYear: true,
        },
      },
    },
  },
} as const;

function filterPlayableWindow<
  T extends {
    geoAllow: string[];
    startsAt: Date | null;
    endsAt: Date | null;
    match: { kickoffAt: Date } | null;
  },
>(assets: T[], country: string | null, now = new Date()) {
  return assets.filter((asset) => {
    if (!isGeoAllowed(country, asset.geoAllow)) return false;
    return isWithinWindow(now, asset.startsAt, asset.endsAt, asset.match?.kickoffAt);
  });
}

/** Live / ready sports windows tied to a match. */
export async function listLiveCatalog(input: {
  country: string | null;
  leagueId?: string;
  channelId?: string;
}) {
  if (!STREAMING_ENABLED) return [];

  const assets = await prisma.streamAsset.findMany({
    where: {
      status: { in: [...PLAYABLE] },
      matchId: { not: null },
      ...(input.channelId ? { channelId: input.channelId } : {}),
      ...(input.leagueId ? { match: { leagueId: input.leagueId } } : {}),
      license: { status: 'ACTIVE' },
    },
    include: assetInclude,
    orderBy: [{ status: 'asc' }, { startsAt: 'asc' }],
  });

  return filterPlayableWindow(assets, input.country);
}

/**
 * Linear TV / news / entertainment feeds: channel on air without a match fixture.
 * Used when the sports desk has nothing live.
 */
export async function listLinearCatalog(input: {
  country: string | null;
  channelId?: string;
  take?: number;
}) {
  if (!STREAMING_ENABLED) return [];

  const assets = await prisma.streamAsset.findMany({
    where: {
      status: { in: [...PLAYABLE] },
      matchId: null,
      episodeId: null,
      channelId: { not: null },
      ...(input.channelId ? { channelId: input.channelId } : {}),
      license: { status: 'ACTIVE' },
    },
    include: assetInclude,
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take: input.take ?? 24,
  });

  return filterPlayableWindow(assets, input.country);
}

/** Published VOD titles that already have a licensed playable episode asset. */
export async function listPublishedLibrary(input?: { take?: number }) {
  if (!STREAMING_ENABLED) return [];

  return prisma.show.findMany({
    where: {
      status: 'PUBLISHED',
      episodes: {
        some: {
          streamAssets: {
            some: {
              status: { in: [...PLAYABLE] },
              license: { status: 'ACTIVE' },
            },
          },
        },
      },
    },
    include: {
      _count: { select: { episodes: true } },
      episodes: {
        where: {
          streamAssets: {
            some: {
              status: { in: [...PLAYABLE] },
              license: { status: 'ACTIVE' },
            },
          },
        },
        orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }],
        take: 1,
        select: {
          id: true,
          streamAssets: {
            where: {
              status: { in: [...PLAYABLE] },
              license: { status: 'ACTIVE' },
            },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: input?.take ?? 24,
  });
}

export async function getWatchTarget(id: string) {
  const byAsset = await prisma.streamAsset.findUnique({
    where: { id },
    include: {
      match: {
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          league: { select: { id: true, name: true, slug: true, logoUrl: true } },
          statistics: true,
          channels: { include: { channel: true } },
        },
      },
      channel: true,
      license: true,
      episode: { include: { show: true } },
    },
  });
  if (byAsset) return byAsset;

  return prisma.streamAsset.findFirst({
    where: {
      matchId: id,
      status: { in: [...PLAYABLE] },
      license: { status: 'ACTIVE' },
    },
    include: {
      match: {
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          league: { select: { id: true, name: true, slug: true, logoUrl: true } },
          statistics: true,
          channels: { include: { channel: true } },
        },
      },
      channel: true,
      license: true,
      episode: { include: { show: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function upcomingLicensedWindows(take = 8) {
  if (!STREAMING_ENABLED) return [];
  return prisma.streamAsset.findMany({
    where: {
      status: { in: ['READY', 'LIVE'] },
      license: { status: 'ACTIVE' },
      OR: [{ startsAt: { gte: new Date() } }, { match: { kickoffAt: { gte: new Date() } } }],
    },
    include: {
      match: {
        include: {
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
          league: { select: { name: true } },
        },
      },
      channel: true,
      episode: { include: { show: { select: { title: true, slug: true } } } },
    },
    orderBy: { startsAt: 'asc' },
    take,
  });
}

export async function licensedAssetsForMatch(matchId: string) {
  if (!STREAMING_ENABLED) return [];
  return prisma.streamAsset.findMany({
    where: {
      matchId,
      status: { in: [...PLAYABLE] },
      license: { status: 'ACTIVE' },
    },
    include: { channel: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function listTonightTvGuide(input: {
  start: Date;
  end: Date;
  leagueId?: string;
  channelId?: string;
}) {
  return prisma.matchChannel.findMany({
    where: {
      match: {
        kickoffAt: { gte: input.start, lt: input.end },
        ...(input.leagueId ? { leagueId: input.leagueId } : {}),
      },
      ...(input.channelId ? { channelId: input.channelId } : {}),
    },
    include: {
      match: {
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          league: { select: { id: true, name: true, slug: true, logoUrl: true, country: true } },
        },
      },
      channel: true,
    },
    orderBy: { match: { kickoffAt: 'asc' } },
    take: 16,
  });
}

export async function licensedAssetForMatch(matchId: string) {
  if (!STREAMING_ENABLED) return null;
  return prisma.streamAsset.findFirst({
    where: {
      matchId,
      status: { in: [...PLAYABLE] },
      license: { status: 'ACTIVE' },
    },
    select: { id: true, status: true, channel: { select: { name: true } } },
  });
}

/** Desk for /live and /watch: sports first, then linear TV, then VOD library. */
export async function loadScreenDesk(input: { country: string | null }) {
  const [sports, linear, library, upcoming] = await Promise.all([
    listLiveCatalog({ country: input.country }),
    listLinearCatalog({ country: input.country }),
    listPublishedLibrary({ take: 24 }),
    upcomingLicensedWindows(8),
  ]);

  return {
    sports,
    linear,
    library,
    upcoming: upcoming.filter((item) => isGeoAllowed(input.country, item.geoAllow ?? [])),
    hasSportsLive: sports.some((item) => item.status === 'LIVE') || sports.length > 0,
  };
}
