import { ClientTime } from '@/components/datetime/ClientTime';
import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@/generated/prisma';
import { localizeEntityMap, newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { getLocale, getTranslations } from 'next-intl/server';
import { SearchTicket } from './SearchTicket';
import { canShowScore, clampSeekQuery, parseSeekKind, seekHref, type SeekKind } from './seek';
import {
  Search as SearchIcon,
  Trophy,
  Shield,
  Users,
  Newspaper,
  Calendar,
  Sparkles,
  Flame,
} from 'lucide-react';

function newsSeekWhere(locale: string, q: string): Prisma.NewsWhereInput {
  const contains = { contains: q, mode: 'insensitive' as const };
  return {
    AND: [
      newsVisibleWhere(locale),
      {
        OR: [
          { title: contains },
          { content: contains },
          { excerpt: contains },
          {
            translations: {
              some: {
                locale,
                status: 'APPROVED',
                OR: [{ title: contains }, { content: contains }, { excerpt: contains }],
              },
            },
          },
        ],
      },
    ],
  };
}

function nameOf(map: Map<string, string>, type: string, id: string, fallback: string) {
  return map.get(`${type}:${id}`) || fallback;
}

export async function SearchHouse({
  q,
  kindParam,
}: {
  q?: string;
  kindParam?: string;
}) {
  const t = await getTranslations('seek');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const query = clampSeekQuery(q);
  const kind = parseSeekKind(kindParam);
  const contains = { contains: query, mode: 'insensitive' as const };
  const matchWhere: Prisma.MatchWhereInput = {
    OR: [
      { homeTeam: { name: contains } },
      { awayTeam: { name: contains } },
      { league: { name: contains } },
    ],
  };

  const [deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows] = await Promise.all([
    prisma.news.count({ where: newsVisibleWhere(locale) }),
    prisma.team.count(),
    prisma.player.count(),
    prisma.league.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.match.findMany({
      orderBy: { kickoffAt: 'desc' },
      take: 24,
      select: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    }),
  ]);

  const empty = {
    news: [] as Array<{
      id: string;
      slug: string;
      title: string;
      excerpt: string | null;
      publishedAt: Date | null;
      featuredImage: string | null;
      category: string;
      sourceLocale: string | null;
    }>,
    teams: [] as Array<{ id: string; name: string; slug: string; logoUrl: string | null }>,
    players: [] as Array<{
      id: string;
      name: string;
      slug: string;
      photoUrl: string | null;
      position: string | null;
    }>,
    leagues: [] as Array<{
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      country: string | null;
    }>,
    matches: [] as Array<{
      id: string;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      minute: number | null;
      kickoffAt: Date;
      homeTeam: { id: string; name: string; slug: string; logoUrl: string | null };
      awayTeam: { id: string; name: string; slug: string; logoUrl: string | null };
      league: { id: string; name: string; slug: string };
    }>,
  };

  const found = query
    ? await Promise.all([
      prisma.news.findMany({
        where: newsSeekWhere(locale, query),
        take: 12,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          featuredImage: true,
          category: true,
          sourceLocale: true,
        },
      }),
      prisma.team.findMany({
        where: { name: contains },
        take: 12,
        select: { id: true, name: true, slug: true, logoUrl: true },
      }),
      prisma.player.findMany({
        where: { name: contains },
        take: 12,
        select: { id: true, name: true, slug: true, photoUrl: true, position: true },
      }),
      prisma.league.findMany({
        where: { name: contains },
        take: 8,
        select: { id: true, name: true, slug: true, logoUrl: true, country: true },
      }),
      prisma.match.findMany({
        where: matchWhere,
        take: 12,
        orderBy: { kickoffAt: 'desc' },
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          minute: true,
          kickoffAt: true,
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          league: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]).then(([newsRows, teams, players, leagues, matches]) => ({
      news: newsRows,
      teams,
      players,
      leagues,
      matches,
    }))
    : empty;

  const news = query ? await overlayNewsList(found.news, locale) : [];
  const names = await localizeEntityMap(
    [
      ...found.teams.map((row) => ({ entityType: 'TEAM', entityId: row.id, fallback: row.name })),
      ...found.players.map((row) => ({ entityType: 'PLAYER', entityId: row.id, fallback: row.name })),
      ...found.leagues.map((row) => ({ entityType: 'LEAGUE', entityId: row.id, fallback: row.name })),
      ...found.matches.flatMap((row) => [
        { entityType: 'TEAM', entityId: row.homeTeam.id, fallback: row.homeTeam.name },
        { entityType: 'TEAM', entityId: row.awayTeam.id, fallback: row.awayTeam.name },
        { entityType: 'LEAGUE', entityId: row.league.id, fallback: row.league.name },
      ]),
    ],
    locale
  );

  const counts = {
    news: news.length,
    teams: found.teams.length,
    players: found.players.length,
    leagues: found.leagues.length,
    matches: found.matches.length,
  };
  const total = counts.news + counts.teams + counts.players + counts.leagues + counts.matches;
  const show = (drawer: Exclude<SeekKind, 'all'>) => kind === 'all' || kind === drawer;
  const visible =
    (show('news') ? counts.news : 0) +
    (show('teams') ? counts.teams : 0) +
    (show('players') ? counts.players : 0) +
    (show('leagues') ? counts.leagues : 0) +
    (show('matches') ? counts.matches : 0);

  const kinds: Array<{ id: SeekKind; label: string; n: number; icon: any }> = [
    { id: 'all', label: t('kind_all'), n: total, icon: Sparkles },
    { id: 'matches', label: t('kind_matches'), n: counts.matches, icon: Calendar },
    { id: 'teams', label: t('kind_teams'), n: counts.teams, icon: Shield },
    { id: 'players', label: t('kind_players'), n: counts.players, icon: Users },
    { id: 'leagues', label: t('kind_leagues'), n: counts.leagues, icon: Trophy },
    { id: 'news', label: t('kind_news'), n: counts.news, icon: Newspaper },
  ];

  const drawers = [
    { no: '01', title: t('drawer_news'), body: t('drawer_news_body'), n: deskNews, href: '/news', icon: Newspaper },
    { no: '02', title: t('drawer_teams'), body: t('drawer_teams_body'), n: deskTeams, href: '/leagues', icon: Shield },
    { no: '03', title: t('drawer_players'), body: t('drawer_players_body'), n: deskPlayers, href: '/compare-players', icon: Users },
    { no: '04', title: t('drawer_leagues'), body: t('drawer_leagues_body'), n: deskLeagues, href: '/leagues', icon: Trophy },
    { no: '05', title: t('drawer_matches'), body: t('drawer_matches_body'), n: deskMatches, href: '/matches', icon: Calendar },
  ];

  const suggestions = [
    ...new Set(
      chipRows.flatMap((row) => [row.homeTeam.name, row.awayTeam.name, row.league.name].filter(Boolean))
    ),
  ].slice(0, 6);

  return (
    <div className="salon-stage salon-seek is-wide search-ticket relative min-h-screen overflow-hidden pb-16">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/15 via-emerald-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pt-8">
        {/* ——— Search Command Center Hero ——— */}
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <HeroEnter className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <BrandMark size={44} priority />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      {t('kicker')}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-mono text-emerald-400">
                      {liveMatches} {t('tally_live_short')}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {t('house')}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {t('title')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                {t('standfirst')}
              </p>
            </div>

            {/* Omnibox Search Input */}
            <div className="mt-4">
              <SearchTicket initialQuery={query} kind={kind} />
            </div>

            {/* Quick popular search chips when no query */}
            {!query && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span>{isAr ? 'أكثر بحثاً:' : 'Trending Seek:'}</span>
                </span>
                {suggestions.map((chip) => (
                  <Link
                    key={chip}
                    href={`/search?q=${encodeURIComponent(chip)}`}
                    className="rounded-xl border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/10 shadow-sm"
                  >
                    {chip}
                  </Link>
                ))}
              </div>
            )}

            {/* Search Metadata & Category Pills when query is active */}
            {query && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border pt-4">
                  <p>
                    {t('written')} <strong className="text-foreground font-bold">"{query}"</strong>
                  </p>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">
                    {t('hits', { n: String(visible) })}
                  </span>
                </div>

                {/* Filter Tabs */}
                <nav className="flex flex-wrap gap-2" aria-label={t('kinds_label')}>
                  {kinds.map((item) => {
                    const active = kind === item.id;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={seekHref(query, item.id)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                        <span className={`font-mono text-[11px] rounded px-1.5 py-0.2 ${active ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {item.n}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </HeroEnter>
        </header>

        {/* ——— Results Stage (when query exists) ——— */}
        {query && (
          <Reveal>
            <div className="space-y-10">
              {visible === 0 && (
                <div className="rounded-3xl border border-border bg-card/40 p-12 text-center backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                    <SearchIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('empty_title')}</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {kind === 'all' ? t('empty_body') : t('empty_drawer')}
                  </p>
                </div>
              )}

              {/* Matches Group */}
              {show('matches') && found.matches.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {t('kind_matches')} ({found.matches.length})
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {found.matches.map((row) => {
                      const isLive = row.status === 'LIVE';
                      const homeName = nameOf(names, 'TEAM', row.homeTeam.id, row.homeTeam.name);
                      const awayName = nameOf(names, 'TEAM', row.awayTeam.id, row.awayTeam.name);
                      const leagueName = nameOf(names, 'LEAGUE', row.league.id, row.league.name);
                      return (
                        <Link
                          key={row.id}
                          href={`/match/${row.id}`}
                          className="group rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card/90 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3 text-[11px]">
                            <span className="text-muted-foreground truncate font-medium">{leagueName}</span>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {row.minute ? `${row.minute}′` : 'LIVE'}
                              </span>
                            ) : (
                              <ClientTime value={row.kickoffAt} className="font-mono text-muted-foreground" />
                            )}
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 truncate">
                                {row.homeTeam.logoUrl ? (
                                  <img src={row.homeTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                                    {homeName.charAt(0)}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-foreground truncate">{homeName}</span>
                              </div>
                              {canShowScore(row.status, row.homeScore, row.awayScore) && (
                                <span className="font-mono text-xs font-black text-foreground ps-2 bg-secondary/80 px-2 py-0.5 rounded">
                                  {row.homeScore}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 truncate">
                                {row.awayTeam.logoUrl ? (
                                  <img src={row.awayTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                                    {awayName.charAt(0)}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-foreground truncate">{awayName}</span>
                              </div>
                              {canShowScore(row.status, row.homeScore, row.awayScore) && (
                                <span className="font-mono text-xs font-black text-foreground ps-2 bg-secondary/80 px-2 py-0.5 rounded">
                                  {row.awayScore}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Teams Group */}
              {show('teams') && found.teams.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {t('kind_teams')} ({found.teams.length})
                    </h2>
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {found.teams.map((row) => (
                      <Link
                        key={row.id}
                        href={`/team/${row.slug}`}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-card/60 p-4 text-center transition-all hover:border-cyan-400/50 hover:bg-card/90 shadow-sm"
                      >
                        <div className="flex h-14 w-14 items-center justify-center mb-2.5 p-2 rounded-2xl bg-secondary/40 group-hover:scale-105 transition-transform">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt="" className="h-10 w-10 object-contain" />
                          ) : (
                            <span className="font-bold text-base text-cyan-400">
                              {nameOf(names, 'TEAM', row.id, row.name).charAt(0)}
                            </span>
                          )}
                        </div>
                        <strong className="text-xs font-bold text-foreground truncate w-full group-hover:text-cyan-400 transition-colors">
                          {nameOf(names, 'TEAM', row.id, row.name)}
                        </strong>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Leagues Group */}
              {show('leagues') && found.leagues.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {t('kind_leagues')} ({found.leagues.length})
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {found.leagues.map((row) => (
                      <Link
                        key={row.id}
                        href={`/league/${row.slug}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3.5 transition-all hover:border-amber-400/50 hover:bg-card/90 shadow-sm"
                      >
                        {row.logoUrl ? (
                          <img src={row.logoUrl} alt="" className="h-9 w-9 object-contain flex-shrink-0" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex-shrink-0">
                            {nameOf(names, 'LEAGUE', row.id, row.name).charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <strong className="text-xs font-bold text-foreground block truncate group-hover:text-amber-400 transition-colors">
                            {nameOf(names, 'LEAGUE', row.id, row.name)}
                          </strong>
                          <span className="text-[11px] text-muted-foreground">{row.country || t('type_league')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Players Group */}
              {show('players') && found.players.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {t('kind_players')} ({found.players.length})
                    </h2>
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {found.players.map((row) => (
                      <Link
                        key={row.id}
                        href={`/player/${row.slug}`}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-card/60 p-4 text-center transition-all hover:border-emerald-400/50 hover:bg-card/90 shadow-sm"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/50 mb-2 overflow-hidden border border-border group-hover:border-emerald-400 transition-colors">
                          {row.photoUrl ? (
                            <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs text-foreground">
                              {nameOf(names, 'PLAYER', row.id, row.name).charAt(0)}
                            </span>
                          )}
                        </div>
                        <strong className="text-xs font-bold text-foreground truncate w-full group-hover:text-emerald-400 transition-colors">
                          {nameOf(names, 'PLAYER', row.id, row.name)}
                        </strong>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{row.position || t('type_player')}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* News Group */}
              {show('news') && news.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Newspaper className="w-4 h-4 text-rose-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {t('kind_news')} ({news.length})
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {news.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${encodeURIComponent(item.slug)}`}
                        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/60 transition-all hover:border-rose-400/50 hover:bg-card/90 shadow-sm"
                      >
                        {item.featuredImage && (
                          <div className="h-44 w-full overflow-hidden bg-muted">
                            <img
                              src={item.featuredImage}
                              alt=""
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </Reveal>
        )}

        {/* ——— Platform Radar Index (When no query or at the bottom) ——— */}
        <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="border-b border-border pb-4 mb-6">
            <h2 className="text-lg sm:text-xl font-black text-foreground">{t('drawers_title')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('drawers_note')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {drawers.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.no}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between transition hover:border-primary/40 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-primary">{d.no}</span>
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-foreground block mb-1">{d.n}</span>
                    <h3 className="text-sm font-bold text-foreground mb-1">{d.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{d.body}</p>
                  </div>

                  {d.href && (
                    <Link
                      href={d.href}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{isAr ? 'استكشف' : 'Explore'}</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
