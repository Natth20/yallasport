import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@/generated/prisma';
import { localizeEntityMap, newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { getLocale, getTranslations } from 'next-intl/server';
import { SearchTicket } from './SearchTicket';
import { loadSeekIndex } from '@/lib/search/load-index';
import { canShowScore, clampSeekQuery, parseSeekKind, seekHref, type SeekKind } from './seek';
import { SalonStage } from '@/components/salon/SalonStage';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
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
import styles from './search.module.css';

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

  const { deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows } =
    await loadSeekIndex(locale);

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
    <SalonStage
      tone="lamp"
      wide
      compact
      kicker={t('kicker')}
      title={t('title')}
      lead={t('standfirst')}
      aside={`${liveMatches} ${t('tally_live_short')}`}
    >
      <div className={styles.stack}>
        <SearchTicket initialQuery={query} kind={kind} />

        {!query ? (
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>
              <Flame aria-hidden="true" />
              <span>{isAr ? 'من آخر المباريات:' : 'From recent fixtures:'}</span>
            </span>
            {suggestions.map((chip) => (
              <Tooltip key={chip} content={chip} position="bottom">
                <Link href={`/search?q=${encodeURIComponent(chip)}`} className={styles.chip}>
                  {chip}
                </Link>
              </Tooltip>
            ))}
          </div>
        ) : (
          <div className={styles.stack}>
            <div className={styles.meta}>
              <p>
                {t('written')} <strong>&ldquo;{query}&rdquo;</strong>
              </p>
              <Badge variant="accent" size="sm">{t('hits', { n: String(visible) })}</Badge>
            </div>
            <nav className={styles.kinds} aria-label={t('kinds_label')}>
              {kinds.map((item) => {
                const active = kind === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={seekHref(query, item.id)}
                    className={active ? `${styles.kind} ${styles.kindOn}` : styles.kind}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    <Badge variant={active ? 'outline' : 'default'} size="sm">{item.n}</Badge>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {query && visible === 0 ? (
          <Card variant="bordered" padding="lg" className={styles.empty}>
            <SearchIcon aria-hidden="true" />
            <h2>{t('empty_title')}</h2>
            <p>{kind === 'all' ? t('empty_body') : t('empty_drawer')}</p>
          </Card>
        ) : null}

        {query && show('matches') && found.matches.length > 0 ? (
          <section>
            <h2 className={styles.head}>
              <Calendar aria-hidden="true" />
              {t('kind_matches')} ({found.matches.length})
            </h2>
            <div className={styles.matches}>
              {found.matches.map((row) => {
                const isLive = row.status === 'LIVE';
                const homeName = nameOf(names, 'TEAM', row.homeTeam.id, row.homeTeam.name);
                const awayName = nameOf(names, 'TEAM', row.awayTeam.id, row.awayTeam.name);
                const leagueName = nameOf(names, 'LEAGUE', row.league.id, row.league.name);
                const scored = canShowScore(row.status, row.homeScore, row.awayScore);
                return (
                  <Link key={row.id} href={`/match/${row.id}`} className={styles.hit}>
                    <Card variant="interactive" padding="sm">
                      <div className={styles.matchTop}>
                        <span className={styles.leagueName}>{leagueName}</span>
                        {isLive ? (
                          <Badge variant="live" size="sm">{row.minute ? `${row.minute}′` : 'LIVE'}</Badge>
                        ) : (
                          <ClientTime value={row.kickoffAt} className={styles.detail} />
                        )}
                      </div>
                      <div className={styles.side}>
                        <span className={styles.who}>
                          {row.homeTeam.logoUrl ? (
                            <img src={row.homeTeam.logoUrl} alt="" className={styles.crest} />
                          ) : (
                            <span className={styles.mark}>{homeName.charAt(0)}</span>
                          )}
                          <span className={styles.name}>{homeName}</span>
                        </span>
                        {scored ? <span className={styles.score}>{row.homeScore}</span> : null}
                      </div>
                      <div className={styles.side}>
                        <span className={styles.who}>
                          {row.awayTeam.logoUrl ? (
                            <img src={row.awayTeam.logoUrl} alt="" className={styles.crest} />
                          ) : (
                            <span className={styles.mark}>{awayName.charAt(0)}</span>
                          )}
                          <span className={styles.name}>{awayName}</span>
                        </span>
                        {scored ? <span className={styles.score}>{row.awayScore}</span> : null}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {query && show('teams') && found.teams.length > 0 ? (
          <section>
            <h2 className={styles.head}>
              <Shield aria-hidden="true" />
              {t('kind_teams')} ({found.teams.length})
            </h2>
            <div className={styles.teams}>
              {found.teams.map((row) => {
                const name = nameOf(names, 'TEAM', row.id, row.name);
                return (
                  <Link key={row.id} href={`/team/${row.slug}`} className={styles.hit}>
                    <Card variant="interactive" padding="sm" className={styles.portrait}>
                      {row.logoUrl ? (
                        <img src={row.logoUrl} alt="" className={styles.face} />
                      ) : (
                        <span className={styles.letter}>{name.charAt(0)}</span>
                      )}
                      <strong className={styles.name}>{name}</strong>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {query && show('leagues') && found.leagues.length > 0 ? (
          <section>
            <h2 className={styles.head}>
              <Trophy aria-hidden="true" />
              {t('kind_leagues')} ({found.leagues.length})
            </h2>
            <div className={styles.leagues}>
              {found.leagues.map((row) => {
                const name = nameOf(names, 'LEAGUE', row.id, row.name);
                return (
                  <Link key={row.id} href={`/league/${row.slug}`} className={styles.hit}>
                    <Card variant="interactive" padding="sm" className={styles.club}>
                      {row.logoUrl ? (
                        <img src={row.logoUrl} alt="" className={styles.clubCrest} />
                      ) : (
                        <span className={styles.letter}>{name.charAt(0)}</span>
                      )}
                      <span>
                        <strong className={styles.name}>{name}</strong>
                        <span className={styles.detail}>{row.country || t('type_league')}</span>
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {query && show('players') && found.players.length > 0 ? (
          <section>
            <h2 className={styles.head}>
              <Users aria-hidden="true" />
              {t('kind_players')} ({found.players.length})
            </h2>
            <div className={styles.players}>
              {found.players.map((row) => {
                const name = nameOf(names, 'PLAYER', row.id, row.name);
                return (
                  <Link key={row.id} href={`/player/${row.slug}`} className={styles.hit}>
                    <Card variant="interactive" padding="sm" className={styles.portrait}>
                      {row.photoUrl ? (
                        <img src={row.photoUrl} alt="" className={styles.photo} />
                      ) : (
                        <span className={styles.letter}>{name.charAt(0)}</span>
                      )}
                      <strong className={styles.name}>{name}</strong>
                      <span className={styles.detail}>{row.position || t('type_player')}</span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {query && show('news') && news.length > 0 ? (
          <section>
            <h2 className={styles.head}>
              <Newspaper aria-hidden="true" />
              {t('kind_news')} ({news.length})
            </h2>
            <div className={styles.news}>
              {news.map((item) => (
                <Link key={item.id} href={`/news/${encodeURIComponent(item.slug)}`} className={styles.hit}>
                  <Card variant="interactive" padding="none" className={styles.newsCard}>
                    {item.featuredImage ? (
                      <img src={item.featuredImage} alt="" className={styles.newsImg} />
                    ) : null}
                    <CardContent>
                      <Badge variant="accent" size="sm">{item.category}</Badge>
                      <h3 className={styles.newsTitle}>{item.title}</h3>
                      {item.excerpt ? <p className={styles.excerpt}>{item.excerpt}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className={styles.drawerHead}>
            <h2>{t('drawers_title')}</h2>
            <p>{t('drawers_note')}</p>
          </div>
          <div className={styles.drawers}>
            {drawers.map((drawer) => {
              const Icon = drawer.icon;
              return (
                <Card key={drawer.no} variant="bordered" padding="md" className={styles.drawer}>
                  <div className={styles.matchTop}>
                    <span className={styles.drawerNo}>{drawer.no}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <span className={styles.drawerCount}>{drawer.n}</span>
                  <h3>{drawer.title}</h3>
                  <p>{drawer.body}</p>
                  <Link href={drawer.href} className={styles.explore}>
                    {isAr ? 'استكشف' : 'Explore'}
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </SalonStage>
  );
}

export function SearchFallback() {
  return (
    <div className={styles.fallback}>
      <Skeleton variant="text" width="14rem" height="2rem" />
      <Skeleton variant="match-card" />
      <Skeleton variant="news-card" />
    </div>
  );
}
