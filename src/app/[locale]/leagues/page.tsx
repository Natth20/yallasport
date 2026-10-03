import { swallow } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { LeaguesAtlas } from '@/components/leagues/LeaguesAtlas';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { loadLeaguesAtlasData, loadSpotlightPodium } from '@/lib/leagues/load-atlas';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { localizeEntityMap, newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import {
  atlasChapterKey,
  chapterRank,
  countryForLeagueId,
  formatLeagueSeason,
  localizeCompetitionTitle,
  localizeCountryName,
} from '@/lib/i18n/competition-names';
import { arabicNoun, countLabel } from '@/lib/i18n/arabic-count';
import { sourceSearchQuery } from '@/lib/i18n/sports-lexicon';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { CalendarDays, Radio, Search, Trophy } from 'lucide-react';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; filter?: string; sort?: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const params = await searchParams;
  const filtered = Boolean(
    params.q?.trim() ||
      (params.country && params.country !== 'all') ||
      (params.filter && params.filter !== 'all') ||
      (params.sort && params.sort !== 'coverage')
  );
  return pageMetadata({
    locale,
    title: pick(locale, 'البطولات والدوريات العالمية | يلا سبورت', 'World leagues and competitions | Yalla Sport'),
    description: pick(
      locale,
      'تابع أبرز البطولات والدوريات العالمية مع المباريات والنتائج والجداول والترتيب وآخر الأخبار عبر منصة يلا سبورت.',
      'Follow major world leagues with fixtures, results, tables, standings and verified news on Yalla Sport.'
    ),
    path: '/leagues',
    absolute: true,
    noIndex: filtered,
  });
}

type FilterValue = 'all' | 'following' | 'live' | 'standings' | 'covered';
type SortValue = 'coverage' | 'name' | 'upcoming';

function hasScore(home: number | null, away: number | null) {
  return typeof home === 'number' && typeof away === 'number';
}

function latestSeason(ids: string[]) {
  return [...ids].sort((first, second) => second.localeCompare(first, 'en', { numeric: true }))[0];
}

const DIRECTORY_COUNTRIES = 6;
const DIRECTORY_PER_COUNTRY = 6;
const DIRECTORY_COUNTRY_LIMIT = 18;

const DESK_LEAGUE_IDS: Record<string, number> = {
  '2': 100,
  '39': 96,
  '140': 94,
  '135': 90,
  '78': 88,
  '61': 84,
  '307': 93,
  '233': 91,
  '3': 72,
  '848': 68,
  '88': 52,
  '94': 50,
};

function spotlightScore(league: {
  slug: string;
  name: string;
  externalId?: string | null;
  country: string | null;
  standings: number;
  census: { total: number; live: number };
}) {
  const id = String(league.externalId || '');
  let desk = DESK_LEAGUE_IDS[id] ?? 0;
  const hay = `${league.slug} ${league.name} ${league.country || ''}`.toLowerCase();
  if (/\bgirone\b|\bu-?19\b|\bu-?21\b|\bu-?23\b|reserves?|\byouth\b|primavera|\bii\b|\b2nd\b|serie[- ]?[bcd]\b|friendl(y|ies)|ودية/.test(hay)) {
    return league.standings > 0 ? 8 + Math.min(league.census.live, 4) : Math.min(league.census.live, 3);
  }

  if (!desk) {
    const desks: Array<[RegExp, number]> = [
      [/uefa[- ]champions|champions[- ]league|دوري أبطال أوروبا/, 100],
      [/la[- ]liga|laliga|الليغا|الدوري الإسباني/, 94],
      [/serie[- ]a\b|الدوري الإيطالي/, 90],
      [/bundesliga|البوندسليغا/, 88],
      [/ligue[- ]1/, 84],
      [/roshn|دوري روشن|الدوري السعودي/, 93],
      [/egypt|الدوري المصري/, 91],
      [/europa[- ]league/, 72],
      [/afc[- ]champions|أبطال آسيا/, 70],
      [/eredivisie/, 52],
      [/primeira|liga[- ]portugal/, 50],
    ];
    for (const [pattern, weight] of desks) {
      if (pattern.test(hay)) desk = Math.max(desk, weight);
    }
    if (/premier[- ]league|الدوري الإنجليزي/.test(hay) && /england|إنجلترا/.test(hay)) {
      desk = Math.max(desk, 96);
    }
  }

  const table = league.standings > 0 ? 28 : 0;
  const live = league.census.live > 0 ? 10 : 0;
  const activity = Math.min(league.census.total, 24);
  return desk * 12 + table + live + activity;
}

