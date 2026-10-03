import { swallow } from '@/lib/ops/caught';
import { cache } from 'react';
import 'server-only';

import { prisma } from '@/lib/prisma';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { walkLocalizeNames } from '@/lib/i18n/sports-lexicon';
import { dayBoundsInTimezone, dateKeyInTimezone } from '@/lib/datetime/format';
import { NEWS_DESKS, DEFAULT_DESK } from '@/lib/news/desks';
import { newsFreshSince } from '@/lib/news/freshness';
import { rotateStart } from '@/lib/front/rotate-shelf';
import { MATCH_ARCHIVE_AFTER_MS, belongsOnTodayBoard, todayOrLiveWhere } from '@/lib/sports-data/match-window';
import type { Prisma } from '@/generated/prisma';

/**
 * Everything the /news page renders, loaded in one place.
 *
 * The page is a front page, not a list: alongside the stories it carries the
 * pitch, the tables, the goals and the broadcast grid. Keeping the reads here
 * means the page file stays presentation, and every panel can be traced back to
 * a real row rather than a hardcoded sample.
 */

export const NEWS_PAGE_SIZE = 36;

const storySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  ogImage: true,
  category: true,
  publishedAt: true,
  isPremium: true,
  breaking: true,
  featured: true,
  readingTime: true,
  views: true,
  sourceName: true,
  sourceUrl: true,
  sourceLocale: true,
  tags: true,
  author: { select: { name: true } },
} satisfies Prisma.NewsSelect;

const briefSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  views: true,
  featuredImage: true,
  ogImage: true,
  breaking: true,
  publishedAt: true,
  sourceName: true,
  sourceLocale: true,
  readingTime: true,
} satisfies Prisma.NewsSelect;

export type Story = Prisma.NewsGetPayload<{ select: typeof storySelect }>;
export type Brief = Prisma.NewsGetPayload<{ select: typeof briefSelect }>;

export type PitchMatch = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date;
  homeTeam: { name: string; slug: string; logoUrl: string | null };
  awayTeam: { name: string; slug: string; logoUrl: string | null };
  league: { name: string; slug: string; logoUrl: string | null } | null;
};

export type DeskChip = { key: string; label: string; count: number };
export type SourceTally = { name: string; count: number; locales: string[] };
export type TeamInNews = { id: string; name: string; slug: string; logoUrl: string | null; count: number };

export type TableSnapshot = {
  league: { id: string; name: string; slug: string; logoUrl: string | null; country: string | null };
  rows: Array<{
    rank: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    team: { name: string; slug: string; logoUrl: string | null };
  }>;
};

export type GoalMoment = {
  id: string;
  minute: number;
  extraMinute: number | null;
  playerName: string | null;
  assistName: string | null;
  detail: string | null;
  type: string;
  matchId: string;
  kickoffAt: Date;
  scoringTeam: { name: string; slug: string; logoUrl: string | null } | null;
  homeTeam: { name: string; slug: string };
  awayTeam: { name: string; slug: string };
  homeScore: number | null;
  awayScore: number | null;
};

export type Broadcast = {
  matchId: string;
  kickoffAt: Date;
  status: string;
  homeTeam: { name: string; slug: string; logoUrl: string | null };
  awayTeam: { name: string; slug: string; logoUrl: string | null };
  league: { name: string; slug: string } | null;
  channels: Array<{ id: string; name: string; logoUrl: string | null; country: string | null }>;
};

export type ArchiveDay = { key: string; date: Date; count: number };

export type DeskStats = {
  stories: number;
  sources: number;
  desks: number;
  todayCount: number;
  weekCount: number;
  latestAt: Date | null;
  totalReadingTime: number;
};

export type NewsDeskData = {
  page: number;
  totalPages: number;
  total: number;
  filtered: boolean;
  query: string;
  selectedDesk: string;
  selectedSource: string;
  lead: Story | null;
  subLeads: Story[];
  rest: Story[];
  breaking: Brief | null;
  deskChips: DeskChip[];
  sources: SourceTally[];
  mostRead: Brief[];
  freshest: Brief[];
  sameDesk: Brief[];
  weekFile: Brief[];
  pitch: PitchMatch[];
  liveCount: number;
  tables: TableSnapshot[];
  goals: GoalMoment[];
  broadcasts: Broadcast[];
  teamsInNews: TeamInNews[];
  archive: ArchiveDay[];
  stats: DeskStats;
};

