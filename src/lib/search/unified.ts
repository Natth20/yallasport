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

  const variants = expandQueryVariants(query);
  const teamOr = containsOr(variants, ['name', 'officialName', 'slug']);
  const playerOr: Prisma.PlayerWhereInput[] = variants.flatMap((q) => {
    const slug = slugBit(q);
    const rows: Prisma.PlayerWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { officialName: { contains: q, mode: 'insensitive' } },
    ];
    if (slug.length >= 3) rows.push({ slug: { contains: slug, mode: 'insensitive' } });
    return rows;
  });
  const leagueOr: Prisma.LeagueWhereInput[] = variants.flatMap((q) => [
    { name: { contains: q, mode: 'insensitive' } },
    { country: { contains: q, mode: 'insensitive' } },
  ]);
  const coachOr: Prisma.CoachWhereInput[] = variants.flatMap((q) => [
    { name: { contains: q, mode: 'insensitive' } },
  ]);

  const [teamRows, playerRows, leagueRows, coachRows] = await Promise.all([
    prisma.team
      .findMany({
        where: { OR: teamOr },
        take: 40,
        select: {
          id: true,
          slug: true,
          name: true,
          officialName: true,
          logoUrl: true,
          externalId: true,
          standings: {
            orderBy: { seasonId: 'desc' },
            take: 1,
            select: { league: { select: { name: true, country: true, externalId: true } } },
          },
        },
      })
      .catch(swallow('search.teams', [])),
    prisma.player
      .findMany({
        where: { OR: playerOr },
        take: 40,
        select: {
          id: true,
          slug: true,
          name: true,
          officialName: true,
          photoUrl: true,
          position: true,
          nationality: true,
          teams: {
            where: { to: null },
            take: 1,
            select: { team: { select: { name: true } } },
          },
        },
      })
      .catch(swallow('search.players', [])),
    prisma.league
      .findMany({
        where: { OR: leagueOr },
        take: 20,
        select: { id: true, slug: true, name: true, logoUrl: true, country: true, externalId: true },
      })
      .catch(swallow('search.leagues', [])),
    prisma.coach
      .findMany({
        where: { OR: coachOr },
        take: 16,
        select: {
          id: true,
          slug: true,
          name: true,
          photoUrl: true,
          nationality: true,
          currentTeam: { select: { name: true } },
          team: { select: { name: true } },
        },
      })
      .catch(swallow('search.coaches', [])),
  ]);

  const teams: SearchTeam[] = teamRows
    .map((row) => {
      const standing = row.standings[0]?.league;
      const extras = [row.officialName || '', localizeTeamName('ar', row.name), localizeTeamName('en', row.name)];
      return {
        id: row.id,
        slug: row.slug,
        name: localizeTeamName(locale, row.name),
        englishName: row.officialName || row.name,
        country: standing?.country ? localizeCountryName(locale, standing.country) : null,
        leagueName: standing
          ? localizeCompetitionTitle(locale, {
            name: standing.name,
            country: standing.country,
            externalId: standing.externalId,
          })
          : null,
        logoUrl: row.logoUrl,
        externalId: row.externalId,
        score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, extras))),
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  let players: SearchPlayer[] = playerRows
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
        teamName: row.teams[0]?.team.name ? localizeTeamName(locale, row.teams[0].team.name) : null,
        score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, extras))),
      };
    })
    .sort((a, b) => b.score - a.score);

  if (players.length === 0) {
    const remote = await searchPlayers(query, locale).catch(swallow('search.players.remote', []));
    players = remote.map((row) => ({
      id: row.slug,
      slug: row.slug,
      name: row.name,
      englishName: row.name,
      position: null,
      nationality: null,
      photoUrl: row.photoUrl,
      teamName: row.teamName,
      score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, [row.slug]))),
    }));
  }

  const primaryPlayer = players[0] && players[0].score >= 44 ? players[0] : null;
  const primaryTeam =
    teams[0] && teams[0].score >= 58 && (!primaryPlayer || teams[0].score > primaryPlayer.score + 8)
      ? teams[0]
      : null;

  if (primaryTeam && !primaryPlayer && (kind === 'all' || kind === 'players') && players.length < 8) {
    const squad = await prisma.playerTeam
      .findMany({
        where: { teamId: primaryTeam.id, to: null },
        take: 16,
        select: {
          player: {
            select: {
              id: true,
              slug: true,
              name: true,
              officialName: true,
              photoUrl: true,
              position: true,
              nationality: true,
            },
          },
        },
      })
      .catch(swallow('search.squad', []));
    const seen = new Set(players.map((row) => row.id));
    for (const row of squad) {
      if (seen.has(row.player.id)) continue;
      seen.add(row.player.id);
      players.push({
        id: row.player.id,
        slug: row.player.slug,
        name: localizePlainName(locale, row.player.name),
        englishName: row.player.officialName || row.player.name,
        position: row.player.position ? localizePlainName(locale, row.player.position) : null,
        nationality: row.player.nationality ? localizeCountryName(locale, row.player.nationality) : null,
        photoUrl: row.player.photoUrl,
        teamName: primaryTeam.name,
        score: 36,
      });
    }
  }

  const coaches: SearchCoach[] = coachRows
    .map((row) => ({
      id: row.id,
      slug: row.slug || row.id,
      name: localizePlainName(locale, row.name),
      nationality: row.nationality ? localizeCountryName(locale, row.nationality) : null,
      photoUrl: row.photoUrl,
      teamName: localizeTeamName(locale, row.currentTeam?.name || row.team?.name || '') || null,
      score: Math.max(...variants.map((q) => scoreNameHit(row.name, q, [row.currentTeam?.name || '', row.team?.name || '']))),
    }))
    .filter((row) => row.score > 0 || (primaryTeam && row.teamName === primaryTeam.name))
    .sort((a, b) => b.score - a.score);

  if (primaryTeam && coaches.length === 0) {
    const clubCoach = await prisma.coach
      .findFirst({
        where: { OR: [{ currentTeamId: primaryTeam.id }, { team: { id: primaryTeam.id } }] },
        select: {
          id: true,
          slug: true,
          name: true,
          photoUrl: true,
          nationality: true,
          currentTeam: { select: { name: true } },
          team: { select: { name: true } },
        },
      })
      .catch(swallow('search.clubCoach', null));
    if (clubCoach) {
      coaches.push({
        id: clubCoach.id,
        slug: clubCoach.slug || clubCoach.id,
        name: localizePlainName(locale, clubCoach.name),
        nationality: clubCoach.nationality ? localizeCountryName(locale, clubCoach.nationality) : null,
        photoUrl: clubCoach.photoUrl,
        teamName: primaryTeam.name,
        score: 40,
      });
    }
  }

  const leagues: SearchLeague[] = leagueRows
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

  let playerClubId: string | null = null;
  if (primaryPlayer) {
    const filed = await prisma.player
      .findFirst({
        where: { OR: [{ id: primaryPlayer.id }, { slug: primaryPlayer.slug }] },
        select: { id: true, teams: { where: { to: null }, take: 1, select: { teamId: true } } },
      })
      .catch(swallow('search.playerClub', null));
    if (filed) {
      primaryPlayer.id = filed.id;
      playerClubId = filed.teams[0]?.teamId || null;
    }
  }

  const teamIds = primaryTeam
    ? [primaryTeam.id]
    : playerClubId
      ? [playerClubId]
      : teams.slice(0, 3).map((row) => row.id);
  const matchWhere: Prisma.MatchWhereInput = primaryPlayer
    ? {
        OR: [
          { events: { some: { playerId: primaryPlayer.id } } },
          ...(playerClubId ? [{ homeTeamId: playerClubId }, { awayTeamId: playerClubId }] : []),
        ],
      }
    : teamIds.length
      ? { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] }
      : {
          OR: [
            { homeTeam: { OR: teamOr } },
            { awayTeam: { OR: teamOr } },
            { league: { OR: leagueOr } },
          ],
        };

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

  const matchRows = await prisma.match
    .findMany({
      where: matchWhere,
      take: 80,
      orderBy: { kickoffAt: 'desc' },
      select: matchSelect,
    })
    .catch(swallow('search.matches', []));

  const matches = matchRows.map((row) => mapMatch(row, locale));
  const split = splitMatches(matches);

  const newsWhere: Prisma.NewsWhereInput = {
    AND: [
      newsVisibleWhere(locale),
      {
        OR: [
          ...variants.flatMap((q): Prisma.NewsWhereInput[] => [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
            { category: { contains: q, mode: 'insensitive' } },
            {
              translations: {
                some: {
                  locale,
                  status: 'APPROVED',
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { excerpt: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
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

  const newsRows = await prisma.news
    .findMany({
      where: newsWhere,
      take: 40,
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
    .catch(swallow('search.news', []));

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

  const transferWhere: Prisma.TransferWhereInput = primaryTeam
    ? {
      OR: [
        { toTeamId: primaryTeam.id },
        { fromTeamId: primaryTeam.id },
        ...variants.flatMap((q) => [
          { toTeam: { contains: q, mode: 'insensitive' as const } },
          { fromTeam: { contains: q, mode: 'insensitive' as const } },
        ]),
      ],
    }
    : {
      OR: variants.flatMap((q) => [
        { toTeam: { contains: q, mode: 'insensitive' as const } },
        { fromTeam: { contains: q, mode: 'insensitive' as const } },
      ]),
    };

  const transferRows = await prisma.transfer
    .findMany({
      where: transferWhere,
      take: 20,
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
    .catch(swallow('search.transfers', []));

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

  const clipOr: Prisma.YoutubeClipWhereInput[] = variants.map((q) => ({
    title: { contains: q, mode: 'insensitive' },
  }));
  const videos = await prisma.youtubeClip
    .findMany({
      where: { status: 'PUBLISHED', OR: clipOr },
      take: 12,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, youtubeId: true, title: true, thumbnailUrl: true, publishedAt: true },
    })
    .catch(swallow('search.videos', []));

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

  return {
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
});

export async function liveMatchCount() {
  return prisma.match.count({ where: LIVE_WHERE }).catch(swallow('search.live', 0));
}

export async function searchSuggestions(query: string, locale: string) {
  const pack = await runUnifiedSearch({ locale, query, kind: 'all' });
  const rows: Array<{ label: string; typeKey: string; url: string; photoUrl?: string | null }> = [];
  for (const row of pack.teams.slice(0, 4)) {
    rows.push({ label: row.name, typeKey: 'team', url: `/team/${row.slug}`, photoUrl: row.logoUrl });
  }
  for (const row of pack.players.slice(0, 3)) {
    rows.push({ label: row.name, typeKey: 'player', url: `/player/${row.slug}`, photoUrl: row.photoUrl });
  }
  for (const row of pack.coaches.slice(0, 2)) {
    rows.push({ label: row.name, typeKey: 'coach', url: `/coach/${row.slug}`, photoUrl: row.photoUrl });
  }
  for (const row of pack.leagues.slice(0, 2)) {
    rows.push({ label: row.name, typeKey: 'league', url: `/league/${row.slug}`, photoUrl: row.logoUrl });
  }
  for (const row of pack.news.slice(0, 2)) {
    rows.push({ label: row.title, typeKey: 'news', url: `/news/${row.slug}`, photoUrl: row.featuredImage });
  }
  return rows;
}