export default function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; filter?: string; sort?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LeaguesPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function LeaguesPageBody({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; filter?: string; sort?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const selectedCountry = params.country?.trim() ?? 'all';
  const activeFilter: FilterValue = ['all', 'following', 'live', 'standings', 'covered'].includes(params.filter ?? '')
    ? (params.filter as FilterValue)
    : 'all';
  const activeSort: SortValue = ['coverage', 'name', 'upcoming'].includes(params.sort ?? '')
    ? (params.sort as SortValue)
    : 'coverage';
  const now = new Date();
  const session = await auth();
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const { start, end } = dayBoundsInTimezone(dateKeyInTimezone(now, timezone), timezone);

  const {
    leagueRows,
    liveMatches,
    matchCensus,
    standingCounts,
    followedLeagueIds,
    todayMatchCount,
    upcomingRows,
    finishedRows,
    tableRows,
    liveGoals,
    topScorersRaw,
    scorerPlayers,
    scorerLeagueRows,
  } = await loadLeaguesAtlasData({
    now,
    dayStart: start,
    dayEnd: end,
    userId: session?.user?.id,
  });

  const scorerLeagueByPlayer = new Map<string, { name: string; slug: string }>();
  for (const row of scorerLeagueRows) {
    if (row.playerId && !scorerLeagueByPlayer.has(row.playerId)) {
      scorerLeagueByPlayer.set(row.playerId, row.match.league);
    }
  }

  const liveMatchesByLeague = new Map<string, typeof liveMatches>();
  for (const match of liveMatches) {
    const list = liveMatchesByLeague.get(match.league.id) ?? [];
    list.push(match);
    liveMatchesByLeague.set(match.league.id, list);
  }

  const standingCountByLeagueSeason = new Map(
    standingCounts.map((row) => [`${row.leagueId}:${row.seasonId}`, row._count._all])
  );
  const seasonsByLeague = new Map<string, string[]>();
  const matchCountByLeagueSeason = new Map<
    string,
    { total: number; live: number; upcoming: number; finished: number }
  >();
  for (const row of matchCensus) {
    const seasonKey = `${row.leagueId}:${row.seasonId}`;
    const current = matchCountByLeagueSeason.get(seasonKey) ?? {
      total: 0,
      live: 0,
      upcoming: 0,
      finished: 0,
    };
    current.total += row._count._all;
    if (row.status === 'LIVE' || row.status === 'HALFTIME') current.live += row._count._all;
    if (row.status === 'NOT_STARTED') current.upcoming += row._count._all;
    if (row.status === 'FINISHED') current.finished += row._count._all;
    matchCountByLeagueSeason.set(seasonKey, current);
    const seasons = seasonsByLeague.get(row.leagueId) ?? [];
    seasons.push(row.seasonId);
    seasonsByLeague.set(row.leagueId, seasons);
  }
  for (const row of standingCounts) {
    const seasons = seasonsByLeague.get(row.leagueId) ?? [];
    seasons.push(row.seasonId);
    seasonsByLeague.set(row.leagueId, seasons);
  }

  const nextMatchByLeague = new Map<string, (typeof upcomingRows)[number]>();
  for (const match of upcomingRows) {
    if (!nextMatchByLeague.has(match.leagueId)) nextMatchByLeague.set(match.leagueId, match);
  }

  const lastResultByLeague = new Map<string, (typeof finishedRows)[number]>();
  for (const match of finishedRows) {
    if (!lastResultByLeague.has(match.leagueId)) lastResultByLeague.set(match.leagueId, match);
  }

  const tableByLeague = new Map<string, typeof tableRows>();
  for (const row of tableRows) {
    const list = tableByLeague.get(row.leagueId) ?? [];
    list.push(row);
    tableByLeague.set(row.leagueId, list);
  }

  const leagues = leagueRows.map((league) => {
    const table = tableByLeague.get(league.id) ?? [];
    const season = latestSeason([
      ...table.map((row) => row.seasonId),
      ...(seasonsByLeague.get(league.id) ?? []),
    ]);
    const seasonKey = season ? `${league.id}:${season}` : '';
    const census = (seasonKey && matchCountByLeagueSeason.get(seasonKey)) || {
      total: 0,
      live: 0,
      upcoming: 0,
      finished: 0,
    };
    const podium = table
      .filter((row) => !season || row.seasonId === season)
      .sort((first, second) => first.rank - second.rank);
    const liveList = liveMatchesByLeague.get(league.id) ?? [];
    const liveMatch = liveList[0] ?? null;
    const country = league.country?.trim() || countryForLeagueId(league.externalId) || null;
    return {
      ...league,
      country,
      sourceName: league.name,
      census,
      standings: (seasonKey && standingCountByLeagueSeason.get(seasonKey)) || 0,
      nextMatch: nextMatchByLeague.get(league.id) ?? null,
      lastResult: lastResultByLeague.get(league.id) ?? null,
      liveMatch,
      extraLive: Math.max(0, census.live - (liveMatch ? 1 : 0)),
      podium,
      season: formatLeagueSeason(season) ?? season ?? null,
      seasonId: season ?? null,
      leader: podium.find((row) => row.rank === 1) ?? null,
      runnerUp: podium.find((row) => row.rank === 2) ?? null,
    };
  });

  const nameMap = await localizeEntityMap(
    leagues.map((league) => ({ entityType: 'LEAGUE', entityId: league.id, fallback: league.name })),
    locale
  );
  const newsLinks = await prisma.newsEntityLink
    .findMany({
      where: {
        confirmed: true,
        entityType: 'LEAGUE',
        news: newsVisibleWhere(locale),
      },
      orderBy: { news: { publishedAt: 'desc' } },
      take: 10,
      select: {
        entityId: true,
        news: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            publishedAt: true,
            featuredImage: true,
            sourceLocale: true,
          },
        },
      },
    })
    .catch(swallow("src/app/[locale]/leagues/page.tsx:177", []));

  for (const league of leagues) {
    const stored = nameMap.get(`LEAGUE:${league.id}`) || null;
    league.name = localizeCompetitionTitle(
      locale,
      { name: league.sourceName, country: league.country, externalId: league.externalId },
      stored
    );
  }

  const newsById = new Map<string, (typeof newsLinks)[number]['news'] & { leagueName: string; leagueSlug: string }>();
  for (const link of newsLinks) {
    if (newsById.has(link.news.id)) continue;
    const league = leagues.find((entry) => entry.id === link.entityId);
    newsById.set(link.news.id, {
      ...link.news,
      leagueName: league?.name ?? '',
      leagueSlug: league?.slug ?? '',
    });
  }
  const leagueNews = (await overlayNewsList([...newsById.values()], locale)).slice(0, 4);

  const followedSet = new Set(followedLeagueIds.map((favorite) => favorite.entityId));
  const liveLeagueIds = new Set(liveMatches.map((match) => match.league.id));
  const countries = Array.from(
    new Set(leagues.map((league) => atlasChapterKey(league.country, league.externalId)))
  ).sort((first, second) => chapterRank(first) - chapterRank(second) || first.localeCompare(second, locale));

  const filterCounts = {
    all: leagues.length,
    following: leagues.filter((league) => followedSet.has(league.id)).length,
    live: leagues.filter((league) => liveLeagueIds.has(league.id)).length,
    standings: leagues.filter((league) => league.standings > 0).length,
    covered: leagues.filter((league) => league.census.total > 0 || league.standings > 0).length,
  };

  const filteredLeagues = leagues.filter((league) => {
    const latin = sourceSearchQuery(query).toLowerCase();
    const hay = [
      league.name,
      league.sourceName,
      league.externalId,
      league.country,
      localizeCountryName(locale, league.country),
      localizeCompetitionTitle(locale, league),
      atlasChapterKey(league.country, league.externalId),
      sourceSearchQuery(league.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery = !query || hay.includes(query) || (latin && hay.includes(latin));
    const matchesCountry =
      selectedCountry === 'all' ||
      league.country === selectedCountry ||
      atlasChapterKey(league.country, league.externalId) === selectedCountry;
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'following' && followedSet.has(league.id)) ||
      (activeFilter === 'live' && liveLeagueIds.has(league.id)) ||
      (activeFilter === 'standings' && league.standings > 0) ||
      (activeFilter === 'covered' && (league.census.total > 0 || league.standings > 0));
    return matchesQuery && matchesCountry && matchesFilter;
  });

  const sortedLeagues = [...filteredLeagues].sort((first, second) => {
    if (activeSort === 'name') return first.name.localeCompare(second.name, locale);
    if (activeSort === 'upcoming') {
      const firstTime = first.nextMatch?.kickoffAt.getTime() ?? Number.MAX_SAFE_INTEGER;
      const secondTime = second.nextMatch?.kickoffAt.getTime() ?? Number.MAX_SAFE_INTEGER;
      return firstTime - secondTime;
    }
    const liveBoost = (league: (typeof leagues)[number]) => (liveLeagueIds.has(league.id) ? 800 : 0);
    return (
      liveBoost(second) + second.census.total + second.standings -
      (liveBoost(first) + first.census.total + first.standings)
    );
  });

  const spotlightPool = filteredLeagues.length > 0 ? filteredLeagues : leagues;
  const spotlightLeague =
    [...spotlightPool].sort((first, second) => spotlightScore(second) - spotlightScore(first))[0] ??
    spotlightPool.find((league) => league.standings > 0 || league.census.total > 0) ??
    spotlightPool[0];

  if (spotlightLeague) {
    const spotlightPodium = await loadSpotlightPodium(spotlightLeague.id);
    if (spotlightPodium.length > 0) {
      const season = latestSeason(spotlightPodium.map((row) => row.seasonId));
      spotlightLeague.season = formatLeagueSeason(season) ?? season ?? spotlightLeague.season;
      spotlightLeague.seasonId = season ?? spotlightLeague.seasonId;
      spotlightLeague.podium = spotlightPodium.filter((row) => !season || row.seasonId === season);
      spotlightLeague.leader = spotlightLeague.podium.find((row) => row.rank === 1) ?? spotlightLeague.leader;
      spotlightLeague.runnerUp = spotlightLeague.podium.find((row) => row.rank === 2) ?? spotlightLeague.runnerUp;
    }
  }

  const spotlightLiveMatches = spotlightLeague
    ? liveMatches.filter((match) => match.league.id === spotlightLeague.id).slice(0, 4)
    : [];

  const followedLeagues = leagues.filter((league) => followedSet.has(league.id));
  const upcomingMatches = [...upcomingRows]
    .sort((first, second) => first.kickoffAt.getTime() - second.kickoffAt.getTime())
    .slice(0, 6);
  const recentResults = [...finishedRows]
    .filter((match) => hasScore(match.homeScore, match.awayScore))
    .sort((first, second) => second.kickoffAt.getTime() - first.kickoffAt.getTime())
    .slice(0, 6);
  const liveBoard = liveMatches.slice(0, 8);
  const liveGoalByMatch = new Map<string, (typeof liveGoals)[number]>();
  for (const event of liveGoals) {
    if (!liveGoalByMatch.has(event.matchId)) liveGoalByMatch.set(event.matchId, event);
  }

  const titleRaces = leagues
    .filter(
      (league) =>
        league.leader &&
        league.runnerUp &&
        league.leader.seasonId === league.runnerUp.seasonId &&
        (league.leader.played > 0 || league.runnerUp.played > 0)
    )
    .map((league) => ({
      league,
      leader: league.leader!,
      runnerUp: league.runnerUp!,
      gap: league.leader!.points - league.runnerUp!.points,
    }))
    .sort((first, second) => first.gap - second.gap || second.leader.points - first.leader.points)
    .slice(0, 5);

  const scorers = topScorersRaw.flatMap((row) => {
    const player = scorerPlayers.find((entry) => entry.id === row.playerId);
    if (!player?.name) return [];
    return [{
      goals: row._count.id,
      player,
      teamName: player.teams[0]?.team.name,
      league: row.playerId ? scorerLeagueByPlayer.get(row.playerId) : undefined,
    }];
  });

  const countryCoverage = countries.map((country) => ({
    country,
    count: leagues.filter((league) => atlasChapterKey(league.country, league.externalId) === country).length,
    matches: leagues
      .filter((league) => atlasChapterKey(league.country, league.externalId) === country)
      .reduce((total, league) => total + league.census.total, 0),
    live: leagues.filter((league) => atlasChapterKey(league.country, league.externalId) === country && liveLeagueIds.has(league.id)).length,
  }));

  const chapters = new Map<string, typeof sortedLeagues>();
  const unlocated: typeof sortedLeagues = [];
  for (const league of sortedLeagues) {
    const country = league.country?.trim();
    if (!country && !league.externalId) {
      unlocated.push(league);
      continue;
    }
    const key = atlasChapterKey(country, league.externalId);
    const list = chapters.get(key) ?? [];
    list.push(league);
    chapters.set(key, list);
  }
  for (const list of chapters.values()) {
    list.sort((first, second) => {
      const scoreDiff = spotlightScore(second) - spotlightScore(first);
      if (scoreDiff) return scoreDiff;
      const liveDiff = Number(Boolean(second.liveMatch)) - Number(Boolean(first.liveMatch));
      if (liveDiff) return liveDiff;
      return second.census.total + second.standings - (first.census.total + first.standings);
    });
  }
  const chapterEntries = [...chapters.entries()].sort((first, second) => {
    const regionDiff = chapterRank(first[0]) - chapterRank(second[0]);
    if (regionDiff) return regionDiff;
    const firstScore = Math.max(0, ...first[1].map((league) => spotlightScore(league)));
    const secondScore = Math.max(0, ...second[1].map((league) => spotlightScore(league)));
    if (secondScore !== firstScore) return secondScore - firstScore;
    const firstLive = first[1].some((league) => liveLeagueIds.has(league.id)) ? 1 : 0;
    const secondLive = second[1].some((league) => liveLeagueIds.has(league.id)) ? 1 : 0;
    if (secondLive !== firstLive) return secondLive - firstLive;
    const firstMatches = first[1].reduce((total, league) => total + league.census.total, 0);
    const secondMatches = second[1].reduce((total, league) => total + league.census.total, 0);
    return secondMatches - firstMatches || first[0].localeCompare(second[0], locale);
  });
  const browseDesk = selectedCountry === 'all' && !query && activeFilter === 'all';
  const countryCardCap = browseDesk || selectedCountry === 'all' ? DIRECTORY_PER_COUNTRY : DIRECTORY_COUNTRY_LIMIT;
  const visibleChapters = (browseDesk ? chapterEntries.slice(0, DIRECTORY_COUNTRIES) : chapterEntries).map(
    ([country, rows]) => ({
      country,
      rows: rows.slice(0, countryCardCap),
      total: rows.length,
    })
  );
  const visibleUnlocated = unlocated.slice(0, browseDesk ? DIRECTORY_PER_COUNTRY : DIRECTORY_COUNTRY_LIMIT);

  const countryHref = (country: string) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set('q', params.q?.trim() ?? '');
    if (country !== 'all') nextParams.set('country', country);
    if (activeFilter !== 'all') nextParams.set('filter', activeFilter);
    if (activeSort !== 'coverage') nextParams.set('sort', activeSort);
    const search = nextParams.toString();
    return search ? `/leagues?${search}` : '/leagues';
  };

  const rankedCountries = [...countryCoverage]
    .sort((first, second) => second.matches - first.matches || second.count - first.count)
    .map((entry) => entry.country);
  const railCountries = rankedCountries.slice(0, 14);
  const visibleCountries =
    selectedCountry !== 'all' && !railCountries.includes(selectedCountry)
      ? [selectedCountry, ...railCountries.slice(0, 13)]
      : railCountries;
  const extraCountryCount = Math.max(0, rankedCountries.length - 14);
  const syncedAt = [...liveMatches, ...upcomingRows, ...finishedRows]
    .map((row) => row.lastSyncedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((first, second) => second.getTime() - first.getTime())[0];
  const providerIsLive = isLiveSportsApi();
  const census = [
    {
      value: leagues.length,
      label: locale === 'ar' ? arabicNoun(leagues.length, 'league') : countLabel(locale, leagues.length, 'league', 'Leagues'),
      live: false,
    },
    ...(liveMatches.length > 0
      ? [{
        value: liveMatches.length,
        label: locale === 'ar' ? arabicNoun(liveMatches.length, 'liveMatch') : countLabel(locale, liveMatches.length, 'liveMatch', 'live'),
        live: true,
      }]
      : []),
    ...(todayMatchCount > 0
      ? [{
        value: todayMatchCount,
        label: locale === 'ar' ? arabicNoun(todayMatchCount, 'today') : countLabel(locale, todayMatchCount, 'today', 'today'),
        live: false,
      }]
      : []),
    ...(filterCounts.standings > 0
      ? [{
        value: filterCounts.standings,
        label: locale === 'ar' ? arabicNoun(filterCounts.standings, 'table') : countLabel(locale, filterCounts.standings, 'table', 'tables'),
        live: false,
      }]
      : []),
  ]
    .filter((stat) => stat.value > 0)
    .slice(0, 4);
  const jumpCountries = chapterEntries.map(([country, rows]) => {
    const nextKickoff = rows
      .map((league) => league.nextMatch?.kickoffAt)
      .filter((value): value is Date => Boolean(value))
      .sort((first, second) => first.getTime() - second.getTime())[0];
    return {
      country,
      live: rows.filter((league) => Boolean(league.liveMatch)).length,
      count: rows.length,
      nextKickoff: nextKickoff ?? null,
    };
  });

  return (
    <SalonStage
      tone="booth"
      wide
      compact
      kicker={pick(locale, 'قاعة البطولات', 'League hall')}
      title={pick(locale, 'البطولات والدوريات العالمية', 'World leagues and competitions')}
      lead={pick(
        locale,
        'جداول ومباشر ومواعيد من المصدر فقط — بلا تعبئة وبلا أرقام وهمية.',
        'Tables, live and fixtures from the source only — no filler, no invented numbers.',
      )}
      aside={
        liveMatches.length > 0
          ? pick(locale, `${liveMatches.length} مباشرة`, `${liveMatches.length} live`)
          : pick(locale, 'من المصدر', 'From source')
      }
      tools={
        <HallFoyer
          label={pick(locale, 'جناح الأطلس', 'Atlas suite')}
          items={[
            { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
            { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
            { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy, current: true },
            { href: '/leagues?filter=covered', label: pick(locale, 'المغطاة', 'Covered'), icon: Search },
          ]}
        />
      }
    >
      <LeaguesAtlas
        locale={locale}
        now={now}
        paramsQ={params.q}
        selectedCountry={selectedCountry}
        activeFilter={activeFilter}
        activeSort={activeSort}
        loggedIn={Boolean(session?.user)}
        liveMatches={liveMatches}
        followedSet={followedSet}
        followedLeagues={followedLeagues}
        spotlightLeague={spotlightLeague}
        spotlightLiveMatches={spotlightLiveMatches}
        liveBoard={liveBoard}
        liveGoalByMatch={liveGoalByMatch}
        sortedLeagues={sortedLeagues}
        chapterEntries={visibleChapters}
        unlocated={visibleUnlocated}
        directoryCapped={browseDesk}
        jumpCountries={jumpCountries}
        visibleCountries={visibleCountries}
        extraCountryCount={extraCountryCount}
        countryCoverage={countryCoverage}
        countryHref={countryHref}
        filterCounts={filterCounts}
        census={census}
        providerIsLive={providerIsLive}
        syncedAt={syncedAt}
        upcomingMatches={upcomingMatches}
        recentResults={recentResults}
        titleRaces={titleRaces}
        scorers={scorers}
        leagueNews={leagueNews}
      />
    </SalonStage>
  );
}
