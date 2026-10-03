import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { SearchTicket } from './SearchTicket';
import { loadSeekIndex } from '@/lib/search/load-index';
import { runUnifiedSearch } from '@/lib/search/unified';
import { canShowScore, clampSeekQuery, matchStatusLabel, parseSeekKind, seekHref, type SeekKind } from './seek';
import { SalonStage } from '@/components/salon/SalonStage';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { FollowButton } from '@/components/common/FollowButton';
import {
  Search as SearchIcon,
  Trophy,
  Shield,
  Users,
  Newspaper,
  Calendar,
  Sparkles,
  Flame,
  GraduationCap,
  Clapperboard,
  Image as ImageIcon,
  ArrowLeftRight,
} from 'lucide-react';
import styles from './search.module.css';

function whyLabel(t: Awaited<ReturnType<typeof getTranslations>>, why: string) {
  if (why === 'entity') return t('why_entity');
  if (why === 'title') return t('why_title');
  if (why === 'tag') return t('why_tag');
  if (why === 'category') return t('why_category');
  if (why === 'excerpt') return t('why_excerpt');
  return t('why_mention');
}

export async function SearchHouse({
  q,
  kindParam,
  page = 1,
}: {
  q?: string;
  kindParam?: string;
  page?: number;
}) {
  const t = await getTranslations('seek');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const query = clampSeekQuery(q);
  const kind = parseSeekKind(kindParam);
  const [{ liveMatches: liveIndex, chipRows, deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches }, pack] =
    await Promise.all([
      loadSeekIndex(locale),
      runUnifiedSearch({ locale, query, kind, page }),
    ]);

  const show = (drawer: Exclude<SeekKind, 'all'>) => kind === 'all' || kind === drawer;
  const kinds: Array<{ id: SeekKind; label: string; n: number; icon: typeof Sparkles }> = [
    { id: 'all', label: t('kind_all'), n: Object.values(pack.counts).reduce((sum, n) => sum + n, 0), icon: Sparkles },
    { id: 'matches', label: t('kind_matches'), n: pack.counts.matches, icon: Calendar },
    { id: 'teams', label: t('kind_teams'), n: pack.counts.teams, icon: Shield },
    { id: 'players', label: t('kind_players'), n: pack.counts.players, icon: Users },
    { id: 'coaches', label: t('kind_coaches'), n: pack.counts.coaches, icon: GraduationCap },
    { id: 'leagues', label: t('kind_leagues'), n: pack.counts.leagues, icon: Trophy },
    { id: 'news', label: t('kind_news'), n: pack.counts.news, icon: Newspaper },
    { id: 'transfers', label: t('kind_transfers'), n: pack.counts.transfers, icon: ArrowLeftRight },
    { id: 'videos', label: t('kind_videos'), n: pack.counts.videos, icon: Clapperboard },
    { id: 'photos', label: t('kind_photos'), n: pack.counts.photos, icon: ImageIcon },
  ];

  const visible = kinds.filter((item) => item.id !== 'all').reduce((sum, item) => {
    if (!show(item.id as Exclude<SeekKind, 'all'>)) return sum;
    return sum + item.n;
  }, 0);

  const suggestions = [
    ...new Set(chipRows.flatMap((row) => [row.homeTeam.name, row.awayTeam.name, row.league.name].filter(Boolean))),
  ].slice(0, 6);

  const drawers = [
    { no: '01', title: t('drawer_news'), body: t('drawer_news_body'), n: deskNews, href: '/news', icon: Newspaper },
    { no: '02', title: t('drawer_teams'), body: t('drawer_teams_body'), n: deskTeams, href: '/leagues', icon: Shield },
    { no: '03', title: t('drawer_players'), body: t('drawer_players_body'), n: deskPlayers, href: '/compare-players', icon: Users },
    { no: '04', title: t('drawer_leagues'), body: t('drawer_leagues_body'), n: deskLeagues, href: '/leagues', icon: Trophy },
    { no: '05', title: t('drawer_matches'), body: t('drawer_matches_body'), n: deskMatches, href: '/matches', icon: Calendar },
  ];

  const renderMatch = (row: (typeof pack.liveMatches)[number]) => {
    const scored = canShowScore(row.status, row.homeScore, row.awayScore);
    const live = row.status === 'LIVE' || row.status === 'HALFTIME';
    return (
      <Link key={row.id} href={`/match/${row.id}`} className={styles.hit}>
        <Card variant="interactive" padding="sm">
          <div className={styles.matchTop}>
            <span className={styles.leagueName}>{row.league.name}</span>
            <Badge variant={live ? 'live' : 'outline'} size="sm">
              {matchStatusLabel(row.status, locale)}
              {live && row.minute ? ` ${row.minute}′` : ''}
            </Badge>
          </div>
          <div className={styles.side}>
            <span className={styles.who}>
              {row.homeTeam.logoUrl ? <img src={row.homeTeam.logoUrl} alt="" className={styles.crest} /> : <span className={styles.mark}>{row.homeTeam.name.charAt(0)}</span>}
              <span className={styles.name}>{row.homeTeam.name}</span>
            </span>
            {scored ? <span className={styles.score}>{row.homeScore}</span> : null}
          </div>
          <div className={styles.side}>
            <span className={styles.who}>
              {row.awayTeam.logoUrl ? <img src={row.awayTeam.logoUrl} alt="" className={styles.crest} /> : <span className={styles.mark}>{row.awayTeam.name.charAt(0)}</span>}
              <span className={styles.name}>{row.awayTeam.name}</span>
            </span>
            {scored ? <span className={styles.score}>{row.awayScore}</span> : null}
          </div>
          <ClientTime value={row.kickoffAt} className={styles.detail} />
        </Card>
      </Link>
    );
  };

  return (
    <SalonStage
      tone="lamp"
      wide
      compact
      kicker={t('kicker')}
      title={t('title')}
      lead={t('standfirst')}
      aside={`${liveIndex} ${t('tally_live_short')}`}
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
                {t('written')} <strong>«{query}»</strong>
              </p>
              <Badge variant="accent" size="sm">{t('hits', { n: String(visible) })}</Badge>
            </div>
            <nav className={styles.kinds} aria-label={t('kinds_label')}>
              {kinds.filter((item) => item.id === 'all' || item.id === kind || item.n > 0).map((item) => {
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
                    {query ? <Badge variant={active ? 'outline' : 'default'} size="sm">{item.n}</Badge> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {query && pack.suggestion ? (
          <p className={styles.hint}>
            <Link href={seekHref(pack.suggestion)}>{t('did_you_mean', { q: pack.suggestion })}</Link>
          </p>
        ) : null}

        {query && visible === 0 ? (
          <Card variant="bordered" padding="lg" className={styles.empty}>
            <SearchIcon aria-hidden="true" />
            <h2>{t('empty_title')}</h2>
            <p>{kind === 'all' ? t('empty_body') : t('empty_drawer')}</p>
            <p>{t('empty_try')}</p>
          </Card>
        ) : null}

        {query && show('players') && pack.primaryPlayer ? (
          <section className={styles.entity}>
            <h2 className={styles.head}>
              <Users aria-hidden="true" />
              {t('section_entity')}
            </h2>
            <Card variant="bordered" padding="md" className={styles.entityCard}>
              {pack.primaryPlayer.photoUrl ? (
                <img src={pack.primaryPlayer.photoUrl} alt="" className={styles.entityCrest} />
              ) : (
                <span className={styles.letter}>{pack.primaryPlayer.name.charAt(0)}</span>
              )}
              <div>
                <strong>{pack.primaryPlayer.name}</strong>
                <p>{pack.primaryPlayer.englishName}</p>
                <p className={styles.detail}>
                  {[pack.primaryPlayer.teamName, pack.primaryPlayer.nationality, pack.primaryPlayer.position, t('player_kind')]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className={styles.entityActions}>
                  <Link href={`/player/${pack.primaryPlayer.slug}`} className={styles.goSmall}>{t('view_player')}</Link>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        {query && show('teams') && pack.primaryTeam ? (
          <section className={styles.entity}>
            <h2 className={styles.head}>
              <Shield aria-hidden="true" />
              {t('section_entity')}
            </h2>
            <Card variant="bordered" padding="md" className={styles.entityCard}>
              {pack.primaryTeam.logoUrl ? <img src={pack.primaryTeam.logoUrl} alt="" className={styles.entityCrest} /> : <span className={styles.letter}>{pack.primaryTeam.name.charAt(0)}</span>}
              <div>
                <strong>{pack.primaryTeam.name}</strong>
                <p>{pack.primaryTeam.englishName}</p>
                <p className={styles.detail}>
                  {[pack.primaryTeam.country, pack.primaryTeam.leagueName, t('club_kind')].filter(Boolean).join(' · ')}
                </p>
                <div className={styles.entityActions}>
                  <Link href={`/team/${pack.primaryTeam.slug}`} className={styles.goSmall}>{t('view_team')}</Link>
                  <FollowButton
                    entityId={pack.primaryTeam.id}
                    entityType="TEAM"
                    isLoggedIn={false}
                    initialIsFollowing={false}
                  />
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        {query && show('matches') && pack.liveMatches.length > 0 ? (
          <section>
            <h2 className={styles.head}><Calendar aria-hidden="true" />{t('section_live')}</h2>
            <div className={styles.matches}>{pack.liveMatches.map(renderMatch)}</div>
          </section>
        ) : null}

        {query && show('matches') && pack.upcomingMatches.length > 0 ? (
          <section>
            <h2 className={styles.head}><Calendar aria-hidden="true" />{t('section_upcoming')}</h2>
            <div className={styles.matches}>{pack.upcomingMatches.map(renderMatch)}</div>
            {kind === 'all' && pack.counts.matches > pack.upcomingMatches.length ? (
              <Link href={seekHref(query, 'matches')} className={styles.more}>{t('view_all')} →</Link>
            ) : null}
          </section>
        ) : null}

        {query && show('matches') && pack.recentMatches.length > 0 ? (
          <section>
            <h2 className={styles.head}><Calendar aria-hidden="true" />{t('section_recent')}</h2>
            <div className={styles.matches}>{pack.recentMatches.map(renderMatch)}</div>
          </section>
        ) : null}

        {query && kind === 'matches' && pack.olderMatches.length > 0 ? (
          <section>
            <h2 className={styles.head}><Calendar aria-hidden="true" />{t('kind_matches')}</h2>
            <div className={styles.matches}>{pack.olderMatches.map(renderMatch)}</div>
          </section>
        ) : null}

        {query && show('teams') && pack.teams.filter((row) => row.id !== pack.primaryTeam?.id).length > 0 ? (
          <section>
            <h2 className={styles.head}><Shield aria-hidden="true" />{t('kind_teams')} ({pack.counts.teams})</h2>
            <div className={styles.teams}>
              {pack.teams.filter((row) => row.id !== pack.primaryTeam?.id).map((row) => (
                <Link key={row.id} href={`/team/${row.slug}`} className={styles.hit}>
                  <Card variant="interactive" padding="sm" className={styles.portrait}>
                    {row.logoUrl ? <img src={row.logoUrl} alt="" className={styles.face} /> : <span className={styles.letter}>{row.name.charAt(0)}</span>}
                    <strong className={styles.name}>{row.name}</strong>
                    <span className={styles.detail}>{row.country || t('type_team')}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && show('players') && pack.players.length > 0 ? (
          <section>
            <h2 className={styles.head}><Users aria-hidden="true" />{t('kind_players')} ({pack.counts.players})</h2>
            <div className={styles.players}>
              {pack.players.filter((row) => row.id !== pack.primaryPlayer?.id).map((row) => (
                <Link key={row.id} href={`/player/${row.slug}`} className={styles.hit}>
                  <Card variant="interactive" padding="sm" className={styles.portrait}>
                    {row.photoUrl ? <img src={row.photoUrl} alt="" className={styles.photo} /> : <span className={styles.letter}>{row.name.charAt(0)}</span>}
                    <strong className={styles.name}>{row.name}</strong>
                    <span className={styles.detail}>{[row.position, row.teamName].filter(Boolean).join(' · ') || t('type_player')}</span>
                  </Card>
                </Link>
              ))}
            </div>
            {kind === 'all' && pack.counts.players > pack.players.length ? (
              <Link href={seekHref(query, 'players')} className={styles.more}>{t('view_all')} →</Link>
            ) : null}
          </section>
        ) : null}

        {query && show('coaches') && pack.coaches.length > 0 ? (
          <section>
            <h2 className={styles.head}><GraduationCap aria-hidden="true" />{t('kind_coaches')} ({pack.counts.coaches})</h2>
            <div className={styles.players}>
              {pack.coaches.map((row) => (
                <Link key={row.id} href={`/coach/${row.slug}`} className={styles.hit}>
                  <Card variant="interactive" padding="sm" className={styles.portrait}>
                    {row.photoUrl ? <img src={row.photoUrl} alt="" className={styles.photo} /> : <span className={styles.letter}>{row.name.charAt(0)}</span>}
                    <strong className={styles.name}>{row.name}</strong>
                    <span className={styles.detail}>{row.teamName || t('type_coach')}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && show('leagues') && pack.leagues.length > 0 ? (
          <section>
            <h2 className={styles.head}><Trophy aria-hidden="true" />{t('kind_leagues')} ({pack.counts.leagues})</h2>
            <div className={styles.leagues}>
              {pack.leagues.map((row) => (
                <Link key={row.id} href={`/league/${row.slug}`} className={styles.hit}>
                  <Card variant="interactive" padding="sm" className={styles.club}>
                    {row.logoUrl ? <img src={row.logoUrl} alt="" className={styles.clubCrest} /> : <span className={styles.letter}>{row.name.charAt(0)}</span>}
                    <span>
                      <strong className={styles.name}>{row.name}</strong>
                      <span className={styles.detail}>{row.country || t('type_league')}</span>
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && show('news') && pack.news.length > 0 ? (
          <section>
            <h2 className={styles.head}><Newspaper aria-hidden="true" />{t('kind_news')} ({pack.counts.news})</h2>
            <div className={styles.news}>
              {pack.news.map((item) => (
                <Link key={item.id} href={`/news/${encodeURIComponent(item.slug)}`} className={styles.hit}>
                  <Card variant="interactive" padding="none" className={styles.newsCard}>
                    {item.featuredImage ? <img src={item.featuredImage} alt="" className={styles.newsImg} /> : null}
                    <CardContent>
                      <Badge variant="accent" size="sm">{whyLabel(t, item.why)}</Badge>
                      <h3 className={styles.newsTitle}>{item.title}</h3>
                      <p className={styles.detail}>
                        {[item.sourceName, item.category].filter(Boolean).join(' · ')}
                        {item.publishedAt ? ' · ' : ''}
                        {item.publishedAt ? <ClientTime value={item.publishedAt} /> : null}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {kind === 'all' && pack.counts.news > pack.news.length ? (
              <Link href={seekHref(query, 'news')} className={styles.more}>{t('view_all')} →</Link>
            ) : null}
          </section>
        ) : null}

        {query && show('transfers') && pack.transfers.length > 0 ? (
          <section>
            <h2 className={styles.head}><ArrowLeftRight aria-hidden="true" />{t('kind_transfers')} ({pack.counts.transfers})</h2>
            <div className={styles.leagues}>
              {pack.transfers.map((row) => (
                <Link key={row.id} href={row.playerSlug ? `/player/${row.playerSlug}` : '/transfers'} className={styles.hit}>
                  <Card variant="interactive" padding="sm">
                    <strong className={styles.name}>{row.playerName}</strong>
                    <p className={styles.detail}>{[row.fromTeam, row.toTeam].filter(Boolean).join(' → ')}</p>
                  </Card>
                </Link>
              ))}
            </div>
            {kind === 'all' ? <Link href="/transfers" className={styles.more}>{t('view_all')} →</Link> : null}
          </section>
        ) : null}

        {query && show('videos') && pack.videos.length > 0 ? (
          <section>
            <h2 className={styles.head}><Clapperboard aria-hidden="true" />{t('kind_videos')} ({pack.counts.videos})</h2>
            <div className={styles.teams}>
              {pack.videos.map((row) => (
                <Link key={row.id} href={`/videos?watch=${row.youtubeId}`} className={styles.hit}>
                  <Card variant="interactive" padding="sm" className={styles.portrait}>
                    {row.thumbnailUrl ? <img src={row.thumbnailUrl} alt="" className={styles.photo} /> : null}
                    <strong className={styles.name}>{row.title}</strong>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && show('photos') && pack.photos.length > 0 ? (
          <section>
            <h2 className={styles.head}><ImageIcon aria-hidden="true" />{t('kind_photos')} ({pack.counts.photos})</h2>
            <div className={styles.teams}>
              {pack.photos.map((row) => (
                <Link key={row.id} href={`/news/${encodeURIComponent(row.slug)}`} className={styles.hit}>
                  <Card variant="interactive" padding="none">
                    {row.featuredImage ? <img src={row.featuredImage} alt="" className={styles.newsImg} /> : null}
                    <CardContent><strong className={styles.name}>{row.title}</strong></CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && kind !== 'all' && pack.counts[kind] > page * pack.pageSize ? (
          <Link href={seekHref(query, kind, page + 1)} className={styles.more}>{t('more_page')}</Link>
        ) : null}

        {!query ? (
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
        ) : null}
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
