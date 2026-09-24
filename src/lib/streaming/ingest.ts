import { swallow } from '@/lib/ops/caught';
import 'server-only';

import { prisma } from '@/lib/prisma';

type ChannelKind = 'SPORTS' | 'NEWS' | 'MOVIE' | 'SERIES' | 'DOCUMENTARY' | 'GENERAL';
type ShowType = 'MOVIE' | 'SERIES' | 'DOCUMENTARY';
type StreamAssetStatus = 'DRAFT' | 'READY' | 'LIVE' | 'ENDED' | 'DISABLED';
type StreamDrmType = 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';
type StreamProtocol = 'HLS' | 'DASH';

/**
 * Shape expected from the licensed catalog sync endpoint.
 * Map vendor fields into this contract in one place when the API arrives.
 */
export type LicensedCatalogPayload = {
  channels?: Array<{
    externalId: string;
    name: string;
    logoUrl?: string | null;
    country?: string | null;
    kind?: ChannelKind | string;
  }>;
  shows?: Array<{
    externalId: string;
    title: string;
    slug: string;
    description?: string | null;
    posterUrl?: string | null;
    backdropUrl?: string | null;
    type?: ShowType | string;
    releaseYear?: number | null;
    rating?: string | null;
    categories?: string[];
    episodes?: Array<{
      externalId: string;
      seasonNumber?: number | null;
      episodeNumber?: number | null;
      title?: string | null;
      description?: string | null;
      duration?: number | null;
      isFree?: boolean;
    }>;
  }>;
  assets?: Array<{
    externalAssetId: string;
    protocol?: StreamProtocol | string;
    drmType?: StreamDrmType | string;
    status?: StreamAssetStatus | string;
    matchExternalId?: string | null;
    channelExternalId?: string | null;
    episodeExternalId?: string | null;
    licenseId?: string | null;
    geoAllow?: string[];
    startsAt?: string | null;
    endsAt?: string | null;
    apiCredentialsRef?: string | null;
  }>;
};

function asChannelKind(value?: string): ChannelKind {
  const key = (value || 'GENERAL').toUpperCase();
  if (key === 'SPORTS' || key === 'NEWS' || key === 'MOVIE' || key === 'SERIES' || key === 'DOCUMENTARY') {
    return key;
  }
  return 'GENERAL';
}

function asShowType(value?: string): ShowType {
  const key = (value || 'DOCUMENTARY').toUpperCase();
  if (key === 'MOVIE' || key === 'SERIES' || key === 'DOCUMENTARY') return key;
  return 'DOCUMENTARY';
}

function asProtocol(value?: string): StreamProtocol {
  return (value || '').toUpperCase() === 'DASH' ? 'DASH' : 'HLS';
}

function asDrm(value?: string): StreamDrmType {
  const key = (value || 'NONE').toUpperCase();
  if (key === 'WIDEVINE' || key === 'FAIRPLAY' || key === 'PLAYREADY') return key;
  return 'NONE';
}

function asStatus(value?: string): StreamAssetStatus {
  const key = (value || 'READY').toUpperCase();
  if (key === 'DRAFT' || key === 'READY' || key === 'LIVE' || key === 'ENDED' || key === 'DISABLED') {
    return key;
  }
  return 'READY';
}

/**
 * Upsert licensed catalog rows. Safe to re-run.
 * Channels / shows keyed by provider external ids via StreamAsset uniqueness
 * and Show.slug / Channel name+kind heuristics for channels.
 */
