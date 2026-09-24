import { cookies, headers } from 'next/headers';
import {
  CalendarDays,
  Clapperboard,
  Flame,
  Newspaper,
  Radio,
  Search,
  Trophy,
  Tv,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/brand/BrandMark';
import { AdSlot } from '@/components/ads/AdSlot';
import { DeskRule, EditionPlate } from '@/components/news/NewsOrnaments';
import { NewsCard } from '@/components/news/NewsCard';
import { LiveTicker } from '@/components/sports/LiveTicker';
import { ClientTime } from '@/components/datetime/ClientTime';
import { HomeStandingsWidget } from '@/components/home/HomeStandingsWidget';
import { HomeScorersWidget } from '@/components/home/HomeScorersWidget';
import { HomeStoriesBar } from '@/components/home/HomeStoriesBar';
import { HomeLeagueTabsWidget } from '@/components/home/HomeLeagueTabsWidget';
import { HomeScorersPodium } from '@/components/home/HomeScorersPodium';
import { FeaturedMatchSpotlight } from '@/components/home/FeaturedMatchSpotlight';
import { HomeFanPoll } from '@/components/home/HomeFanPoll';
import { TransferRumorsHub } from '@/components/news/TransferRumorsHub';
import { PushNotificationBanner } from '@/components/notifications/PushNotificationBanner';
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { toNormalizedMatch } from '@/lib/sports-data/from-db';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { STREAMING_ENABLED } from '@/lib/streaming';
import {
  listLiveCatalog,
  listPublishedLibrary,
  listTonightTvGuide,
} from '@/lib/streaming/catalog';
import { countryFromHeaders } from '@/lib/streaming/entitlement';

function SectionMark({
  folio,
  kicker,
  title,
  lead,
  en,
}: {
  folio: string;
  kicker: string;
  title: string;
  lead?: string;
  en: boolean;
}) {
  return (
    <div className="home-section-mark">
      <div className="home-section-mark-row">
        <span aria-hidden>{folio}</span>
        <p className={`home-section-kicker ${en ? 'is-en' : ''}`}>{kicker}</p>
      </div>
      <h2>{title}</h2>
      {lead ? <p className="home-section-lead">{lead}</p> : null}
      <DeskRule className="mt-3 max-w-xs opacity-45" />
    </div>
  );
}

function isLive(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

function scoreLabel(match: NormalizedMatch) {
  if (typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
    return `${match.homeScore} : ${match.awayScore}`;
  }
  return null;
}

function HomeMatchTile({
  match,
  liveLabel,
  watchLabel,
  hasStream,
  en,
}: {
  match: NormalizedMatch;
  liveLabel: string;
  watchLabel: string;
  hasStream: boolean;
  en: boolean;
}) {
  const live = isLive(match.status);
  const score = scoreLabel(match);

  return (
    <Link href={`/match/${match.id}`} className="home-match-tile salon-sheet">
      <span className="home-match-league">{match.league.name}</span>
      <div className="home-match-duel">
        <div className="home-match-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.homeTeam.logoUrl || '/placeholder-team.png'} alt="" />
          <strong>{match.homeTeam.name}</strong>
        </div>
        <div className="home-match-mid">
          {score ? (
            <em className="tabular-nums">{score}</em>
          ) : (
            <ClientTime
              value={match.kickoffAt}
              className="tabular-nums text-[13px] font-bold text-muted-foreground"
              options={{ hour: '2-digit', minute: '2-digit' }}
            />
          )}
          {live && match.minute != null ? (
            <span className="home-match-minute tabular-nums">{match.minute}′</span>
          ) : null}
        </div>
        <div className="home-match-side is-away">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.awayTeam.logoUrl || '/placeholder-team.png'} alt="" />
          <strong>{match.awayTeam.name}</strong>
        </div>
      </div>
      {live ? (
        <span className={`home-match-live ${en ? 'is-en' : ''}`}>
          <i />
          {liveLabel}
        </span>
      ) : hasStream ? (
        <span className="home-match-watch">{watchLabel}</span>
      ) : null}
    </Link>
  );
}

export async function HomeHouse() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const en = locale !== 'ar';
  const year = new Date().getFullYear();
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);
  const country = countryFromHeaders(await headers());
  const scorersSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const newsSelect = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    featuredImage: true,
    category: true,
    publishedAt: true,
    isPremium: true,
    sourceLocale: true,
  } as const;

  const matchSelect = {
    id: true,
    externalId: true,
    status: true,
    homeScore: true,
    awayScore: true,
    minute: true,
    kickoffAt: true,
    homeTeam: {
      select: { id: true, externalId: true, name: true, slug: true, logoUrl: true },
    },
    awayTeam: {
      select: { id: true, externalId: true, name: true, slug: true, logoUrl: true },
    },
    league: {
      select: { id: true, externalId: true, name: true, slug: true, logoUrl: true },
    },
  } as const;

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const [
    allTopNews,
    topLeagues,
    actionRows,
    tableSeed,
    topScorersRaw,
    liveCatalog,
    tvRows,
    library,
    todayMatchCount,
    goalCount,
    yellowCount,
    redCount,
    apiLiveMatches,
    apiTodayMatches,
    apiStandings,
    apiTopScorers,
  ] = await Promise.all([
    prisma.news
      .findMany({
        where: newsVisibleWhere(locale),
        orderBy: { publishedAt: 'desc' },
        take: 24,
        select: newsSelect,
      })
      .catch(() =>
        prisma.news
          .findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            take: 24,
            select: newsSelect,
          })
          .catch(() => [])
      ),
    prisma.league
      .findMany({
        take: 14,
        select: { id: true, name: true, slug: true, logoUrl: true },
      })
      .catch(() => []),
    prisma.match
      .findMany({
        where: {
          OR: [
            { status: { in: ['LIVE', 'HALFTIME'] } },
            { kickoffAt: { gte: start, lt: end } },
          ],
        },
        orderBy: { kickoffAt: 'asc' },
        take: 16,
        select: matchSelect,
      })
      .catch(() => []),
    prisma.standing
      .findFirst({
        where: { rank: 1 },
        orderBy: { seasonId: 'desc' },
        select: { leagueId: true, seasonId: true },
      })
      .catch(() => null),
    prisma.matchEvent
      .groupBy({
        by: ['playerId'],
        where: {
          type: { in: ['GOAL', 'PENALTY'] },
          playerId: { not: null },
          match: { kickoffAt: { gte: scorersSince } },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      })
      .catch(() => []),
    STREAMING_ENABLED
      ? listLiveCatalog({ country }).catch(() => [])
      : Promise.resolve([]),
    listTonightTvGuide({ start, end }).catch(() => []),
    STREAMING_ENABLED
      ? listPublishedLibrary({ take: 8 }).catch(() => [])
      : Promise.resolve([]),
    prisma.match
      .count({
        where: {
          OR: [
            { status: { in: ['LIVE', 'HALFTIME'] } },
            { kickoffAt: { gte: start, lt: end } },
          ],
        },
      })
      .catch(() => 0),
    prisma.matchEvent
      .count({
        where: {
          type: { in: ['GOAL', 'PENALTY', 'OWN_GOAL'] },
          match: { kickoffAt: { gte: start, lt: end } },
        },
      })
      .catch(() => 0),
    prisma.matchEvent
      .count({
        where: {
          type: { in: ['YELLOW_CARD', 'YELLOW'] },
          match: { kickoffAt: { gte: start, lt: end } },
        },
      })
      .catch(() => 0),
    prisma.matchEvent
      .count({
        where: {
          type: { in: ['RED_CARD', 'RED'] },
          match: { kickoffAt: { gte: start, lt: end } },
        },
      })
      .catch(() => 0),
    sportsData.getLiveMatches().catch(() => []),
    sportsData.getMatchesByDate(todayDateStr).catch(() => []),
    sportsData.getStandings('39', '2024').catch(() => []),
    sportsData.getTopScorers('39', '2024').catch(() => []),
  ]);

  const dbStandings = tableSeed
    ? await prisma.standing
        .findMany({
          where: { leagueId: tableSeed.leagueId, seasonId: tableSeed.seasonId },
          take: 6,
          include: { team: true, league: true },
          orderBy: { rank: 'asc' },
        })
        .catch(() => [])
    : [];

  const standings = apiStandings.length > 0
    ? apiStandings.slice(0, 6).map((s) => ({
        id: s.team.id,
        points: s.points,
        rank: s.rank,
        team: { name: s.team.name, logoUrl: s.team.logoUrl || null },
        league: { name: 'الدوري الإنجليزي الممتاز', slug: 'premier-league' },
      }))
    : dbStandings;

  const scorerPlayerIds = topScorersRaw
    .map((row) => row.playerId)
    .filter((id): id is string => Boolean(id));

  const scorerPlayers = scorerPlayerIds.length
    ? await prisma.player
        .findMany({
          where: { id: { in: scorerPlayerIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            photoUrl: true,
            teams: {
              where: { to: null },
              take: 1,
              select: { team: { select: { name: true } } },
            },
          },
        })
        .catch(() => [])
    : [];

  const dbScorers = topScorersRaw.flatMap((row) => {
    const player = scorerPlayers.find((entry) => entry.id === row.playerId);
    if (!player?.name) return [];
    return [
      {
        goals: row._count.id,
        player: {
          id: player.id,
          name: player.name,
          slug: player.slug,
          photoUrl: player.photoUrl,
        },
        teamName: player.teams[0]?.team.name,
      },
    ];
  });

  const scorers = apiTopScorers.length > 0
    ? apiTopScorers.slice(0, 8).map((s) => ({
        goals: s.goals,
        player: {
          id: s.player.id,
          name: s.player.name,
          slug: s.player.slug,
          photoUrl: s.player.photoUrl || null,
        },
        teamName: s.teamName,
      }))
    : dbScorers;

  const liveMatches = (apiLiveMatches.length > 0
    ? apiLiveMatches
    : apiTodayMatches.length > 0
    ? apiTodayMatches
    : actionRows.map(toNormalizedMatch)
  ).sort((first, second) => {
    const liveScore = (status: string) => (isLive(status) ? 0 : 1);
    return liveScore(first.status) - liveScore(second.status);
  });

  const liveNow = liveMatches.filter((match) => isLive(match.status));
  const liveCount = liveNow.length;

  const streamMatchIds = new Set(
    liveCatalog.map((asset) => asset.match?.id).filter((id): id is string => Boolean(id))
  );

  const localizedNews = await overlayNewsList(allTopNews, locale).catch(() => allTopNews);
  const featuredNews = localizedNews[0];
  const topNews = localizedNews.slice(1, 5);
  const latestGrid = localizedNews.slice(5, 11);
  const leagueNews = localizedNews.filter((item) => item.id !== featuredNews?.id).slice(0, 8);
  const photoNews = localizedNews.filter((item) => item.featuredImage).slice(0, 6);

  const licensedNow = liveCatalog.slice(0, 4);
  const tonightGuide = tvRows.slice(0, 4);
  const vodShows = library.slice(0, 6);
  const showLicensed = licensedNow.length > 0;
  const showTv = !showLicensed && tonightGuide.length > 0;
  const showVod = STREAMING_ENABLED && vodShows.length > 0;

  const secondaryCta =
    licensedNow.length > 0
      ? { href: '/watch' as const, label: t('cta_watch') }
      : { href: '/live' as const, label: t('cta_live') };

  const quickLinks = [
    { href: '/matches' as const, label: t('quick_matches'), icon: CalendarDays },
    { href: '/live' as const, label: t('quick_live'), icon: Radio },
    { href: '/leagues' as const, label: t('quick_leagues'), icon: Trophy },
    { href: '/news' as const, label: t('quick_news'), icon: Newspaper },
    { href: '/watch' as const, label: t('quick_watch'), icon: Clapperboard },
    { href: '/tv-guide' as const, label: t('quick_guide'), icon: Tv },
    { href: '/search' as const, label: t('quick_search'), icon: Search },
  ];

  const doors = [
    { href: '/matches' as const, title: t('door_matches'), hint: t('door_matches_hint') },
    { href: '/leagues' as const, title: t('door_leagues'), hint: t('door_leagues_hint') },
    { href: '/news' as const, title: t('door_news'), hint: t('door_news_hint') },
    { href: '/live' as const, title: t('door_live'), hint: t('door_live_hint') },
    { href: '/watch' as const, title: t('door_watch'), hint: t('door_watch_hint') },
    { href: '/tv-guide' as const, title: t('door_guide'), hint: t('door_guide_hint') },
    { href: '/search' as const, title: t('door_search'), hint: t('door_search_hint') },
    { href: '/leaderboard' as const, title: t('board_title'), hint: t('board_lead') },
  ];

  const stats = [
    { value: todayMatchCount, label: t('stat_matches') },
    { value: goalCount, label: t('stat_goals') },
    { value: yellowCount, label: t('stat_yellow') },
    { value: redCount, label: t('stat_red') },
    { value: liveCount, label: t('stat_live') },
  ];

  return (
    <div className="league-salon-page home-house home-portal relative pb-24">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />

      <LiveTicker matches={liveMatches} />

      <main className="relative z-10 mx-auto mt-0 max-w-[1400px] space-y-8 px-4 sm:px-6">
        <HeroEnter>
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/90 via-card/60 to-card/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="pointer-events-none absolute -top-24 right-1/4 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <BrandMark size={48} priority className="drop-shadow-[0_8px_16px_rgba(249,115,22,0.3)]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      {t('kicker')}
                    </span>
                    <EditionPlate year={year} label={t('folio')} className="watch-edition" />
                  </div>
                  <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-foreground">
                    YALLA SPORT
                  </h1>
                </div>
              </div>

              {/* Live Count & Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-black transition-all ${
                  liveCount > 0
                    ? 'border-red-500/40 bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10'
                    : 'border-white/10 bg-white/5 text-foreground/70'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${liveCount > 0 ? 'bg-red-500 animate-ping' : 'bg-primary'}`} />
                  <strong className="tabular-nums text-sm">{liveCount}</strong>
                  <span>{t('live_label')}</span>
                </span>

                <Link
                  href="/matches"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{t('cta_matches')}</span>
                </Link>

                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-foreground hover:bg-white/10 hover:text-primary transition-all"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>{secondaryCta.label}</span>
                </Link>
              </div>
            </div>

            {/* Quick Navigation Portal Strip */}
            <div className="relative mt-5 flex flex-wrap items-center gap-2">
              {quickLinks.map((ql) => (
                <Link
                  key={ql.href}
                  href={ql.href}
                  className="group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-foreground/80 backdrop-blur-md transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <ql.icon className="h-3.5 w-3.5 text-primary transition-transform group-hover:scale-110" />
                  <span>{ql.label}</span>
                </Link>
              ))}
            </div>
          </header>
        </HeroEnter>

        {/* Live Stories Strip (Match Highlights, Reels, Inside Training) */}
        <Reveal>
          <HomeStoriesBar locale={locale} />
        </Reveal>

        {/* Live Goal & Match Push Alerts Banner */}
        <Reveal>
          <PushNotificationBanner locale={locale} />
        </Reveal>

        {/* Hero News & Top Stories Desk */}
        <Reveal>
          <section className="home-hero-desk grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-primary animate-bounce" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {t('news_top')}
                  </h3>
                </div>
                <Link href="/news" className="text-xs font-bold text-primary hover:underline">
                  {t('news_cta')}
                </Link>
              </div>
              {featuredNews ? (
                <NewsCard news={featuredNews as any} variant="hero" />
              ) : (
                <div className="salon-sheet flex min-h-[220px] items-center justify-center rounded-2xl px-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('news_empty')}</p>
                </div>
              )}
            </div>
            <aside className="space-y-3 xl:col-span-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-primary">
                  {en ? 'Latest Desk Updates' : 'آخر تقارير الغرفة'}
                </h3>
                <Link href="/news" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                  {en ? 'View All' : 'عرض الكل'}
                </Link>
              </div>
              <div className="salon-sheet home-top-news rounded-2xl p-2.5 space-y-1">
                {topNews.length > 0 ? (
                  topNews.map((news) => (
                    <NewsCard key={news.id} news={news as any} variant="slim" />
                  ))
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('news_empty')}</p>
                )}
              </div>
            </aside>
          </section>
        </Reveal>

        {/* Featured Match of the Day Spotlight */}
        <Reveal>
          <FeaturedMatchSpotlight locale={locale} />
        </Reveal>

        {/* Match rail */}
        <Reveal>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionMark
                folio="01"
                kicker={t('programme_kicker')}
                title={t('programme_title')}
                lead={t('programme_lead')}
                en={en}
              />
              <Link href="/matches" className="watch-chip-link is-solid">
                {t('programme_cta')}
              </Link>
            </div>
            {liveMatches.length > 0 ? (
              <div className="home-match-rail no-scrollbar">
                {liveMatches.map((match) => (
                  <HomeMatchTile
                    key={match.id}
                    match={match}
                    liveLabel={t('live_badge')}
                    watchLabel={t('watch_badge')}
                    hasStream={streamMatchIds.has(match.id)}
                    en={en}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center dark:border-border">
                <Radio className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('programme_empty')}</p>
              </div>
            )}
          </section>
        </Reveal>

        {/* Quick links */}
        <Reveal>
          <nav className="home-quick-bar salon-sheet" aria-label={t('quick_label')}>
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="home-quick-link">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </Reveal>

        {/* Multi-League Standings Explorer & Golden Boot Podium */}
        <Reveal>
          <HomeLeagueTabsWidget locale={locale} />
        </Reveal>

        <Reveal>
          <HomeScorersPodium locale={locale} />
        </Reveal>

        {/* Leagues */}
        {topLeagues.length > 0 ? (
          <Reveal>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className={`home-section-kicker ${en ? 'is-en' : ''}`}>{t('leagues_title')}</p>
                <Link href="/leagues" className="text-[11px] font-semibold text-muted-foreground hover:text-primary">
                  {t('leagues_cta')}
                </Link>
              </div>
              <div className="salon-sheet rounded-2xl px-4 py-5">
                <div className="no-scrollbar flex items-center gap-8 overflow-x-auto">
                  {topLeagues.map((league) => (
                    <Link
                      key={league.id}
                      href={`/league/${league.slug}`}
                      className="group flex shrink-0 flex-col items-center gap-2.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card p-2 transition-transform group-hover:-translate-y-1 dark:border-border dark:bg-card/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={league.logoUrl || '/placeholder.svg'}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="max-w-[5.5rem] truncate text-[10px] font-semibold text-muted-foreground group-hover:text-foreground dark:group-hover:text-white">
                        {league.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* Main column + sidebar */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-10 xl:col-span-8">
            <Reveal>
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <SectionMark folio="02" kicker={t('news_kicker')} title={t('news_title')} en={en} />
                  <Link href="/news" className="text-[11px] font-semibold text-primary hover:underline">
                    {t('news_cta')}
                  </Link>
                </div>
                {latestGrid.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {latestGrid.map((news) => (
                      <NewsCard key={news.id} news={news as any} variant="vertical" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('news_empty_more')}</p>
                )}
              </section>
            </Reveal>

            {/* Transfer Market Radar & Rumors */}
            <Reveal>
              <TransferRumorsHub locale={locale} />
            </Reveal>

            <Reveal>
              <div className="overflow-hidden rounded-2xl">
                <AdSlot placement="inline" width={728} height={90} />
              </div>
            </Reveal>

            {leagueNews.length > 0 ? (
              <Reveal>
                <section className="space-y-5">
                  <SectionMark
                    folio="03"
                    kicker={t('news_kicker')}
                    title={t('news_league_title')}
                    en={en}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {leagueNews.map((news) => (
                      <NewsCard key={`league-${news.id}`} news={news as any} variant="slim" />
                    ))}
                  </div>
                </section>
              </Reveal>
            ) : null}

            {showLicensed || showTv || showVod ? (
              <Reveal>
                <section className="space-y-5">
                  {showLicensed ? (
                    <>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <SectionMark
                          folio="04"
                          kicker={t('licensed_kicker')}
                          title={t('licensed_title')}
                          lead={t('licensed_lead')}
                          en={en}
                        />
                        <Link href="/live" className="text-[11px] font-semibold text-primary hover:underline">
                          {t('licensed_cta')}
                        </Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {licensedNow.map((asset) => {
                          const label = asset.match
                            ? `${asset.match.homeTeam.name} × ${asset.match.awayTeam.name}`
                            : asset.channel?.name || t('licensed_title');
                          return (
                            <Link
                              key={asset.id}
                              href={`/watch/${asset.id}`}
                              className="home-broadcast-card salon-sheet"
                            >
                              <span className={`home-broadcast-meta ${en ? 'is-en' : ''}`}>
                                {asset.channel?.name || asset.match?.league.name || t('licensed_kicker')}
                              </span>
                              <strong>{label}</strong>
                              {asset.status === 'LIVE' ? (
                                <em className={en ? 'uppercase tracking-[0.18em]' : ''}>{t('live_label')}</em>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : null}

                  {showTv ? (
                    <>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <SectionMark folio="04" kicker={t('tv_kicker')} title={t('tv_title')} en={en} />
                        <Link href="/tv-guide" className="text-[11px] font-semibold text-primary hover:underline">
                          {t('tv_cta')}
                        </Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {tonightGuide.map((row) => (
                          <Link
                            key={`${row.matchId}-${row.channelId}`}
                            href={`/match/${row.match.id}`}
                            className="home-broadcast-card salon-sheet"
                          >
                            <span className={`home-broadcast-meta ${en ? 'is-en' : ''}`}>
                              {row.channel.name}
                            </span>
                            <strong>
                              {row.match.homeTeam.name} × {row.match.awayTeam.name}
                            </strong>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {showVod ? (
                    <>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <SectionMark folio="05" kicker={t('vod_kicker')} title={t('videos_title')} en={en} />
                        <Link href="/watch" className="text-[11px] font-semibold text-primary hover:underline">
                          {t('vod_cta')}
                        </Link>
                      </div>
                      <div className="home-video-rail no-scrollbar">
                        {vodShows.map((show) => (
                          <Link key={show.id} href={`/vod/${show.slug}`} className="home-video-card">
                            <div className="home-video-poster">
                              {show.posterUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={show.posterUrl} alt="" />
                              ) : (
                                <span className="home-video-fallback" />
                              )}
                              <i className="home-video-play" aria-hidden />
                            </div>
                            <strong>{show.title}</strong>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              </Reveal>
            ) : null}

            {photoNews.length >= 3 ? (
              <Reveal>
                <section className="space-y-5">
                  <SectionMark folio="06" kicker={t('photos_kicker')} title={t('photos_title')} en={en} />
                  <div className="home-photo-rail no-scrollbar">
                    {photoNews.map((news) => (
                      <Link key={`photo-${news.id}`} href={`/news/${news.slug}`} className="home-photo-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={news.featuredImage!} alt="" />
                        <span>{news.title}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              </Reveal>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 xl:col-span-4">
            {/* Fan Matchday Poll */}
            <Reveal>
              <HomeFanPoll locale={locale} />
            </Reveal>

            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-border dark:border-border">
                <AdSlot placement="sidebar" width={300} height={250} />
              </div>
            </Reveal>

            {scorers.length > 0 ? (
              <Reveal>
                <div className="salon-sheet rounded-[1.4rem] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className={`text-[11px] font-semibold tracking-[0.16em] text-primary ${en ? 'uppercase' : ''}`}>
                      {t('players_title')}
                    </h3>
                    <Link href="/leagues" className="text-[11px] font-semibold text-muted-foreground hover:text-primary">
                      {t('scorers_cta')}
                    </Link>
                  </div>
                  <div className="home-player-rail">
                    {scorers.slice(0, 6).map((row) => (
                      <Link key={row.player.id} href={`/player/${row.player.slug}`} className="home-player-chip">
                        <span className="home-player-avatar">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.player.photoUrl || '/placeholder-player.svg'} alt="" />
                        </span>
                        <strong>{row.player.name}</strong>
                        <em className="tabular-nums">{row.goals}</em>
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}

            <Reveal>
              <HomeStandingsWidget standings={standings} />
            </Reveal>

            <Reveal>
              <HomeScorersWidget scorers={scorers.slice(0, 6)} />
            </Reveal>

            {liveNow.length > 0 ? (
              <Reveal>
                <div className="salon-sheet rounded-[1.4rem] p-6">
                  <h3 className={`mb-4 text-[11px] font-semibold tracking-[0.16em] text-primary ${en ? 'uppercase' : ''}`}>
                    {t('live_widget_title')}
                  </h3>
                  <div className="space-y-3">
                    {liveNow.slice(0, 5).map((match) => (
                      <Link key={`live-${match.id}`} href={`/match/${match.id}`} className="home-live-row">
                        <span className="home-live-dot" />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-bold">
                          {match.homeTeam.name} × {match.awayTeam.name}
                        </span>
                        <strong className="tabular-nums text-[12px]">
                          {scoreLabel(match) ?? '–'}
                        </strong>
                      </Link>
                    ))}
                  </div>
                  <Link href="/live" className="mt-4 inline-block text-[11px] font-semibold text-primary">
                    {t('cta_live')}
                  </Link>
                </div>
              </Reveal>
            ) : null}

            <Reveal>
              <div className="salon-sheet rounded-[1.4rem] p-6">
                <h3 className={`mb-4 text-[11px] font-semibold tracking-[0.16em] text-primary ${en ? 'uppercase' : ''}`}>
                  {t('stats_title')}
                </h3>
                <div className="home-stats-grid">
                  {stats.map((stat) => (
                    <div key={stat.label} className="home-stat-cell">
                      <strong className="tabular-nums">{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {showLicensed || STREAMING_ENABLED ? (
              <Reveal>
                <Link href={showLicensed ? '/watch' : '/live'} className="home-watch-promo salon-sheet">
                  <span className={`home-section-kicker ${en ? 'is-en' : ''}`}>{t('watch_promo_kicker')}</span>
                  <strong>{t('watch_promo_title')}</strong>
                  <em>{t('watch_promo_cta')}</em>
                </Link>
              </Reveal>
            ) : null}

            <Reveal>
              <div className="home-side-doors">
                {doors.slice(0, 6).map((door) => (
                  <Link key={door.href} href={door.href} className="home-side-door salon-sheet">
                    <strong>{door.title}</strong>
                  </Link>
                ))}
              </div>
            </Reveal>
          </aside>
        </div>

        <Reveal>
          <section className="space-y-5">
            <SectionMark folio="07" kicker={t('doors_kicker')} title={t('doors_title')} en={en} />
            <div className="home-doors">
              {doors.map((door, index) => (
                <Link key={`door-${door.href}`} href={door.href} className="home-door salon-sheet">
                  <span className="tabular-nums text-[10px] font-bold text-muted-foreground dark:text-foreground/25">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong>{door.title}</strong>
                  <span>{door.hint}</span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="home-board-teaser salon-sheet">
            <div>
              <p className={`home-section-kicker ${en ? 'is-en' : ''}`}>{t('board_kicker')}</p>
              <h2>{t('board_title')}</h2>
              <p>{t('board_lead')}</p>
            </div>
            <Link href="/leaderboard" className="watch-chip-link is-solid">
              {t('board_cta')}
            </Link>
          </section>
        </Reveal>
      </main>
    </div>
  );
}
