import { cache } from 'react';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { localizeCompetitionTitle, localizeCountryName } from '@/lib/i18n/competition-names';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { swallow } from '@/lib/ops/caught';
import { isLiveStatus, liveKickoffFloor } from '@/lib/sports-data/match-window';
import { searchPlayers } from '@/lib/players/search';
import { didYouMean, expandQueryVariants } from './aliases';
import { dedupeNews, scoreNewsItem } from './news-rank';
import { scoreNameHit, slugBit } from './text';
import type { SeekKind } from '@/components/search/seek';
import { getQuickCatalog, quickSearchSuggestions } from './quick-catalog';

const LIVE_WHERE: Prisma.MatchWhereInput = {
  status: { in: ['LIVE', 'HALFTIME'] },
  kickoffAt: { gte: liveKickoffFloor() },
};

export type SearchTeam = {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  country: string | null;
  leagueName: string | null;
  logoUrl: string | null;
  externalId: string;
  score: number;
};

export type SearchPlayer = {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  position: string | null;
  nationality: string | null;
  photoUrl: string | null;
  teamName: string | null;
  score: number;
};

export type SearchCoach = {
  id: string;
  slug: string;
  name: string;
  nationality: string | null;
  photoUrl: string | null;
  teamName: string | null;
  score: number;
};

export type SearchLeague = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  logoUrl: string | null;
  externalId: string | null;
  score: number;
};

export type SearchMatch = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date;
  homeTeam: { id: string; name: string; slug: string; logoUrl: string | null };
  awayTeam: { id: string; name: string; slug: string; logoUrl: string | null };
  league: { id: string; name: string; slug: string };
};

export type SearchNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  featuredImage: string | null;
  category: string;
  sourceName: string | null;
  why: string;
  score: number;
};

export type SearchTransfer = {
  id: string;
  playerName: string;
  playerSlug: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  date: Date;
  type: string | null;
  fee: string | null;
};

export type SearchClip = {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
};

export type UnifiedSearch = {
  query: string;
  variants: string[];
  suggestion: string | null;
  primaryPlayer: SearchPlayer | null;
  primaryTeam: SearchTeam | null;
  teams: SearchTeam[];
  players: SearchPlayer[];
  coaches: SearchCoach[];
  leagues: SearchLeague[];
  liveMatches: SearchMatch[];
  upcomingMatches: SearchMatch[];
  recentMatches: SearchMatch[];
  olderMatches: SearchMatch[];
  news: SearchNews[];
  transfers: SearchTransfer[];
  videos: SearchClip[];
  photos: SearchNews[];
  counts: Record<Exclude<SeekKind, 'all'>, number>;
  page: number;
  pageSize: number;
};

function containsOr(variants: string[], fields: Array<'name' | 'officialName' | 'slug'>) {
  const or: Prisma.TeamWhereInput[] = [];
  for (const q of variants) {
    if (fields.includes('name')) or.push({ name: { contains: q, mode: 'insensitive' } });
    if (fields.includes('officialName')) or.push({ officialName: { contains: q, mode: 'insensitive' } });
    const slug = slugBit(q);
    if (fields.includes('slug') && slug.length >= 3) or.push({ slug: { contains: slug, mode: 'insensitive' } });
  }
  return or;
}

function mapMatch(
  row: SearchMatch,
  locale: string,
): SearchMatch {
  return {
    ...row,
    homeTeam: { ...row.homeTeam, name: localizeTeamName(locale, row.homeTeam.name) },
    awayTeam: { ...row.awayTeam, name: localizeTeamName(locale, row.awayTeam.name) },
    league: { ...row.league, name: localizePlainName(locale, row.league.name) },
  };
}

