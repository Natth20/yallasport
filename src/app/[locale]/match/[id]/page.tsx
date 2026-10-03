import { swallow, reportCaughtError } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { Calendar, MapPin, Radio, Shield, Ticket, Trophy, Users } from 'lucide-react';
import { endOfDay, startOfDay } from 'date-fns';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { visibleCommentsWhere } from '@/lib/comments/visibility';
import { NewsCard } from '@/components/news/NewsCard';
import { MatchStreamPlayer } from '@/components/streaming/MatchStreamPlayer';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { PredictionWidget } from '@/components/sports/PredictionWidget';
import { MatchChat } from '@/components/sports/MatchChat';
import { MatchAIAnalyst } from '@/components/sports/MatchAIAnalyst';
import { MatchJsonLd } from '@/components/seo/SportsJsonLd';
import { LiveMatchReactions } from '@/components/matches/LiveMatchReactions';
import { FloatingStreamDock } from '@/components/streaming/FloatingStreamDock';
import { notFound } from 'next/navigation';
import { getResolvedMatchDetail } from '@/lib/sports-data/match-resolver';
import { paintNormalizedMatches } from '@/lib/i18n/localized-content';
import { walkLocalizeNames, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { type FormLetter } from '@/components/sports/MatchDossier';
import type { MatchStatus, NormalizedMatch, NormalizedStanding } from '@/lib/sports-data/types';
import { HomeFanPoll } from '@/components/home/HomeFanPoll';
import { parsePollOptions } from '@/lib/polls/match-poll';
import { MATCH_LIST_INCLUDE, toNormalizedMatch, toNormalizedStanding } from '@/lib/sports-data/from-db';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { licensedAssetForMatch } from '@/lib/streaming/catalog';
import { relatedNewsForMatch } from '@/lib/news/entity-suggest';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { MatchHero } from '@/components/sports/MatchHero';
import { SiteAd } from '@/components/ads/SiteAd';
import { MatchDetailTabs } from '@/components/sports/MatchDetailTabs';
import { MatchContextPack } from '@/components/sports/MatchContextPack';
import { sportsData } from '@/lib/sports-data';
import styles from '@/components/sports/match-dossier.module.css';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const locale = await getLocale();
  try {
    const { id } = await params;
    const match = await getResolvedMatchDetail(id);
    if (!match) {
      return pageMetadata({
        locale,
        title: pick(locale, 'مركز المباراة', 'Match center'),
        description: pick(locale, 'تغطية المباراة من مصدر البيانات الحقيقي.', 'Match coverage from the real data source.'),
        path: `/match/${id}`,
        noIndex: true,
      });
    }
    const hasScore = match.homeScore != null && match.awayScore != null;
    const scoreBit = hasScore ? ` ${match.homeScore}-${match.awayScore}` : '';
    const vs = pick(locale, 'ضد', 'vs');
    const homeName = localizePlainName(locale, match.homeTeam.name);
    const awayName = localizePlainName(locale, match.awayTeam.name);
    const title = `${homeName}${hasScore ? scoreBit : ''} ${vs} ${awayName}`;
    const description = hasScore
      ? pick(
        locale,
        `تغطية مباراة ${homeName} و${awayName} بالنتيجة ${match.homeScore}-${match.awayScore} من مصدر البيانات الحقيقي.`,
        `Coverage of ${homeName} vs ${awayName} at ${match.homeScore}-${match.awayScore} from the real data source.`
      )
      : pick(
        locale,
        `تغطية مباراة ${homeName} ضد ${awayName}: التشكيلة، الأحداث، والقنوات من المصدر الحقيقي دون نتائج وهمية.`,
        `Coverage of ${homeName} vs ${awayName}: lineups, events, and TV listings from the real source — no invented scores.`
      );
    return pageMetadata({
      locale,
      title,
      description,
      path: `/match/${id}`,
      images: [match.homeTeam.logoUrl, match.awayTeam.logoUrl],
    });
  } catch (error) {
    reportCaughtError("src/app/[locale]/match/[id]/page.tsx:87", error);
    return pageMetadata({
      locale,
      title: pick(locale, 'مركز المباراة', 'Match center'),
      description: pick(locale, 'تغطية المباراة من مصدر البيانات الحقيقي.', 'Match coverage from the real data source.'),
      path: '/matches',
    });
  }
}