export type NewsDeskParams = {
  locale: string;
  timezone: string;
  query: string;
  desk: string;
  source: string;
  page: number;
  day?: string;
};

/** Free-text search across the source row and its approved translation. */
function searchClause(query: string, locale: string): Prisma.NewsWhereInput[] {
  if (!query) return [];
  return [
    {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
        {
          translations: {
            some: {
              locale,
              status: 'APPROVED',
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        },
      ],
    },
  ];
}

export const loadNewsDesk = cache(async function loadNewsDesk({
  locale,
  timezone,
  query,
  desk,
  source,
  page,
  day,
}: NewsDeskParams): Promise<NewsDeskData> {
  const now = new Date();
  const { start, end } = dayBoundsInTimezone(dateKeyInTimezone(now, timezone), timezone);
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const archiveDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  const archiveBounds = archiveDay ? dayBoundsInTimezone(archiveDay, timezone) : null;
  const freshSince = newsFreshSince(now);

  const visible = newsVisibleWhere(locale);
  const listingScope: Prisma.NewsWhereInput = archiveBounds
    ? { publishedAt: { gte: archiveBounds.start, lt: archiveBounds.end } }
    : {};
  const where: Prisma.NewsWhereInput = {
    AND: [
      visible,
      listingScope,
      ...searchClause(query, locale),
      ...(desk !== 'all' ? [{ category: desk }] : []),
      ...(source !== 'all' ? [{ sourceName: source }] : []),
    ],
  };
  const [
    articles,
    total,
    extras,
    deskGroups,
    sourceGroups,
    archiveRows,
    readingAgg,
  ] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: storySelect,
    }),
    prisma.news.count({ where }),
    prisma.news.findMany({
      where: { AND: [visible, { publishedAt: { gte: weekAgo } }] },
      orderBy: { publishedAt: 'desc' },
      take: 120,
      select: briefSelect,
    }),
    prisma.news.groupBy({ by: ['category'], where: visible, _count: { _all: true } }),
    prisma.news.groupBy({ by: ['sourceName', 'sourceLocale'], where: visible, _count: { _all: true } }),
    prisma.news.findMany({
      where: { AND: [visible, { publishedAt: { gte: weekAgo } }] },
      select: { publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.news.aggregate({ where: visible, _sum: { readingTime: true }, _max: { publishedAt: true } }),
  ]);

  const localized = (await overlayNewsList(articles, locale)) as Story[];
  const localizedExtras = (await overlayNewsList(extras, locale)) as Brief[];

  // ── front page slots ──────────────────────────────────────────────────────
  const onFirstPage = page === 1;
  const filed = localized.filter((story) => story.category !== DEFAULT_DESK.key);
  const catchAll = localized.filter((story) => story.category === DEFAULT_DESK.key);
  const stacked = filed.length > 0 ? [...filed, ...catchAll] : localized;
  const front = onFirstPage && !query && desk === 'all' ? rotateStart(stacked, 1) : stacked;
  const lead = onFirstPage ? front[0] ?? null : null;
  const subLeads = onFirstPage ? front.slice(1, 4) : [];
  const rest = onFirstPage ? front.slice(4) : localized;
  const breaking =
    localizedExtras.find(
      (entry) =>
        entry.breaking &&
        entry.id !== lead?.id &&
        entry.publishedAt &&
        entry.publishedAt >= freshSince,
    ) ?? null;
  const sameDesk = lead
    ? localizedExtras.filter((entry) => entry.category === lead.category && entry.id !== lead.id).slice(0, 8)
    : [];

  // ── desk + source indexes ─────────────────────────────────────────────────
  const deskOrder = new Map(NEWS_DESKS.map((entry, index) => [entry.key, index]));
  const deskChips: DeskChip[] = deskGroups
    .map((row) => ({ key: row.category, label: row.category, count: row._count._all }))
    .sort((a, b) => {
      const rank = (key: string) => deskOrder.get(key) ?? (key === DEFAULT_DESK.key ? 900 : 500);
      return rank(a.key) - rank(b.key) || b.count - a.count;
    });

  const sourceMap = new Map<string, SourceTally>();
  for (const row of sourceGroups) {
    const name = row.sourceName?.trim();
    if (!name) continue;
    const entry = sourceMap.get(name) ?? { name, count: 0, locales: [] };
    entry.count += row._count._all;
    if (!entry.locales.includes(row.sourceLocale)) entry.locales.push(row.sourceLocale);
    sourceMap.set(name, entry);
  }
  const sources = [...sourceMap.values()].sort((a, b) => b.count - a.count);

  // ── archive ───────────────────────────────────────────────────────────────
  const dayCounts = new Map<string, { date: Date; count: number }>();
  for (const row of archiveRows) {
    if (!row.publishedAt) continue;
    const key = dateKeyInTimezone(row.publishedAt, timezone);
    const entry = dayCounts.get(key);
    if (entry) entry.count += 1;
    else dayCounts.set(key, { date: row.publishedAt, count: 1 });
  }
  const archive: ArchiveDay[] = [...dayCounts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);

  const todayKey = dateKeyInTimezone(now, timezone);
  const stats: DeskStats = {
    stories: deskGroups.reduce((sum, row) => sum + row._count._all, 0),
    sources: sources.length,
    desks: deskChips.length,
    todayCount: archive.find((day) => day.key === todayKey)?.count ?? 0,
    weekCount: archiveRows.length,
    latestAt: readingAgg._max.publishedAt,
    totalReadingTime: readingAgg._sum.readingTime ?? 0,
  };

  return {
    page,
    totalPages: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)),
    total,
    filtered: Boolean(query || desk !== 'all' || source !== 'all' || archiveDay),
    query,
    selectedDesk: desk,
    selectedSource: source,
    lead,
    subLeads,
    rest,
    breaking,
    deskChips,
    sources,
    mostRead: [...localizedExtras].sort((a, b) => b.views - a.views).slice(0, 6),
    freshest: localizedExtras.slice(0, 10),
    sameDesk,
    weekFile: localizedExtras,
    pitch: [],
    liveCount: 0,
    tables: [],
    goals: [],
    broadcasts: [],
    teamsInNews: [],
    archive,
    stats,
  };
});

