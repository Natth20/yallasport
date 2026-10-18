import { swallow } from '@/lib/ops/caught';
import { cache } from 'react';
import 'server-only';

import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
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
  mostReadToday: Brief[];
  mostReadWeek: Brief[];
  mostReadMonth: Brief[];
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

export const EMPTY_NEWS_SIDECARS: Pick<
  NewsDeskData,
  'pitch' | 'liveCount' | 'tables' | 'goals' | 'broadcasts' | 'teamsInNews'
> = {
  pitch: [],
  liveCount: 0,
  tables: [],
  goals: [],
  broadcasts: [],
  teamsInNews: [],
};

export const EMPTY_NEWS_DESK_DATA: NewsDeskData = {
  page: 1,
  totalPages: 1,
  total: 0,
  filtered: false,
  query: '',
  selectedDesk: 'all',
  selectedSource: 'all',
  lead: null,
  subLeads: [],
  rest: [],
  breaking: null,
  deskChips: [],
  sources: [],
  mostRead: [],
  mostReadToday: [],
  mostReadWeek: [],
  mostReadMonth: [],
  freshest: [],
  sameDesk: [],
  weekFile: [],
  ...EMPTY_NEWS_SIDECARS,
  archive: [],
  stats: {
    stories: 0,
    sources: 0,
    desks: 0,
    todayCount: 0,
    weekCount: 0,
    latestAt: null,
    totalReadingTime: 0,
  },
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

async function loadNewsAggregates() {
  return cachedJson('news:aggregates:v2', 600, async () => {
    const [deskGroups, sourceGroups, readingAgg] = await Promise.all([
      prisma.news
        .groupBy({ by: ['category'], where: { status: 'PUBLISHED' }, _count: { _all: true } })
        .catch(swallow('loadNewsDesk.deskGroups', [] as Array<{ category: string; _count: { _all: number } }>)),
      prisma.news
        .groupBy({ by: ['sourceName', 'sourceLocale'], where: { status: 'PUBLISHED' }, _count: { _all: true } })
        .catch(
          swallow(
            'loadNewsDesk.sourceGroups',
            [] as Array<{ sourceName: string | null; sourceLocale: string | null; _count: { _all: number } }>
          )
        ),
      prisma.news
        .aggregate({ where: { status: 'PUBLISHED' }, _sum: { readingTime: true }, _max: { publishedAt: true } })
        .catch(
          swallow('loadNewsDesk.readingAgg', {
            _sum: { readingTime: 0 },
            _max: { publishedAt: null },
          })
        ),
    ]);
    return { deskGroups, sourceGroups, readingAgg };
  });
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
  const cacheKey = `news:desk:v5:${locale}:${timezone}:${desk}:${source}:${page}:${day || 'live'}:${query || '_'}`;
  return cachedJson(cacheKey, 120, async () => {
    const now = new Date();
    const { start, end } = dayBoundsInTimezone(dateKeyInTimezone(now, timezone), timezone);
    const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 864e5);
    const monthAgo = new Date(now.getTime() - 30 * 864e5);
    const archiveDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
    const archiveBounds = archiveDay ? dayBoundsInTimezone(archiveDay, timezone) : null;
    const freshSince = newsFreshSince(now);

  const visible = newsVisibleWhere(locale);
  const listingScope: Prisma.NewsWhereInput = archiveBounds
    ? { publishedAt: { gte: archiveBounds.start, lt: archiveBounds.end } }
    : {};
  const cleanDesk = desk.trim();
  const matchedDesk = NEWS_DESKS.find(
    (d) =>
      d.key.toLowerCase() === cleanDesk.toLowerCase() ||
      d.ar === cleanDesk ||
      d.en.toLowerCase() === cleanDesk.toLowerCase()
  );
  const resolvedDesk = matchedDesk ? matchedDesk.key : cleanDesk;

  const where: Prisma.NewsWhereInput = {
    AND: [
      visible,
      listingScope,
      ...searchClause(query, locale),
      ...(cleanDesk !== 'all'
        ? [
            {
              OR: [
                { category: resolvedDesk },
                { category: cleanDesk },
                { tags: { has: cleanDesk } },
              ],
            },
          ]
        : []),
      ...(source !== 'all'
        ? [
            {
              OR: [
                { sourceName: { equals: source, mode: 'insensitive' as const } },
                { sourceName: { contains: source, mode: 'insensitive' as const } },
              ],
            },
          ]
        : []),
    ],
  };
  const [
    articles,
    total,
    extras,
    todayMostReadRows,
    monthMostReadRows,
    archiveRows,
    aggregates,
  ] = await Promise.all([
    prisma.news
      .findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }],
        skip: (page - 1) * NEWS_PAGE_SIZE,
        take: NEWS_PAGE_SIZE,
        select: storySelect,
      })
      .catch(swallow('loadNewsDesk.articles', [] as Story[])),
    prisma.news.count({ where }).catch(swallow('loadNewsDesk.total', 0)),
    prisma.news
      .findMany({
        where: { AND: [visible, { publishedAt: { gte: weekAgo } }] },
        orderBy: { publishedAt: 'desc' },
        take: 36,
        select: briefSelect,
      })
      .catch(swallow('loadNewsDesk.extras', [] as Brief[])),
    prisma.news
      .findMany({
        where: { AND: [visible, { publishedAt: { gte: dayAgo } }] },
        orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
        select: briefSelect,
      })
      .catch(swallow('loadNewsDesk.todayMostReadRows', [] as Brief[])),
    prisma.news
      .findMany({
        where: { AND: [visible, { publishedAt: { gte: monthAgo } }] },
        orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
        select: briefSelect,
      })
      .catch(swallow('loadNewsDesk.monthMostReadRows', [] as Brief[])),
    prisma.news
      .findMany({
        where: { status: 'PUBLISHED', publishedAt: { gte: weekAgo } },
        select: { publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 60,
      })
      .catch(swallow('loadNewsDesk.archiveRows', [] as Array<{ publishedAt: Date | null }>)),
    loadNewsAggregates(),
  ]);

  const safeArticles = articles ?? [];
  const safeExtras = extras ?? [];
  const safeToday = todayMostReadRows ?? [];
  const safeMonth = monthMostReadRows ?? [];
  const safeDeskGroups = aggregates?.deskGroups ?? [];
  const safeSourceGroups = aggregates?.sourceGroups ?? [];
  const safeArchiveRows = archiveRows ?? [];
  const readingAgg = aggregates?.readingAgg ?? { _sum: { readingTime: 0 }, _max: { publishedAt: null } };

  // Single batched translation call for all items
  const allRawItems = [...safeArticles, ...safeExtras, ...safeToday, ...safeMonth];
  const uniqueItemsMap = new Map<string, typeof allRawItems[number]>();
  for (const item of allRawItems) {
    if (item && item.id && !uniqueItemsMap.has(item.id)) {
      uniqueItemsMap.set(item.id, item);
    }
  }
  const translatedList = await overlayNewsList(Array.from(uniqueItemsMap.values()), locale);
  const localizedMap = new Map(translatedList.map((item) => [item.id, item]));

  const localized = safeArticles.map((item) => (localizedMap.get(item.id) ?? item) as Story);
  const localizedExtras = safeExtras.map((item) => (localizedMap.get(item.id) ?? item) as Brief);
  const localizedToday = safeToday.map((item) => (localizedMap.get(item.id) ?? item) as Brief);
  const localizedMonth = safeMonth.map((item) => (localizedMap.get(item.id) ?? item) as Brief);

  const mostReadWeek = [...localizedExtras].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 6);
  const mostReadToday = localizedToday.length >= 6
    ? localizedToday.slice(0, 6)
    : [...localizedToday, ...mostReadWeek.filter((w) => !localizedToday.some((t) => t.id === w.id))].slice(0, 6);
  const mostReadMonth = localizedMonth.length >= 6
    ? localizedMonth.slice(0, 6)
    : [...localizedMonth, ...mostReadWeek.filter((w) => !localizedMonth.some((m) => m.id === w.id))].slice(0, 6);

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
  const deskChips: DeskChip[] = safeDeskGroups
    .map((row) => ({ key: row.category, label: row.category, count: row._count?._all ?? 0 }))
    .sort((a, b) => {
      const rank = (key: string) => deskOrder.get(key) ?? (key === DEFAULT_DESK.key ? 900 : 500);
      return rank(a.key) - rank(b.key) || b.count - a.count;
    });

  const sourceMap = new Map<string, SourceTally>();
  for (const row of safeSourceGroups) {
    const name = row.sourceName?.trim();
    if (!name) continue;
    const entry = sourceMap.get(name) ?? { name, count: 0, locales: [] };
    entry.count += row._count?._all ?? 0;
    if (row.sourceLocale && !entry.locales.includes(row.sourceLocale)) {
      entry.locales.push(row.sourceLocale);
    }
    sourceMap.set(name, entry);
  }
  const sources = [...sourceMap.values()].sort((a, b) => b.count - a.count);

  // ── archive ───────────────────────────────────────────────────────────────
  const dayCounts = new Map<string, { date: Date; count: number }>();
  for (const row of safeArchiveRows) {
    if (!row.publishedAt) continue;
    const key = dateKeyInTimezone(row.publishedAt, timezone);
    const entry = dayCounts.get(key);
    if (entry) entry.count += 1;
    else dayCounts.set(key, { date: row.publishedAt, count: 1 });
  }
  const archive: ArchiveDay[] = [...dayCounts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  let storyCount = 0;
  for (const row of safeDeskGroups) {
    storyCount += row._count?._all ?? 0;
  }

  const todayKey = dateKeyInTimezone(now, timezone);
  const stats: DeskStats = {
    stories: storyCount,
    sources: sources.length,
    desks: deskChips.length,
    todayCount: archive.find((day) => day.key === todayKey)?.count ?? 0,
    weekCount: safeArchiveRows.length,
    latestAt: readingAgg?._max?.publishedAt ?? null,
    totalReadingTime: readingAgg?._sum?.readingTime ?? 0,
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
    mostRead: mostReadWeek,
    mostReadToday,
    mostReadWeek,
    mostReadMonth,
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
});