function toForm(
  teamId: string,
  rows: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }>
): FormLetter[] {
  return rows.map((row) => {
    const isHome = row.homeTeamId === teamId;
    if (row.homeScore == null || row.awayScore == null) return null;
    const scored = isHome ? row.homeScore : row.awayScore;
    const conceded = isHome ? row.awayScore : row.homeScore;
    if (scored > conceded) return 'W';
    if (scored < conceded) return 'L';
    return 'D';
  }).filter((letter): letter is FormLetter => Boolean(letter));
}

function belongsToTeam(teamId: string, team: { id: string; externalId: string }) {
  return teamId === team.id || teamId === team.externalId;
}

function toFormFromMatches(
  team: { id: string; externalId: string },
  rows: NormalizedMatch[]
): FormLetter[] {
  return rows.map((row) => {
    const isHome = belongsToTeam(row.homeTeam.id, team);
    if (typeof row.homeScore !== 'number' || typeof row.awayScore !== 'number') return null;
    const scored = isHome ? row.homeScore : row.awayScore;
    const conceded = isHome ? row.awayScore : row.homeScore;
    if (scored > conceded) return 'W';
    if (scored < conceded) return 'L';
    return 'D';
  }).filter((letter): letter is FormLetter => Boolean(letter));
}

type RawFixtureEnvelope = {
  response?: Array<{
    fixture: { id: number; date: string; status?: { short?: string; elapsed?: number }; venue?: { name?: string } };
    teams: {
      home: { id: number; name: string; logo?: string };
      away: { id: number; name: string; logo?: string };
    };
    goals: { home: number | null; away: number | null };
    league: { id: number; name: string; logo?: string; country?: string; round?: string };
  }>;
};

function mapRawStatus(short?: string): MatchStatus {
  if (short === 'FT' || short === 'AET' || short === 'PEN') return 'FINISHED';
  if (short === 'HT') return 'HALFTIME';
  if (short === '1H' || short === '2H' || short === 'ET' || short === 'BT' || short === 'P' || short === 'LIVE') {
    return 'LIVE';
  }
  if (short === 'PST' || short === 'POSTP') return 'POSTPONED';
  if (short === 'CANC') return 'CANCELLED';
  return 'NOT_STARTED';
}

function mapRawFixtures(payload: RawFixtureEnvelope | null, skipId?: string): NormalizedMatch[] {
  if (!payload?.response) return [];
  return payload.response
    .filter((row) => String(row.fixture.id) !== skipId)
    .map((row) => ({
      id: String(row.fixture.id),
      externalId: String(row.fixture.id),
      status: mapRawStatus(row.fixture.status?.short),
      homeScore: row.goals.home ?? undefined,
      awayScore: row.goals.away ?? undefined,
      minute: row.fixture.status?.elapsed,
      kickoffAt: new Date(row.fixture.date),
      venue: row.fixture.venue?.name,
      round: row.league.round,
      homeTeam: {
        id: String(row.teams.home.id),
        externalId: String(row.teams.home.id),
        name: row.teams.home.name,
        slug: row.teams.home.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: row.teams.home.logo,
      },
      awayTeam: {
        id: String(row.teams.away.id),
        externalId: String(row.teams.away.id),
        name: row.teams.away.name,
        slug: row.teams.away.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: row.teams.away.logo,
      },
      league: {
        id: String(row.league.id),
        externalId: String(row.league.id),
        name: row.league.name,
        slug: row.league.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: row.league.logo,
        country: row.league.country,
      },
    }));
}

export default function MatchCenterPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <MatchCenterBody params={params} />
    </Suspense>
  );
}