export async function ingestLicensedCatalog(
  payload: LicensedCatalogPayload,
  providerKey = (process.env.STREAMING_PROVIDER || 'licensed').trim() || 'licensed'
) {
  const channelByExternal = new Map<string, string>();
  const episodeByExternal = new Map<string, string>();

  for (const row of payload.channels || []) {
    const existing = await prisma.channel.findFirst({
      where: { name: row.name, kind: asChannelKind(row.kind) },
      select: { id: true },
    });
    const channel = existing
      ? await prisma.channel.update({
        where: { id: existing.id },
        data: {
          logoUrl: row.logoUrl ?? undefined,
          country: row.country ?? undefined,
          kind: asChannelKind(row.kind),
        },
      })
      : await prisma.channel.create({
        data: {
          name: row.name,
          logoUrl: row.logoUrl ?? null,
          country: row.country ?? null,
          kind: asChannelKind(row.kind),
        },
      });
    channelByExternal.set(row.externalId, channel.id);
  }

  for (const row of payload.shows || []) {
    const show = await prisma.show.upsert({
      where: { slug: row.slug },
      create: {
        title: row.title,
        slug: row.slug,
        description: row.description ?? null,
        posterUrl: row.posterUrl ?? null,
        backdropUrl: row.backdropUrl ?? null,
        type: asShowType(row.type),
        releaseYear: row.releaseYear ?? null,
        rating: row.rating ?? null,
        categories: row.categories ?? [],
        status: 'PUBLISHED',
      },
      update: {
        title: row.title,
        description: row.description ?? null,
        posterUrl: row.posterUrl ?? null,
        backdropUrl: row.backdropUrl ?? null,
        type: asShowType(row.type),
        releaseYear: row.releaseYear ?? null,
        rating: row.rating ?? null,
        categories: row.categories ?? [],
        status: 'PUBLISHED',
      },
    });

    for (const ep of row.episodes || []) {
      const found = await prisma.episode.findFirst({
        where: {
          showId: show.id,
          seasonNumber: ep.seasonNumber ?? undefined,
          episodeNumber: ep.episodeNumber ?? undefined,
        },
      });
      const episode = found
        ? await prisma.episode.update({
          where: { id: found.id },
          data: {
            title: ep.title ?? undefined,
            description: ep.description ?? undefined,
            duration: ep.duration ?? undefined,
            isFree: ep.isFree ?? true,
            streamUrl: null,
          },
        })
        : await prisma.episode.create({
          data: {
            showId: show.id,
            seasonNumber: ep.seasonNumber ?? null,
            episodeNumber: ep.episodeNumber ?? null,
            title: ep.title ?? null,
            description: ep.description ?? null,
            duration: ep.duration ?? null,
            isFree: ep.isFree ?? true,
            streamUrl: null,
          },
        });
      episodeByExternal.set(ep.externalId, episode.id);
    }
  }

  let assetsUpserted = 0;
  for (const row of payload.assets || []) {
    const channelId = row.channelExternalId
      ? channelByExternal.get(row.channelExternalId) || null
      : null;
    const episodeId = row.episodeExternalId
      ? episodeByExternal.get(row.episodeExternalId) || null
      : null;

    let matchId: string | null = null;
    if (row.matchExternalId) {
      const match = await prisma.match.findFirst({
        where: { externalId: row.matchExternalId },
        select: { id: true },
      });
      matchId = match?.id ?? null;
    }

    await prisma.streamAsset.upsert({
      where: {
        providerKey_externalAssetId: {
          providerKey,
          externalAssetId: row.externalAssetId,
        },
      },
      create: {
        providerKey,
        externalAssetId: row.externalAssetId,
        protocol: asProtocol(row.protocol),
        drmType: asDrm(row.drmType),
        status: asStatus(row.status),
        matchId,
        channelId,
        episodeId,
        licenseId: row.licenseId ?? null,
        geoAllow: row.geoAllow ?? [],
        startsAt: row.startsAt ? new Date(row.startsAt) : null,
        endsAt: row.endsAt ? new Date(row.endsAt) : null,
        apiCredentialsRef: row.apiCredentialsRef ?? null,
      },
      update: {
        protocol: asProtocol(row.protocol),
        drmType: asDrm(row.drmType),
        status: asStatus(row.status),
        matchId,
        channelId,
        episodeId,
        licenseId: row.licenseId ?? null,
        geoAllow: row.geoAllow ?? [],
        startsAt: row.startsAt ? new Date(row.startsAt) : null,
        endsAt: row.endsAt ? new Date(row.endsAt) : null,
        apiCredentialsRef: row.apiCredentialsRef ?? null,
      },
    });
    assetsUpserted += 1;
  }

  return {
    channels: channelByExternal.size,
    shows: payload.shows?.length ?? 0,
    assets: assetsUpserted,
  };
}

/** Pull catalog from STREAMING_CATALOG_URL when the vendor exposes one. */
export async function syncLicensedCatalogFromEnv() {
  const endpoint = (process.env.STREAMING_CATALOG_URL || '').trim();
  const secret = (process.env.STREAMING_API_KEY || '').trim();
  if (!endpoint || !secret) {
    return { ok: false as const, reason: 'missing_env' as const };
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  }).catch(swallow("src/lib/streaming/ingest.ts:270", null));

  if (!response?.ok) {
    return { ok: false as const, reason: 'fetch_failed' as const, status: response?.status ?? 0 };
  }

  const payload = ((await response.json().catch(swallow("src/lib/streaming/ingest.ts:276", null, { persist: false }))) as LicensedCatalogPayload | null) || null;
  if (!payload) {
    return { ok: false as const, reason: 'invalid_json' as const };
  }

  const counts = await ingestLicensedCatalog(payload);
  return { ok: true as const, ...counts };
}