function splitMatches(rows: SearchMatch[]) {
  const now = Date.now();
  const live: SearchMatch[] = [];
  const upcoming: SearchMatch[] = [];
  const recent: SearchMatch[] = [];
  const older: SearchMatch[] = [];
  for (const row of rows) {
    if (isLiveStatus(row.status) && row.kickoffAt.getTime() >= liveKickoffFloor().getTime()) {
      live.push(row);
    } else if (row.status === 'NOT_STARTED' || row.kickoffAt.getTime() > now) {
      upcoming.push(row);
    } else if (row.status === 'FINISHED' && now - row.kickoffAt.getTime() < 21 * 24 * 60 * 60 * 1000) {
      recent.push(row);
    } else {
      older.push(row);
    }
  }
  upcoming.sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  recent.sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());
  older.sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());
  return { live, upcoming, recent, older };
}

export const runUnifiedSearch = cache(async function runUnifiedSearch(opts: {
  locale: string;
  query: string;
  kind: SeekKind;
  page?: number;
}): Promise<UnifiedSearch> {
  const locale = opts.locale;
  const query = opts.query.trim().slice(0, 80);
  const kind = opts.kind;
  const page = Math.max(1, opts.page || 1);
  const pageSize = kind === 'all' ? 8 : 24;
  const emptyCounts = {
    matches: 0,
    teams: 0,
    players: 0,
    coaches: 0,
    leagues: 0,
    news: 0,
    videos: 0,
    photos: 0,
    transfers: 0,
  };
  const blank: UnifiedSearch = {
    query,
    variants: [],
    suggestion: query ? didYouMean(query) : null,
    primaryPlayer: null,
    primaryTeam: null,
    teams: [],
    players: [],
    coaches: [],
    leagues: [],
    liveMatches: [],
    upcomingMatches: [],
    recentMatches: [],
    olderMatches: [],
    news: [],
    transfers: [],
    videos: [],
    photos: [],
    counts: emptyCounts,
    page,
    pageSize,
  };
  if (!query) return blank;

  const cacheKey = `${locale}:${query}:${kind}:${page}`;
  const cachedHit = unifiedSearchCache.get(cacheKey);
  if (cachedHit && Date.now() - cachedHit.at < 60_000) {
    return cachedHit.data;
  }

  const variants = expandQueryVariants(query);
  const catalog = await getQuickCatalog();

  // 1. Teams scored in-memory (< 0.5ms)
  const teams: SearchTeam[] = catalog.teams
    .map((row) => {
      const extras = [row.officialName || '', localizeTeamName('ar', row.name), localizeTeamName('en', row.name)];
      return {
        id: row.id,
        slug: row.slug,
        name: localizeTeamName(locale, row.name),
        englishName: row.officialName || row.name,
        country: row.country ? localizeCountryName(locale, row.country) : null,
        leagueName: row.leagueName
          ? localizeCompetitionTitle(locale, {
              name: row.leagueName,
              country: row.country,
            })
          : null,
        logoUrl: row.logoUrl,
        externalId: row.externalId,
        score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, extras))),
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  // 2. Players scored in-memory (< 0.5ms)
  const players: SearchPlayer[] = catalog.players
    .map((row) => {
      const extras = [
        row.officialName || '',
        localizePlainName('ar', row.name),
        localizePlainName('en', row.name),
        ...(row.officialName || row.name).split(/\s+/).slice(-1),
      ];
      return {
        id: row.id,
        slug: row.slug,
        name: localizePlainName(locale, row.name),
        englishName: row.officialName || row.name,
        position: row.position ? localizePlainName(locale, row.position) : null,
        nationality: row.nationality ? localizeCountryName(locale, row.nationality) : null,
        photoUrl: row.photoUrl,
        teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
        score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, extras))),
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const primaryPlayer = players[0] && players[0].score >= 44 ? players[0] : null;
  const primaryTeam =
    teams[0] && teams[0].score >= 58 && (!primaryPlayer || teams[0].score > primaryPlayer.score + 8)
      ? teams[0]
      : null;

  // 3. Coaches scored in-memory (< 0.1ms)
  const coaches: SearchCoach[] = catalog.coaches
    .map((row) => ({
      id: row.id,
      slug: row.slug || row.id,
      name: localizePlainName(locale, row.name),
      nationality: row.nationality ? localizeCountryName(locale, row.nationality) : null,
      photoUrl: row.photoUrl,
      teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
      score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, [row.teamName || '']))),
    }))
    .filter((row) => row.score > 0 || (primaryTeam && row.teamName === primaryTeam.name))
    .sort((a, b) => b.score - a.score);

  // 4. Leagues scored in-memory (< 0.1ms)
  const leagues: SearchLeague[] = catalog.leagues
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: localizeCompetitionTitle(locale, {
        name: row.name,
        country: row.country,
        externalId: row.externalId,
      }),
      country: row.country ? localizeCountryName(locale, row.country) : null,
      logoUrl: row.logoUrl,
      externalId: row.externalId,
      score: Math.max(
        ...variants.map((q) => scoreNameHit(row.name, q, [row.country || '', localizePlainName('ar', row.name)])),
      ),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const teamIds = primaryTeam
    ? [primaryTeam.id]
    : teams.slice(0, 3).map((row) => row.id);

  const matchWhere: Prisma.MatchWhereInput = primaryPlayer
    ? { events: { some: { playerId: primaryPlayer.id } } }
    : teamIds.length
      ? { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] }
      : leagues.length
        ? { leagueId: { in: leagues.slice(0, 2).map((l) => l.id) } }
        : {};

  const matchSelect = {
    id: true,
    status: true,
    homeScore: true,
    awayScore: true,
    minute: true,
    kickoffAt: true,
    homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
    awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
    league: { select: { id: true, name: true, slug: true } },
  } as const;

  // Use top distinct query terms to prevent ILIKE combinatorial explosion
  const topVariants = [...new Set([query, ...variants])].slice(0, 2);

  const newsWhere: Prisma.NewsWhereInput = {
    AND: [
      newsVisibleWhere(locale),
      {
        OR: [
          ...topVariants.flatMap((q): Prisma.NewsWhereInput[] => [
            { title: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ]),
          ...(primaryTeam
            ? [{ entityLinks: { some: { entityType: 'TEAM', entityId: primaryTeam.id } } }]
            : []),
          ...(primaryPlayer
            ? [{ entityLinks: { some: { entityType: 'PLAYER', entityId: primaryPlayer.id } } }]
            : []),
        ],
      },
    ],
  };

  const transferWhere: Prisma.TransferWhereInput = primaryTeam
    ? {
        OR: [
          { toTeamId: primaryTeam.id },
          { fromTeamId: primaryTeam.id },
          ...topVariants.flatMap((q) => [
            { toTeam: { contains: q, mode: 'insensitive' as const } },
            { fromTeam: { contains: q, mode: 'insensitive' as const } },
          ]),
        ],
      }
    : {
        OR: topVariants.flatMap((q) => [
          { toTeam: { contains: q, mode: 'insensitive' as const } },
          { fromTeam: { contains: q, mode: 'insensitive' as const } },
        ]),
      };

  const clipOr: Prisma.YoutubeClipWhereInput[] = topVariants.map((q) => ({
    title: { contains: q, mode: 'insensitive' },
  }));

  // Fire all remaining DB queries concurrently
  const [matchRows, newsRows, transferRows, videos] = await Promise.all([
    prisma.match
      .findMany({
        where: matchWhere,
        take: 24,
        orderBy: { kickoffAt: 'desc' },
        select: matchSelect,
      })
      .catch(swallow('search.matches', [])),

    prisma.news
      .findMany({
        where: newsWhere,
        take: 20,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          publishedAt: true,
          featuredImage: true,
          category: true,
          tags: true,
          sourceName: true,
          sourceLocale: true,
          isDuplicate: true,
          originalId: true,
          entityLinks: {
            where: primaryPlayer
              ? { entityType: 'PLAYER', entityId: primaryPlayer.id }
              : primaryTeam
                ? { entityType: 'TEAM', entityId: primaryTeam.id }
                : undefined,
            select: { confirmed: true, suggested: true, entityType: true, entityId: true },
          },
        },
      })
      .catch(swallow('search.news', [])),

    prisma.transfer
      .findMany({
        where: transferWhere,
        take: 12,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          fromTeam: true,
          toTeam: true,
          date: true,
          type: true,
          fee: true,
          player: { select: { name: true, slug: true } },
        },
      })
      .catch(swallow('search.transfers', [])),

    prisma.youtubeClip
      .findMany({
        where: { status: 'PUBLISHED', OR: clipOr },
        take: 8,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, youtubeId: true, title: true, thumbnailUrl: true, publishedAt: true },
      })
      .catch(swallow('search.videos', [])),
  ]);

  const matches = matchRows.map((row) => mapMatch(row, locale));
  const split = splitMatches(matches);

  const localizedNews = await overlayNewsList(
    newsRows.map(({ content: _c, entityLinks: _e, tags: _t, isDuplicate: _d, originalId: _o, ...rest }) => rest),
    locale,
  );
  const byId = new Map(newsRows.map((row) => [row.id, row]));
  const rankedNews = localizedNews
    .map((item) => {
      const raw = byId.get(item.id);
      const links = raw?.entityLinks || [];
      const ranked = scoreNewsItem(
        {
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          content: raw?.content,
          category: item.category,
          tags: raw?.tags || [],
          publishedAt: item.publishedAt,
          isDuplicate: raw?.isDuplicate,
          originalId: raw?.originalId,
          linkedConfirmed: links.some((link) => link.confirmed),
          linkedSuggested: links.some((link) => link.suggested && !link.confirmed),
        },
        query,
        variants,
      );
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        featuredImage: item.featuredImage,
        category: item.category,
        sourceName: raw?.sourceName || null,
        why: ranked.why,
        score: ranked.score,
        originalId: raw?.originalId,
        isDuplicate: raw?.isDuplicate,
      };
    })
    .sort((a, b) => b.score - a.score || (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));

  const news = dedupeNews(rankedNews);

  const transfers: SearchTransfer[] = transferRows.map((row) => ({
    id: row.id,
    playerName: localizePlainName(locale, row.player.name),
    playerSlug: row.player.slug,
    fromTeam: row.fromTeam ? localizeTeamName(locale, row.fromTeam) : null,
    toTeam: row.toTeam ? localizeTeamName(locale, row.toTeam) : null,
    date: row.date,
    type: row.type,
    fee: row.fee,
  }));

  const photos = news.filter((row) => row.featuredImage).slice(0, 12);

  const counts = {
    matches: matches.length,
    teams: teams.length,
    players: players.length,
    coaches: coaches.length,
    leagues: leagues.length,
    news: news.length,
    videos: videos.length,
    photos: photos.length,
    transfers: transfers.length,
  };

  const slice = <T,>(rows: T[]) => {
    if (kind === 'all') return rows.slice(0, pageSize);
    return rows.slice((page - 1) * pageSize, page * pageSize);
  };

  const suggestion = teams.length || news.length || matches.length ? null : didYouMean(query);

  const result: UnifiedSearch = {
    query,
    variants,
    suggestion,
    primaryPlayer,
    primaryTeam,
    teams: slice(teams),
    players: slice(players),
    coaches: slice(coaches),
    leagues: slice(leagues),
    liveMatches: split.live,
    upcomingMatches: kind === 'all' ? split.upcoming.slice(0, 6) : slice(split.upcoming),
    recentMatches: kind === 'all' ? split.recent.slice(0, 6) : slice(split.recent),
    olderMatches: kind === 'all' ? [] : slice(split.older),
    news: slice(news),
    transfers: slice(transfers),
    videos: slice(videos),
    photos: slice(photos),
    counts,
    page,
    pageSize,
  };

  unifiedSearchCache.set(cacheKey, { at: Date.now(), data: result });
  if (unifiedSearchCache.size > 200) {
    const oldestKey = unifiedSearchCache.keys().next().value;
    if (oldestKey) unifiedSearchCache.delete(oldestKey);
  }

  return result;
});

export async function liveMatchCount() {
  return prisma.match.count({ where: LIVE_WHERE }).catch(swallow('search.live', 0));
}

const unifiedSearchCache = new Map<string, { at: number; data: UnifiedSearch }>();

export async function searchSuggestions(query: string, locale: string) {
  return quickSearchSuggestions(query, locale);
}