export const loadNewsSidecars = cache(async function loadNewsSidecars({
  locale,
  timezone,
}: Pick<NewsDeskParams, 'locale' | 'timezone'>): Promise<
  Pick<NewsDeskData, 'pitch' | 'liveCount' | 'tables' | 'goals' | 'broadcasts' | 'teamsInNews'>
> {
  const now = new Date();
  const { start, end } = dayBoundsInTimezone(dateKeyInTimezone(now, timezone), timezone);
  const isLive = (status: string) => status === 'LIVE' || status === 'HALFTIME';

  const [pitchRows, standingLeagues, recentMatches, broadcastRows, teamLinkGroups] = await Promise.all([
    prisma.match
      .findMany({
        where: todayOrLiveWhere(start, end, now),
        orderBy: [{ kickoffAt: 'desc' }],
        take: 14,
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          minute: true,
          kickoffAt: true,
          homeTeam: { select: { name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { name: true, slug: true, logoUrl: true } },
          league: { select: { name: true, slug: true, logoUrl: true } },
        },
      })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.pitch', [] as PitchMatch[])),
    prisma.standing
      .groupBy({ by: ['leagueId'], _count: { _all: true }, orderBy: { _count: { leagueId: 'desc' } }, take: 3 })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.standings', [])),
    prisma.match
      .findMany({
        where: {
          status: { in: ['LIVE', 'HALFTIME', 'FINISHED'] },
          kickoffAt: { gte: new Date(now.getTime() - MATCH_ARCHIVE_AFTER_MS) },
          events: { some: { type: 'GOAL' } },
        },
        orderBy: { kickoffAt: 'desc' },
        take: 12,
        select: {
          id: true,
          kickoffAt: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          events: {
            where: { type: 'GOAL' },
            orderBy: { minute: 'desc' },
            take: 3,
            select: {
              id: true,
              minute: true,
              extraMinute: true,
              playerName: true,
              assistName: true,
              detail: true,
              type: true,
              teamId: true,
            },
          },
        },
      })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.goals', [])),
    prisma.match
      .findMany({
        where: { kickoffAt: { gte: start, lt: end }, channels: { some: {} } },
        orderBy: { kickoffAt: 'asc' },
        take: 8,
        select: {
          id: true,
          kickoffAt: true,
          status: true,
          homeTeam: { select: { name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { name: true, slug: true, logoUrl: true } },
          league: { select: { name: true, slug: true } },
          channels: {
            take: 4,
            select: { channel: { select: { id: true, name: true, logoUrl: true, country: true } } },
          },
        },
      })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.broadcasts', [])),
    prisma.newsEntityLink
      .groupBy({
        by: ['entityId'],
        where: { entityType: 'TEAM' },
        _count: { _all: true },
        orderBy: { _count: { entityId: 'desc' } },
        take: 12,
      })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.teams', [])),
  ]);

  const pitch = (pitchRows as PitchMatch[])
    .filter((match) => belongsOnTodayBoard(match, start, end, now))
    .sort((a, b) => {
      const liveDelta = Number(isLive(b.status)) - Number(isLive(a.status));
      if (liveDelta) return liveDelta;
      return b.kickoffAt.getTime() - a.kickoffAt.getTime();
    })
    .slice(0, 10);

  const leagueIds = standingLeagues.map((row) => row.leagueId);
  const tables: TableSnapshot[] = [];
  if (leagueIds.length > 0) {
    const [leagues, rows] = await Promise.all([
      prisma.league.findMany({
        where: { id: { in: leagueIds } },
        select: { id: true, name: true, slug: true, logoUrl: true, country: true },
      }),
      prisma.standing.findMany({
        where: { leagueId: { in: leagueIds } },
        orderBy: [{ leagueId: 'asc' }, { rank: 'asc' }],
        select: {
          leagueId: true,
          rank: true,
          played: true,
          won: true,
          drawn: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          points: true,
          team: { select: { name: true, slug: true, logoUrl: true } },
        },
      }),
    ]);
    const byLeague = new Map(leagues.map((entry) => [entry.id, entry]));
    for (const leagueId of leagueIds) {
      const league = byLeague.get(leagueId);
      if (!league) continue;
      const leagueRows = rows.filter((row) => row.leagueId === leagueId).slice(0, 6);
      if (leagueRows.length === 0) continue;
      tables.push({ league, rows: leagueRows });
    }
  }

  const goals: GoalMoment[] = [];
  for (const match of recentMatches) {
    for (const event of match.events) {
      const scoringTeam =
        event.teamId === match.homeTeam.id
          ? match.homeTeam
          : event.teamId === match.awayTeam.id
            ? match.awayTeam
            : null;
      goals.push({
        id: event.id,
        minute: event.minute,
        extraMinute: event.extraMinute,
        playerName: event.playerName,
        assistName: event.assistName,
        detail: event.detail,
        type: event.type,
        matchId: match.id,
        kickoffAt: match.kickoffAt,
        scoringTeam,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      });
    }
  }
  goals.sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime() || b.minute - a.minute);

  const broadcasts: Broadcast[] = broadcastRows.map((match) => ({
    matchId: match.id,
    kickoffAt: match.kickoffAt,
    status: match.status,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    channels: match.channels.map((row) => row.channel),
  }));

  let teamsInNews: TeamInNews[] = [];
  if (teamLinkGroups.length > 0) {
    const teams = await prisma.team.findMany({
      where: { id: { in: teamLinkGroups.map((row) => row.entityId) } },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    const counts = new Map(teamLinkGroups.map((row) => [row.entityId, row._count._all]));
    teamsInNews = teams
      .map((team) => ({ ...team, count: counts.get(team.id) ?? 0 }))
      .filter((team) => {
        const label = team.name.trim();
        if (!label) return false;
        if (/^TB\s*\d+/i.test(label)) return false;
        if (/^[A-Z0-9._-]{1,6}$/.test(label)) return false;
        if (/^\d+$/.test(label)) return false;
        return Boolean(team.slug && !/^[0-9]+$/.test(team.slug));
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  walkLocalizeNames(locale, pitch);
  walkLocalizeNames(locale, tables);
  walkLocalizeNames(locale, goals);
  walkLocalizeNames(locale, broadcasts);
  walkLocalizeNames(locale, teamsInNews);

  return {
    pitch,
    liveCount: pitch.filter((match) => isLive(match.status)).length,
    tables,
    goals: goals.slice(0, 8),
    broadcasts,
    teamsInNews,
  };
});
