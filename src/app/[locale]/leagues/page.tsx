import React from 'react';
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
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'البطولات', 'Leagues'),
    description: pick(
      locale,
      'أطلس البطولات في يلا سبورت: المباشر، الجداول، المواعيد، الهدافون، والخبر المعتمد من المصدر فقط — من الدوريات الأوروبية إلى الدوري المصري.',
      'Yalla Sport leagues atlas: live matches, tables, fixtures, scorers, and verified reports from the source only — from European competitions to the Egyptian Premier League.'
    ),
    path: '/leagues',
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

export default async function LeaguesPage({
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

  const standingCountByLeague = new Map(standingCounts.map((row) => [row.leagueId, row._count._all]));
  const matchCountByLeague = new Map<string, { total: number; live: number; upcoming: number; finished: number }>();
  for (const row of matchCensus) {
    const current = matchCountByLeague.get(row.leagueId) ?? { total: 0, live: 0, upcoming: 0, finished: 0 };
    current.total += row._count._all;
    if (row.status === 'LIVE' || row.status === 'HALFTIME') current.live += row._count._all;
    if (row.status === 'NOT_STARTED') current.upcoming += row._count._all;
    if (row.status === 'FINISHED') current.finished += row._count._all;
    matchCountByLeague.set(row.leagueId, current);
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
    const census = matchCountByLeague.get(league.id) ?? { total: 0, live: 0, upcoming: 0, finished: 0 };
    const table = tableByLeague.get(league.id) ?? [];
    const season = latestSeason(table.map((row) => row.seasonId));
    const podium = table
      .filter((row) => !season || row.seasonId === season)
      .sort((first, second) => first.rank - second.rank);
    const liveList = liveMatchesByLeague.get(league.id) ?? [];
    const liveMatch = liveList[0] ?? null;
    return {
      ...league,
      census,
      standings: standingCountByLeague.get(league.id) ?? 0,
      nextMatch: nextMatchByLeague.get(league.id) ?? null,
      lastResult: lastResultByLeague.get(league.id) ?? null,
      liveMatch,
      extraLive: Math.max(0, census.live - (liveMatch ? 1 : 0)),
      podium,
      season: season ?? null,
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
    .catch(() => []);

  for (const league of leagues) {
    league.name = nameMap.get(`LEAGUE:${league.id}`) || league.name;
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
    new Set(leagues.map((league) => league.country?.trim()).filter((country): country is string => Boolean(country)))
  ).sort((first, second) => first.localeCompare(second, locale));

  const filterCounts = {
    all: leagues.length,
    following: leagues.filter((league) => followedSet.has(league.id)).length,
    live: leagues.filter((league) => liveLeagueIds.has(league.id)).length,
    standings: leagues.filter((league) => league.standings > 0).length,
    covered: leagues.filter((league) => league.census.total > 0 || league.standings > 0).length,
  };

  const filteredLeagues = leagues.filter((league) => {
    const matchesQuery =
      !query ||
      league.name.toLowerCase().includes(query) ||
      (league.country?.toLowerCase().includes(query) ?? false);
    const matchesCountry = selectedCountry === 'all' || league.country === selectedCountry;
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

  const spotlightLeague =
    [...sortedLeagues]
      .filter((league) => liveLeagueIds.has(league.id))
      .sort((first, second) =>
        second.standings - first.standings ||
        second.census.total - first.census.total ||
        second.census.live - first.census.live
      )[0] ??
    sortedLeagues.find((league) => league.standings > 0 || league.census.total > 0) ??
    sortedLeagues[0];

  if (spotlightLeague) {
    const spotlightPodium = await loadSpotlightPodium(spotlightLeague.id);
    if (spotlightPodium.length > 0) {
      const season = latestSeason(spotlightPodium.map((row) => row.seasonId));
      spotlightLeague.season = season ?? spotlightLeague.season;
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
  const liveBoard = liveMatches.slice(0, 16);
  const liveGoalByMatch = new Map<string, (typeof liveGoals)[number]>();
  for (const event of liveGoals) {
    if (!liveGoalByMatch.has(event.matchId)) liveGoalByMatch.set(event.matchId, event);
  }

  const titleRaces = leagues
    .filter((league) => league.leader && league.runnerUp && league.leader.seasonId === league.runnerUp.seasonId)
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
    count: leagues.filter((league) => league.country === country).length,
    matches: leagues
      .filter((league) => league.country === country)
      .reduce((total, league) => total + league.census.total, 0),
    live: leagues.filter((league) => league.country === country && liveLeagueIds.has(league.id)).length,
  }));

  const chapters = new Map<string, typeof sortedLeagues>();
  const unlocated: typeof sortedLeagues = [];
  for (const league of sortedLeagues) {
    const country = league.country?.trim();
    if (!country) {
      unlocated.push(league);
      continue;
    }
    const list = chapters.get(country) ?? [];
    list.push(league);
    chapters.set(country, list);
  }
  for (const list of chapters.values()) {
    list.sort((first, second) => {
      const liveDiff = Number(Boolean(second.liveMatch)) - Number(Boolean(first.liveMatch));
      if (liveDiff) return liveDiff;
      return second.census.total + second.standings - (first.census.total + first.standings);
    });
  }
  const chapterEntries = [...chapters.entries()].sort((first, second) => {
    const firstLive = first[1].some((league) => liveLeagueIds.has(league.id)) ? 1 : 0;
    const secondLive = second[1].some((league) => liveLeagueIds.has(league.id)) ? 1 : 0;
    if (secondLive !== firstLive) return secondLive - firstLive;
    const firstMatches = first[1].reduce((total, league) => total + league.census.total, 0);
    const secondMatches = second[1].reduce((total, league) => total + league.census.total, 0);
    return secondMatches - firstMatches || first[0].localeCompare(second[0], locale);
  });

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
    { value: leagues.length, label: pick(locale, 'بطولة', 'Leagues'), live: false },
    ...(liveMatches.length > 0
      ? [{ value: liveMatches.length, label: pick(locale, 'مباشر', 'Live'), live: true }]
      : []),
    ...(todayMatchCount > 0
      ? [{ value: todayMatchCount, label: pick(locale, 'اليوم', 'Today'), live: false }]
      : []),
    ...(filterCounts.standings > 0
      ? [{ value: filterCounts.standings, label: pick(locale, 'جداول', 'Tables'), live: false }]
      : []),
    ...(countries.length > 0
      ? [{ value: countries.length, label: pick(locale, 'دولة', 'Countries'), live: false }]
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
      chapterEntries={chapterEntries}
      unlocated={unlocated}
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
  );
}