async function MatchCenterBody({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const { id } = await params;
  const session = await auth();
  const match = await getResolvedMatchDetail(id);
  if (!match) notFound();
  await paintNormalizedMatches(locale, [match]);
  const commentWhere = await visibleCommentsWhere({ matchId: match.id });
  const kickoff = new Date(match.kickoffAt);
  const seasonYear = String(kickoff.getUTCFullYear());

  const homeExt = match.homeTeam.externalId;
  const awayExt = match.awayTeam.externalId;
  const leagueExt = match.league.externalId;

  const [h2hRows, standingRows, relatedNews, userPrediction, matchComments, userFollow, userReminder, formRows, licensedAsset, existingPoll, upcomingRows, sameDayRows, leagueScorers, apiStandings, homeLastRaw, awayLastRaw, homeNextRaw, awayNextRaw] =
    await Promise.all([
      prisma.match
        .findMany({
          where: {
            status: 'FINISHED',
            id: { not: match.id },
            OR: [
              { homeTeamId: match.homeTeam.id, awayTeamId: match.awayTeam.id },
              { homeTeamId: match.awayTeam.id, awayTeamId: match.homeTeam.id },
            ],
          },
          orderBy: { kickoffAt: 'desc' },
          take: 8,
          include: MATCH_LIST_INCLUDE,
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:139", [])),
      prisma.standing
        .findMany({
          where: { leagueId: match.league.id },
          orderBy: [{ seasonId: 'desc' }, { rank: 'asc' }],
          take: 40,
          include: { team: true },
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:147", [])),
      relatedNewsForMatch(match.id, locale, 8).catch(swallow("src/app/[locale]/match/[id]/page.tsx:148", [])),
      session?.user?.email
        ? prisma.prediction
          .findFirst({
            where: {
              matchId: match.id,
              user: { email: session.user.email },
            },
          })
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:157", null))
        : null,
      prisma.comment
        .findMany({
          where: commentWhere,
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
          take: 50,
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:166", [])),
      session?.user?.email
        ? prisma.userFavorite
          .findFirst({
            where: {
              entityId: match.id,
              entityType: 'MATCH',
              user: { email: session.user.email },
            },
          })
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:176", null))
        : null,
      session?.user?.id
        ? prisma.matchReminder
          .findUnique({
            where: { userId_matchId: { userId: session.user.id, matchId: match.id } },
            select: { id: true },
          })
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:184", null))
        : null,
      prisma.match
        .findMany({
          where: {
            status: 'FINISHED',
            id: { not: match.id },
            OR: [
              { homeTeamId: match.homeTeam.id },
              { awayTeamId: match.homeTeam.id },
              { homeTeamId: match.awayTeam.id },
              { awayTeamId: match.awayTeam.id },
            ],
          },
          orderBy: { kickoffAt: 'desc' },
          take: 24,
          include: MATCH_LIST_INCLUDE,
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:202", [])),
      licensedAssetForMatch(match.id).catch(swallow("src/app/[locale]/match/[id]/page.tsx:203", null)),
      prisma.matchPoll
        .findFirst({ where: { matchId: match.id }, orderBy: { createdAt: 'desc' } })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:206", null)),
      prisma.match
        .findMany({
          where: {
            id: { not: match.id },
            kickoffAt: { gte: kickoff },
            status: { in: ['NOT_STARTED', 'LIVE', 'HALFTIME'] },
            OR: [
              { homeTeamId: match.homeTeam.id },
              { awayTeamId: match.homeTeam.id },
              { homeTeamId: match.awayTeam.id },
              { awayTeamId: match.awayTeam.id },
            ],
          },
          orderBy: { kickoffAt: 'asc' },
          take: 8,
          include: MATCH_LIST_INCLUDE,
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:upcoming", [])),
      prisma.match
        .findMany({
          where: {
            id: { not: match.id },
            leagueId: match.league.id,
            kickoffAt: { gte: startOfDay(kickoff), lte: endOfDay(kickoff) },
          },
          orderBy: { kickoffAt: 'asc' },
          take: 10,
          include: MATCH_LIST_INCLUDE,
        })
        .catch(swallow("src/app/[locale]/match/[id]/page.tsx:sameday", [])),
      leagueExt
        ? sportsData.getTopScorers(leagueExt, seasonYear).catch(swallow("src/app/[locale]/match/[id]/page.tsx:scorers", []))
        : Promise.resolve([]),
      leagueExt
        ? sportsData.getStandings(leagueExt, seasonYear).catch(swallow("src/app/[locale]/match/[id]/page.tsx:standings-api", []))
        : Promise.resolve([] as NormalizedStanding[]),
      homeExt
        ? sportsData
          .getRaw<RawFixtureEnvelope>(`/fixtures?team=${homeExt}&last=5`)
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:home-last", null))
        : Promise.resolve(null),
      awayExt
        ? sportsData
          .getRaw<RawFixtureEnvelope>(`/fixtures?team=${awayExt}&last=5`)
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:away-last", null))
        : Promise.resolve(null),
      homeExt
        ? sportsData
          .getRaw<RawFixtureEnvelope>(`/fixtures?team=${homeExt}&next=4`)
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:home-next", null))
        : Promise.resolve(null),
      awayExt
        ? sportsData
          .getRaw<RawFixtureEnvelope>(`/fixtures?team=${awayExt}&next=4`)
          .catch(swallow("src/app/[locale]/match/[id]/page.tsx:away-next", null))
        : Promise.resolve(null),
    ]);

  let h2hMatches = h2hRows.map(toNormalizedMatch);
  if (h2hMatches.length === 0 && match.homeTeam.externalId && match.awayTeam.externalId) {
    const apiH2h = await sportsData
      .getH2H(match.homeTeam.externalId, match.awayTeam.externalId)
      .catch(swallow("src/app/[locale]/match/[id]/page.tsx:h2h-api", []));
    h2hMatches = apiH2h;
  }
  const formMatches = formRows.map(toNormalizedMatch);
  const dbUpcoming = upcomingRows.map(toNormalizedMatch);
  const sameDayMatches = sameDayRows.map(toNormalizedMatch);
  const homeLastApi = mapRawFixtures(homeLastRaw, match.externalId);
  const awayLastApi = mapRawFixtures(awayLastRaw, match.externalId);
  const nextFromApi = [
    ...mapRawFixtures(homeNextRaw, match.externalId),
    ...mapRawFixtures(awayNextRaw, match.externalId),
  ]
    .filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index)
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    .slice(0, 8);
  const upcomingMatches = dbUpcoming.length > 0 ? dbUpcoming : nextFromApi;
  await paintNormalizedMatches(locale, [
    ...h2hMatches,
    ...formMatches,
    ...upcomingMatches,
    ...sameDayMatches,
    ...homeLastApi,
    ...awayLastApi,
  ]);
  walkLocalizeNames(locale, standingRows);
  const latestSeason = standingRows[0]?.seasonId;
  const leagueStandings =
    standingRows.length > 0
      ? standingRows.filter((row) => row.seasonId === latestSeason).map(toNormalizedStanding)
      : apiStandings;

  const homeStanding = leagueStandings.find(
    (row) => belongsToTeam(row.team.id, match.homeTeam) || row.team.name === match.homeTeam.name
  );
  const awayStanding = leagueStandings.find(
    (row) => belongsToTeam(row.team.id, match.awayTeam) || row.team.name === match.awayTeam.name
  );
  const involvedRanks = [homeStanding?.rank, awayStanding?.rank].filter(
    (rank): rank is number => typeof rank === 'number'
  );
  const tableWindow = leagueStandings.filter((row) => {
    if (involvedRanks.length === 0) return row.rank <= 8;
    const minRank = Math.min(...involvedRanks);
    const maxRank = Math.max(...involvedRanks);
    return row.rank >= Math.max(1, minRank - 2) && row.rank <= maxRank + 2;
  });
  const venueName = typeof match.venue === 'string' ? match.venue : match.venueDetail?.name || match.venue;
  const matchSheetRows = [
    {
      icon: Calendar,
      label: pick(locale, 'الموعد', 'Kickoff'),
      value: kickoff.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    },
    ...(match.round
      ? [{ icon: Trophy, label: pick(locale, 'الجولة', 'Round'), value: match.round }]
      : []),
    ...(typeof venueName === 'string' && venueName
      ? [
        {
          icon: MapPin,
          label: pick(locale, 'الملعب', 'Venue'),
          value: `${venueName}${match.venueDetail?.city ? ` · ${match.venueDetail.city}` : ''}${match.venueDetail?.capacity
            ? ` · ${match.venueDetail.capacity.toLocaleString(locale)} ${pick(locale, 'مقعد', 'seats')}`
            : ''
            }`,
        },
      ]
      : []),
    ...(match.referee?.name
      ? [{ icon: Shield, label: pick(locale, 'الحكم', 'Referee'), value: match.referee.name }]
      : []),
    ...(typeof match.attendance === 'number'
      ? [
        {
          icon: Ticket,
          label: pick(locale, 'الحضور', 'Attendance'),
          value: match.attendance.toLocaleString(locale),
        },
      ]
      : []),
    ...(match.channels.length
      ? [
        {
          icon: Radio,
          label: pick(locale, 'النقل', 'Broadcast'),
          value: match.channels.map((channel) => channel.name).join(', '),
        },
      ]
      : []),
    ...(match.commentators?.length
      ? [
        {
          icon: Users,
          label: pick(locale, 'التعليق', 'Commentary'),
          value: match.commentators.map((commentator) => commentator.name).join(', '),
        },
      ]
      : []),
    ...(match.lineups
      .map((lineup) => lineup.coach?.name)
      .filter((name): name is string => Boolean(name)).length
      ? [
        {
          icon: Users,
          label: pick(locale, 'المدربون', 'Coaches'),
          value: match.lineups
            .map((lineup) => lineup.coach?.name)
            .filter((name): name is string => Boolean(name))
            .join(' · '),
        },
      ]
      : []),
  ];

  const homeRecentDb = formMatches
    .filter((row) => belongsToTeam(row.homeTeam.id, match.homeTeam) || belongsToTeam(row.awayTeam.id, match.homeTeam))
    .slice(0, 5);
  const awayRecentDb = formMatches
    .filter((row) => belongsToTeam(row.homeTeam.id, match.awayTeam) || belongsToTeam(row.awayTeam.id, match.awayTeam))
    .slice(0, 5);
  const homeRecent =
    homeRecentDb.length > 0
      ? homeRecentDb
      : homeLastApi.slice(0, 5);
  const awayRecent =
    awayRecentDb.length > 0
      ? awayRecentDb
      : awayLastApi.slice(0, 5);
  const homeForm =
    homeRecentDb.length > 0
      ? toForm(
        match.homeTeam.id,
        formRows
          .filter((row) => row.homeTeamId === match.homeTeam.id || row.awayTeamId === match.homeTeam.id)
          .slice(0, 5)
      )
      : toFormFromMatches(match.homeTeam, homeRecent);
  const awayForm =
    awayRecentDb.length > 0
      ? toForm(
        match.awayTeam.id,
        formRows
          .filter((row) => row.homeTeamId === match.awayTeam.id || row.awayTeamId === match.awayTeam.id)
          .slice(0, 5)
      )
      : toFormFromMatches(match.awayTeam, awayRecent);
  const h2hTally = h2hMatches.reduce(
    (tally, item) => {
      if (typeof item.homeScore !== 'number' || typeof item.awayScore !== 'number') return tally;
      const homeScore = item.homeScore;
      const awayScore = item.awayScore;
      if (homeScore === awayScore) return { ...tally, draw: tally.draw + 1 };
      const homeSideWon = homeScore > awayScore;
      const currentHomeWon =
        (homeSideWon && belongsToTeam(item.homeTeam.id, match.homeTeam)) ||
        (!homeSideWon && belongsToTeam(item.awayTeam.id, match.homeTeam));
      return currentHomeWon ? { ...tally, home: tally.home + 1 } : { ...tally, away: tally.away + 1 };
    },
    { home: 0, draw: 0, away: 0 }
  );

  const pollRow = existingPoll;
  const pollCounts = pollRow ? parsePollOptions(pollRow.options) : null;
  const matchPollView = pollRow && pollCounts
    ? {
      id: pollRow.id,
      matchId: match.id,
      question: pollRow.question,
      category: match.league.name,
      options: [
        { key: 'home' as const, label: match.homeTeam.name, votes: pollCounts.home, logoUrl: match.homeTeam.logoUrl },
        { key: 'draw' as const, label: locale === 'en' ? 'Draw' : 'تعادل', votes: pollCounts.draw },
        { key: 'away' as const, label: match.awayTeam.name, votes: pollCounts.away, logoUrl: match.awayTeam.logoUrl },
      ],
    }
    : null;

  const homeStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.homeTeam));
  const awayStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.awayTeam));
  const hasBrief =
    (homeStats?.possession != null && awayStats?.possession != null) ||
    (homeStats?.shotsOnTarget != null && awayStats?.shotsOnTarget != null) ||
    match.events.some((event) => event.type === 'YELLOW_CARD' || event.type === 'RED_CARD');

  const standingChip = (row?: typeof homeStanding) =>
    row
      ? {
        rank: row.rank,
        points: row.points,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
      }
      : undefined;

  return (
    <SalonStage
      tone="night"
      wide
      compact
      kicker={pick(locale, 'ليلة الملعب', 'Night pitch')}
      title={`${match.homeTeam.name} — ${match.awayTeam.name}`}
      lead={pick(
        locale,
        'مركز المباراة من المصدر الحي: النتيجة، التشكيلة، الأحداث، والنقل إن وُجد. لا أرقام مخترعة.',
        'Match center from the live source: score, lineup, events, and broadcast if filed. Nothing invented.'
      )}
      aside={
        match.status === 'LIVE' || match.status === 'HALFTIME'
          ? pick(locale, 'مباشر', 'Live')
          : match.status === 'FINISHED'
            ? pick(locale, 'نهاية', 'FT')
            : pick(locale, 'من المصدر', 'From source')
      }
      tools={
        <HallFoyer
          label={pick(locale, 'جناح الملعب', 'Pitch suite')}
          items={[
            { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: Calendar },
            { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
            { href: `/league/${match.league.slug}`, label: match.league.name, icon: Trophy },
            { href: `/match/${match.id}`, label: pick(locale, 'هذه المباراة', 'This match'), icon: Shield, current: true },
          ]}
        />
      }
    >
      <div className={`${styles.matchCenter} ${styles.nightPitch}`}>
        <MatchJsonLd
          id={match.id}
          name={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
          startDate={new Date(match.kickoffAt).toISOString()}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          status={match.status}
          venueName={typeof venueName === 'string' ? venueName : undefined}
        />

        {/* ---- HERO STAGE (5.2.1) ---- */}
        <MatchHero
          match={match}
          isLoggedIn={Boolean(session?.user)}
          hasReminder={Boolean(userReminder)}
          hasLicensedStream={Boolean(STREAMING_ENABLED && licensedAsset)}
          userFollow={Boolean(userFollow)}
        />
        <SiteAd placement="match-rail" locale={locale} />
        {sameDayMatches.length > 0 ? (
          <section className={styles.dayRail} aria-label={pick(locale, 'مباريات البطولة اليوم', 'Same-day fixtures')}>
            <header className={styles.dayRailHead}>
              <div>
                <p>{pick(locale, 'نفس البطولة', 'Same competition')}</p>
                <h3>{pick(locale, 'برنامج اليوم', "Today's programme")}</h3>
              </div>
              <span>{String(sameDayMatches.length).padStart(2, '0')}</span>
            </header>
            <ol className={styles.dayRailList}>
              {sameDayMatches.slice(0, 10).map((row, index) => {
                const scored = row.homeScore != null && row.awayScore != null;
                return (
                  <li key={row.id}>
                    <Link href={`/match/${row.id}`} className={styles.dayRailCard}>
                      <span className={styles.dayRailNum}>{String(index + 1).padStart(2, '0')}</span>
                      <LeagueCrest name={row.homeTeam.name} logoUrl={row.homeTeam.logoUrl} className="h-8 w-8" />
                      <span className={styles.dayRailCopy}>
                        <b>
                          {row.homeTeam.name} — {row.awayTeam.name}
                        </b>
                        <i>
                          {scored
                            ? `${row.homeScore}–${row.awayScore}`
                            : row.status === 'LIVE' || row.status === 'HALFTIME'
                              ? pick(locale, 'مباشر', 'Live')
                              : null}
                          {!scored && row.status === 'NOT_STARTED' ? <ClientTime value={row.kickoffAt} /> : null}
                        </i>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <MatchContextPack
          locale={locale}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          leagueName={match.league.name}
          leagueSlug={match.league.slug}
          sheetRows={matchSheetRows}
          events={match.events}
          homeForm={homeForm}
          awayForm={awayForm}
          homeRecent={homeRecent}
          awayRecent={awayRecent}
          h2hMatches={h2hMatches}
          h2hTally={h2hTally}
          showH2hFixtures={homeRecentDb.length > 0 || awayRecentDb.length > 0 || homeLastApi.length > 0}
          tableWindow={tableWindow}
          homeTeamId={match.homeTeam.id}
          awayTeamId={match.awayTeam.id}
          scorers={leagueScorers}
          upcoming={upcomingMatches}
          sameDay={sameDayMatches}
          relatedNews={relatedNews}
        />

        {/* ---- MAIN BODY (5.2.2 Tabs + 5.2.3 Side Rail) ---- */}
        <div className={styles.mainLayout}>
          <div className={styles.mainGrid}>
            {/* Main Column: Match Detail Tabs */}
            <div>
              <MatchDetailTabs
                matchId={match.id}
                status={match.status}
                initialEvents={match.events}
                initialLineups={match.lineups}
                initialStatistics={match.statistics}
                h2hMatches={h2hMatches}
                homeTeamId={match.homeTeam.id}
                awayTeamId={match.awayTeam.id}
                homeTeamName={match.homeTeam.name}
                awayTeamName={match.awayTeam.name}
                homeTeamLogo={match.homeTeam.logoUrl}
                awayTeamLogo={match.awayTeam.logoUrl}
                homeStanding={standingChip(homeStanding)}
                awayStanding={standingChip(awayStanding)}
              />
            </div>

            {/* Side Rail Column: 5.2.3 Interaction Widgets */}
            <aside className="space-y-5">
              {/* 1. Win Probability */}
              {/* Live Match Reactions */}
              <LiveMatchReactions matchId={match.id} locale={locale} />

              {/* 3. Home Fan Poll */}
              {matchPollView ? <HomeFanPoll locale={locale} poll={matchPollView} /> : null}

              {/* 4. AI Analyst Reading */}
              {hasBrief ? (
                <MatchAIAnalyst
                  homeName={match.homeTeam.name}
                  awayName={match.awayTeam.name}
                  homeStats={homeStats}
                  awayStats={awayStats}
                  events={match.events}
                />
              ) : null}

              {/* 5. Score Prediction */}
              <PredictionWidget
                matchId={match.id}
                homeTeamName={match.homeTeam.name}
                awayTeamName={match.awayTeam.name}
                isLoggedIn={Boolean(session?.user)}
                existingPrediction={userPrediction?.predictedOutcome}
              />

              {/* 6. Live Match Chat */}
              <MatchChat
                matchId={match.id}
                isLoggedIn={Boolean(session?.user?.id)}
                initialComments={matchComments.map((comment) => ({
                  id: comment.id,
                  content: comment.content,
                  createdAt: comment.createdAt.toISOString(),
                  user: {
                    name: comment.user.name || 'User',
                    role: comment.user.role,
                  },
                }))}
              />

              {/* Stream Player (if licensed) */}
              {STREAMING_ENABLED && licensedAsset ? (
                <div className={styles.panelCard}>
                  <div id="match-stream-anchor">
                    <MatchStreamPlayer assetId={licensedAsset.id} />
                  </div>
                  <FloatingStreamDock
                    title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
                    targetAnchorId="match-stream-anchor"
                    locale={locale}
                  />
                  <Link
                    href={`/watch/${licensedAsset.id}`}
                    className="mt-3 inline-block text-xs font-black text-[var(--ys-orange)] hover:underline"
                  >
                    {pick(locale, 'فتح صفحة المشاهدة الكاملة', 'Open full watch page')}
                  </Link>
                </div>
              ) : null}

              {/* Related News */}
              {relatedNews.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-foreground)]">
                    {pick(locale, 'تقارير ذات صلة', 'Related reports')}
                  </span>
                  <div className="space-y-2.5">
                    {relatedNews.slice(0, 3).map(
                      (news) =>
                        news.publishedAt && (
                          <NewsCard
                            key={news.id}
                            news={{
                              ...news,
                              excerpt: news.excerpt ?? undefined,
                              featuredImage: news.featuredImage ?? undefined,
                              publishedAt: news.publishedAt,
                            }}
                            variant="horizontal"
                          />
                        )
                    )}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </SalonStage>
  );
}