export const loadNewsSidecars = cache(async function loadNewsSidecars({
  locale,
  timezone,
}: Pick<NewsDeskParams, 'locale' | 'timezone'>): Promise<
  Pick<NewsDeskData, 'pitch' | 'liveCount' | 'tables' | 'goals' | 'broadcasts' | 'teamsInNews'>
> {
  const cacheKey = `news:sidecars:v5:${locale}:${timezone}`;
  return cachedJson(cacheKey, 120, async () => {
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
    cachedJson('news:sidecars:standings:leagues', 600, () =>
      prisma.standing
        .groupBy({ by: ['leagueId'], _count: { _all: true }, orderBy: { _count: { leagueId: 'desc' } }, take: 3 })
        .catch(swallow('src/lib/news/load-desk.ts:sidecars.standings', []))
    ),
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
    cachedJson('news:sidecars:teams:top', 600, () =>
      prisma.newsEntityLink
        .groupBy({
          by: ['entityId'],
          where: { entityType: 'TEAM' },
          _count: { _all: true },
          orderBy: { _count: { entityId: 'desc' } },
          take: 12,
        })
        .catch(swallow('src/lib/news/load-desk.ts:sidecars.teams', []))
    ),
  ]);

  const pitch = (pitchRows as PitchMatch[])
    .filter((match) => belongsOnTodayBoard(match, start, end, now))
    .sort((a, b) => {
      const liveDelta = Number(isLive(b.status)) - Number(isLive(a.status));
      if (liveDelta) return liveDelta;
      return new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime();
    })
    .slice(0, 10);

  const leagueIds = (standingLeagues ?? []).map((row) => row.leagueId);
  const tables: TableSnapshot[] = [];
  if (leagueIds.length > 0) {
    const [leagues, rows] = await Promise.all([
      prisma.league
        .findMany({
          where: { id: { in: leagueIds } },
          select: { id: true, name: true, slug: true, logoUrl: true, country: true },
        })
        .catch(swallow('src/lib/news/load-desk.ts:sidecars.tables.leagues', [])),
      prisma.standing
        .findMany({
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
        })
        .catch(swallow('src/lib/news/load-desk.ts:sidecars.tables.rows', [])),
    ]);
    const safeLeagues = leagues ?? [];
    const safeRows = rows ?? [];
    const byLeague = new Map(safeLeagues.map((entry) => [entry.id, entry]));
    for (const leagueId of leagueIds) {
      const league = byLeague.get(leagueId);
      if (!league) continue;
      const leagueRows = safeRows.filter((row) => row.leagueId === leagueId).slice(0, 6);
      if (leagueRows.length === 0) continue;
      tables.push({ league, rows: leagueRows });
    }
  }

  const goals: GoalMoment[] = [];
  for (const match of (recentMatches ?? [])) {
    for (const event of (match.events ?? [])) {
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
  goals.sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime() || (b.minute ?? 0) - (a.minute ?? 0));

  const broadcasts: Broadcast[] = (broadcastRows ?? []).map((match) => ({
    matchId: match.id,
    kickoffAt: match.kickoffAt,
    status: match.status,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    channels: (match.channels ?? []).map((row) => row.channel),
  }));

  let teamsInNews: TeamInNews[] = [];
  if (teamLinkGroups.length > 0) {
    const teams = await prisma.team
      .findMany({
        where: { id: { in: teamLinkGroups.map((row) => row.entityId) } },
        select: { id: true, name: true, slug: true, logoUrl: true },
      })
      .catch(swallow('src/lib/news/load-desk.ts:sidecars.teamsInNews', []));
    const counts = new Map(teamLinkGroups.map((row) => [row.entityId, row._count?._all ?? 0]));
    teamsInNews = (teams ?? [])
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

  const seenTeamNames = new Set<string>();
  const deduplicatedTeams: TeamInNews[] = [];
  for (const team of teamsInNews) {
    const norm = team.name.trim().toLowerCase();
    if (!seenTeamNames.has(norm)) {
      seenTeamNames.add(norm);
      deduplicatedTeams.push(team);
    }
  }

  return {
    pitch,
    liveCount: pitch.filter((match) => isLive(match.status)).length,
    tables,
    goals: goals.slice(0, 8),
    broadcasts,
    teamsInNews: deduplicatedTeams.slice(0, 10),
  };
  });
});
