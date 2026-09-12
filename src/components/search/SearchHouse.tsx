import { ClientTime } from '@/components/datetime/ClientTime';
import { BrandMark } from '@/components/brand/BrandMark';
import { TicketBarcode } from '@/components/decor/CraftMarks';
import { EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { HeroEnter, Reveal, Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@/generated/prisma';
import { localizeEntityMap, newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { getLocale, getTranslations } from 'next-intl/server';
import { SearchTicket } from './SearchTicket';
import { canShowScore, clampSeekQuery, parseSeekKind, seekHref, type SeekKind } from './seek';

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

function matchStatusKey(status: string) {
  if (status === 'LIVE') return 'st_live' as const;
  if (status === 'HALFTIME') return 'st_ht' as const;
  if (status === 'FINISHED') return 'st_ft' as const;
  if (status === 'POSTPONED') return 'st_pp' as const;
  if (status === 'CANCELLED') return 'st_can' as const;
  return 'st_ns' as const;
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

  const [deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches] = await Promise.all([
    prisma.news.count({ where: newsVisibleWhere(locale) }),
    prisma.team.count(),
    prisma.player.count(),
    prisma.league.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'LIVE' } }),
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
          take: 10,
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

  const kinds: Array<{ id: SeekKind; label: string; n: number }> = [
    { id: 'all', label: t('kind_all'), n: total },
    { id: 'news', label: t('kind_news'), n: counts.news },
    { id: 'teams', label: t('kind_teams'), n: counts.teams },
    { id: 'players', label: t('kind_players'), n: counts.players },
    { id: 'leagues', label: t('kind_leagues'), n: counts.leagues },
    { id: 'matches', label: t('kind_matches'), n: counts.matches },
  ];

  const drawers = [
    { no: '01', title: t('drawer_news'), body: t('drawer_news_body'), n: deskNews, href: '/news' },
    { no: '02', title: t('drawer_teams'), body: t('drawer_teams_body'), n: deskTeams, href: '/leagues' },
    { no: '03', title: t('drawer_players'), body: t('drawer_players_body'), n: deskPlayers, href: null as string | null },
    { no: '04', title: t('drawer_leagues'), body: t('drawer_leagues_body'), n: deskLeagues, href: '/leagues' },
    { no: '05', title: t('drawer_matches'), body: t('drawer_matches_body'), n: deskMatches, extra: t('drawer_live', { n: String(liveMatches) }), href: '/matches' },
  ];

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  return (
    <div className="search-stage watch-booth relative min-h-screen pb-16">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />

      <header className="search-stage-hero relative z-10">
        <HeroEnter className="search-stage-hero-inner">
          <PhotoCorners className="search-hero-corners" />
          <div className="search-stage-mast">
            <div className="search-stage-brand">
              <BrandMark size={44} priority />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e8b48a]">
                    {t('kicker')}
                  </p>
                  <EditionPlate year={new Date().getFullYear()} label={t('folio')} className="watch-edition" />
                </div>
                <h1 className="search-stage-title">{t('title')}</h1>
              </div>
            </div>
            <p className="search-stage-meta">
              {t('house')} · {liveMatches} {t('tally_live_short')}
            </p>
          </div>

          <p className="search-stage-headline">{t('headline')}</p>
          <p className="search-stage-lead">{t('standfirst')}</p>

          <div id="request" className="search-lens">
            <SearchTicket initialQuery={query} kind={kind} />
            {query ? (
              <p className="search-lens-meta">
                {t('written')} <strong>{query}</strong>
                <span>
                  {t('hits', { n: String(visible) })}
                  {kind !== 'all' ? ` · ${t('drawer_only')}` : ''}
                </span>
              </p>
            ) : null}
            {query ? (
              <nav className="search-lens-kinds" aria-label={t('kinds_label')}>
                {kinds.map((item) => (
                  <Link
                    key={item.id}
                    href={seekHref(query, item.id)}
                    className={kind === item.id ? 'is-on' : ''}
                  >
                    {item.label}
                    <b>{item.n}</b>
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </HeroEnter>
      </header>

      <div className="search-stage-body relative z-10">
        {query ? (
          <Reveal>
            <section id="catalog" className="search-block-panel">
              <div className="search-block-head">
                <span>01</span>
                <div>
                  <h2>{t('catalog_title')}</h2>
                  <p>{t('catalog_note')}</p>
                </div>
              </div>

              {visible === 0 ? (
                <div className="search-empty-lux">
                  <p>{t('empty_title')}</p>
                  <span>{kind === 'all' ? t('empty_body') : t('empty_drawer')}</span>
                </div>
              ) : null}

              {show('leagues') && found.leagues.length > 0 ? (
                <div className="search-result-group">
                  <h3>{t('kind_leagues')}</h3>
                  <Stagger className="search-result-grid">
                    {found.leagues.map((row) => (
                      <StaggerItem key={row.id}>
                        <Link href={`/league/${row.slug}`} className="search-result-card">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt="" />
                          ) : (
                            <em>{nameOf(names, 'LEAGUE', row.id, row.name).charAt(0)}</em>
                          )}
                          <strong>{nameOf(names, 'LEAGUE', row.id, row.name)}</strong>
                          <span>{row.country || t('type_league')}</span>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ) : null}

              {show('teams') && found.teams.length > 0 ? (
                <div className="search-result-group">
                  <h3>{t('kind_teams')}</h3>
                  <Stagger className="search-result-grid">
                    {found.teams.map((row) => (
                      <StaggerItem key={row.id}>
                        <Link href={`/team/${row.slug}`} className="search-result-card">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt="" />
                          ) : (
                            <em>{nameOf(names, 'TEAM', row.id, row.name).charAt(0)}</em>
                          )}
                          <strong>{nameOf(names, 'TEAM', row.id, row.name)}</strong>
                          <span>{t('type_team')}</span>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ) : null}

              {show('players') && found.players.length > 0 ? (
                <div className="search-result-group">
                  <h3>{t('kind_players')}</h3>
                  <Stagger className="search-result-grid">
                    {found.players.map((row) => (
                      <StaggerItem key={row.id}>
                        <Link href={`/player/${row.slug}`} className="search-result-card">
                          {row.photoUrl ? (
                            <img src={row.photoUrl} alt="" className="is-face" />
                          ) : (
                            <em>{nameOf(names, 'PLAYER', row.id, row.name).charAt(0)}</em>
                          )}
                          <strong>{nameOf(names, 'PLAYER', row.id, row.name)}</strong>
                          <span>{row.position || t('type_player')}</span>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ) : null}

              {show('matches') && found.matches.length > 0 ? (
                <div className="search-result-group">
                  <h3>{t('kind_matches')}</h3>
                  <Stagger className="search-fixture-list">
                    {found.matches.map((row) => {
                      const home = nameOf(names, 'TEAM', row.homeTeam.id, row.homeTeam.name);
                      const away = nameOf(names, 'TEAM', row.awayTeam.id, row.awayTeam.name);
                      const league = nameOf(names, 'LEAGUE', row.league.id, row.league.name);
                      const scored = canShowScore(row.status, row.homeScore, row.awayScore);
                      return (
                        <StaggerItem key={row.id}>
                          <Link href={`/match/${row.id}`} className="search-fixture-row">
                            <span>
                              {league}
                              {' · '}
                              {t(matchStatusKey(row.status))}
                              {row.status === 'LIVE' && row.minute != null ? ` ${row.minute}′` : ''}
                            </span>
                            <strong>
                              {home}
                              {scored ? ` ${row.homeScore}–${row.awayScore} ` : ' — '}
                              {away}
                            </strong>
                            <ClientTime value={row.kickoffAt} className="search-fixture-time" />
                          </Link>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
                </div>
              ) : null}

              {show('news') && news.length > 0 ? (
                <div className="search-result-group">
                  <h3>{t('kind_news')}</h3>
                  <Stagger className="search-story-list">
                    {news.map((row) => (
                      <StaggerItem key={row.id}>
                        <Link href={`/news/${row.slug}`} className="search-story-row">
                          {row.featuredImage ? <img src={row.featuredImage} alt="" /> : <i />}
                          <div>
                            <em>{row.category}</em>
                            <strong>{row.title}</strong>
                            {row.excerpt ? <p>{row.excerpt}</p> : null}
                            {row.publishedAt ? <ClientTime value={row.publishedAt} className="search-fixture-time" /> : null}
                          </div>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ) : null}
            </section>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <section id="drawers" className="search-block-panel">
                <div className="search-block-head">
                  <span>01</span>
                  <div>
                    <h2>{t('drawers_title')}</h2>
                    <p>{t('drawers_note')}</p>
                  </div>
                </div>
                <Stagger className="search-drawer-grid">
                  {drawers.map((drawer) => (
                    <StaggerItem key={drawer.no}>
                      <article className="search-drawer-card">
                        <b>{drawer.no}</b>
                        <strong>{drawer.title}</strong>
                        <p>{drawer.body}</p>
                        {'extra' in drawer && drawer.extra ? <em>{drawer.extra}</em> : null}
                        {drawer.href ? (
                          <Link href={drawer.href}>{drawer.n}</Link>
                        ) : (
                          <span className="search-drawer-count">{drawer.n}</span>
                        )}
                      </article>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </Reveal>

            <Reveal>
              <section className="search-block-panel">
                <div className="search-block-head">
                  <span>02</span>
                  <div>
                    <h2>{t('rules_title')}</h2>
                    <p>{t('rules_kicker')}</p>
                  </div>
                </div>
                <Stagger className="search-rule-grid">
                  {rules.map((rule) => (
                    <StaggerItem key={rule.no}>
                      <article className="search-rule-card">
                        <span>{rule.no}</span>
                        <strong>{rule.title}</strong>
                        <p>{rule.body}</p>
                      </article>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </Reveal>
          </>
        )}

        <Reveal>
          <section className="search-doors-row">
            <Link href="/matches" className="watch-chip-link is-solid">
              {t('door_matches')}
            </Link>
            <Link href="/news" className="watch-chip-link is-ghost">
              {t('door_news')}
            </Link>
            <Link href="/leagues" className="watch-chip-link is-ghost">
              {t('door_leagues')}
            </Link>
            <TicketBarcode className="ms-auto text-[#e8b48a]/40" />
          </section>
        </Reveal>

        <p className="search-colo-line">
          {t('house')} · {t('folio')} · {t('colo')}
        </p>
      </div>
    </div>
  );
}
