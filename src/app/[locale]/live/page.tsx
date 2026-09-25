import { swallow } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  listLinearCatalog,
  listLiveCatalog,
  listPublishedLibrary,
  listTonightTvGuide,
  upcomingLicensedWindows,
} from '@/lib/streaming/catalog';
import { countryFromHeaders, isGeoAllowed } from '@/lib/streaming/entitlement';
import { walkLocalizeNames } from '@/lib/i18n/sports-lexicon';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { pick } from '@/i18n/pick';
import { BrandMark } from '@/components/brand/BrandMark';
import { ClientTime } from '@/components/datetime/ClientTime';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { isMajorLeague, matchdayWeight } from '@/lib/sports-data/matchday-weight';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { Radio, Tv, Play } from 'lucide-react';
import styles from '@/components/live/live-hall.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('live');
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/live',
  });
}

const isLiveStatus = (status?: string) => status === 'LIVE' || status === 'HALFTIME';

export default function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string; channelId?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LivePageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function LivePageBody({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string; channelId?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations('live');
  const tw = await getTranslations('watch');
  const params = await searchParams;
  const leagueId = params.leagueId?.trim() || '';
  const channelId = params.channelId?.trim() || '';
  const headerList = await headers();
  const country = countryFromHeaders(headerList);
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);

  const items = STREAMING_ENABLED
    ? await listLiveCatalog({
        country,
        leagueId: leagueId || undefined,
        channelId: channelId || undefined,
      }).catch(swallow('LivePage.listLiveCatalog', []))
    : [];

  const linear = STREAMING_ENABLED
    ? await listLinearCatalog({
        country,
        channelId: channelId || undefined,
      }).catch(swallow('LivePage.listLinearCatalog', []))
    : [];

  const library = STREAMING_ENABLED
    ? await listPublishedLibrary({ take: 12 }).catch(swallow('LivePage.listPublishedLibrary', []))
    : [];

  const tvRows = await listTonightTvGuide({
    start,
    end,
    leagueId: leagueId || undefined,
    channelId: channelId || undefined,
  }).catch(swallow('LivePage.listTonightTvGuide', [] as Awaited<ReturnType<typeof listTonightTvGuide>>));

  const upcoming = STREAMING_ENABLED
    ? (await upcomingLicensedWindows(8).catch(swallow('LivePage.upcomingLicensedWindows', []))).filter((asset) =>
        isGeoAllowed(country, asset.geoAllow)
      )
    : [];

  walkLocalizeNames(locale, items);
  walkLocalizeNames(locale, linear);
  walkLocalizeNames(locale, tvRows);
  walkLocalizeNames(locale, upcoming);
  walkLocalizeNames(locale, library);

  type CatalogItem = (typeof items)[number];
  type Program = { match: CatalogItem['match']; assets: CatalogItem[] };

  const programs = Array.from(
    items
      .reduce((groups, item) => {
        const key = item.match?.id ?? item.id;
        const current = groups.get(key);
        if (current) current.assets.push(item);
        else groups.set(key, { match: item.match, assets: [item] });
        return groups;
      }, new Map<string, Program>())
      .values()
  ).sort((first, second) => {
    const weight = (program: Program) => {
      if (!program.match) return 0;
      return matchdayWeight({
        league: {
          name: program.match.league.name,
          slug: program.match.league.slug,
          country: program.match.league.country ?? undefined,
        },
        status: program.match.status,
        homeScore: program.match.homeScore,
        awayScore: program.match.awayScore,
        hasLicensedStream: true,
      });
    };
    return weight(second) - weight(first);
  });

  const featuredSports = STREAMING_ENABLED ? programs[0] : undefined;
  const featuredListing = tvRows.find((row) => isLiveStatus(row.match.status)) ?? tvRows[0] ?? null;
  const featuredLive = isLiveStatus(featuredSports?.match?.status) || isLiveStatus(featuredListing?.match.status);

  type ChannelCard = {
    id: string;
    name: string;
    logoUrl: string | null;
    country: string | null;
    playable: Array<(typeof items)[number] | (typeof linear)[number]>;
    listings: typeof tvRows;
  };

  const channelMap = new Map<string, ChannelCard>();
  const takeChannel = (channel: { id: string; name: string; logoUrl?: string | null; country?: string | null }) => {
    const current = channelMap.get(channel.id);
    if (current) return current;
    const next: ChannelCard = {
      id: channel.id,
      name: channel.name,
      logoUrl: channel.logoUrl ?? null,
      country: channel.country ?? null,
      playable: [],
      listings: [],
    };
    channelMap.set(channel.id, next);
    return next;
  };

  for (const item of items) {
    if (!item.channel) continue;
    takeChannel(item.channel).playable.push(item);
  }
  for (const item of linear) {
    if (!item.channel) continue;
    takeChannel(item.channel).playable.push(item);
  }
  for (const row of tvRows) {
    takeChannel(row.channel).listings.push(row);
  }

  const channelWall = Array.from(channelMap.values()).sort((first, second) => {
    if (first.playable.length && !second.playable.length) return -1;
    if (!first.playable.length && second.playable.length) return 1;
    return second.listings.length - first.listings.length || first.name.localeCompare(second.name, locale);
  });

  const leagues = Array.from(
    new Map(
      [
        ...items.flatMap((item) => (item.match?.league ? [[item.match.league.id, item.match.league] as const] : [])),
        ...tvRows.map((row) => [row.match.league.id, row.match.league] as const),
      ]
    ).values()
  );

  const pageHref = (overrides: Record<string, string | undefined> = {}) => {
    const next = new URLSearchParams();
    const nextLeague = 'leagueId' in overrides ? overrides.leagueId : leagueId || undefined;
    const nextChannel = 'channelId' in overrides ? overrides.channelId : channelId || undefined;
    if (nextLeague) next.set('leagueId', nextLeague);
    if (nextChannel) next.set('channelId', nextChannel);
    const query = next.toString();
    return query ? `/live?${query}` : '/live';
  };

  const scoreLabel = (home?: number | null, away?: number | null) =>
    typeof home === 'number' && typeof away === 'number' ? `${home} : ${away}` : '–';

  const featuredMatch = featuredSports?.match ?? featuredListing?.match ?? null;
  const featuredAssets = featuredSports?.assets ?? [];
  const featuredLeague = featuredMatch?.league.name;
  const featuredChannel = featuredSports?.assets[0]?.channel?.name ?? featuredListing?.channel?.name;

  return (
    <div className={styles.liveHall}>
      <div className={styles.inner}>
        {/* ==========================================================================
            1. LIVE BROADCAST MAST (Hero Header & Metrics)
            ========================================================================== */}
        <header className={styles.mast}>
          <div className={styles.mastBrand}>
            <BrandMark size={48} priority />
            <div className={styles.mastCopy}>
              <span className={styles.kicker}>
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                {t('studio_kicker')}
              </span>
              <h1 className={styles.mastTitle}>{t('title')}</h1>
              <p className={styles.mastLead}>{t('description')}</p>
            </div>
          </div>

          <div className={styles.metersGrid}>
            <div className={featuredLive ? styles.meterLive : styles.meterCard}>
              <span className={styles.meterValue}>{featuredLive ? 'LIVE' : '—'}</span>
              <span className={styles.meterLabel}>{t('now_on_air')}</span>
            </div>
            <div className={styles.meterCard}>
              <span className={styles.meterValue}>{tvRows.length}</span>
              <span className={styles.meterLabel}>{t('listing_count')}</span>
            </div>
            <div className={styles.meterCard}>
              <span className={styles.meterValue}>{channelWall.length}</span>
              <span className={styles.meterLabel}>{t('channel_count')}</span>
            </div>
          </div>
        </header>

        {/* ==========================================================================
            2. FEATURED ON-AIR STAGE (Cinematic Match Screen)
            ========================================================================== */}
        <section className={styles.featuredScreen}>
          {featuredMatch || featuredSports ? (
            <div>
              <div className={styles.stageTop}>
                <span className={styles.stageCategory}>
                  {[featuredLeague, featuredChannel].filter(Boolean).join(' · ')}
                </span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  {featuredLive
                    ? featuredSports?.match?.minute
                      ? `${t('now_on_air')} ${featuredSports.match.minute}'`
                      : t('now_on_air')
                    : featuredListing
                      ? t('on_television')
                      : t('watch')}
                </span>
              </div>

              <div className={styles.stageDuel}>
                {/* Home Side */}
                <div className={styles.stageSide}>
                  {featuredMatch ? (
                    <div className={styles.stageCrest}>
                      <LeagueCrest
                        name={featuredMatch.homeTeam.name}
                        logoUrl={featuredMatch.homeTeam.logoUrl}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <strong className={styles.stageTeamName}>
                    {featuredMatch?.homeTeam.name ?? featuredChannel}
                  </strong>
                </div>

                {/* Center Score */}
                <div className={styles.stageScore}>
                  <span className={styles.scoreDigits}>
                    {scoreLabel(featuredMatch?.homeScore, featuredMatch?.awayScore)}
                  </span>
                  <span className={styles.scoreVs}>VS</span>
                </div>

                {/* Away Side */}
                <div className={styles.stageSide}>
                  {featuredMatch ? (
                    <div className={styles.stageCrest}>
                      <LeagueCrest
                        name={featuredMatch.awayTeam.name}
                        logoUrl={featuredMatch.awayTeam.logoUrl}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <strong className={styles.stageTeamName}>
                    {featuredMatch?.awayTeam.name ?? ''}
                  </strong>
                </div>
              </div>

              <div className={styles.stageActions}>
                {STREAMING_ENABLED
                  ? featuredAssets.map((asset) => (
                      <Link key={asset.id} href={`/watch/${asset.id}`} className={styles.ctaWatch}>
                        <Play className="h-4 w-4 fill-current" />
                        {asset.channel?.name || t('watch_here')}
                      </Link>
                    ))
                  : null}
                {featuredMatch ? (
                  <Link href={`/match/${featuredMatch.id}`} className={styles.ctaGhost}>
                    {t('match_center')}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <Tv className="h-10 w-10 opacity-30 mb-2" />
              <p>{t('empty')}</p>
            </div>
          )}
        </section>

        {/* ==========================================================================
            3. LEAGUE & CHANNEL RAILS (Filters Bar)
            ========================================================================== */}
        {leagues.length > 1 || channelWall.length > 1 || leagueId || channelId ? (
          <section className={styles.bandSection}>
            <div className={styles.bandHead}>
              <div className={styles.bandMark}>
                <span className={styles.bandFolio}>01</span>
                <h2 className={styles.bandTitle}>{t('filters')}</h2>
              </div>
              {leagueId || channelId ? (
                <Link href="/live" className="text-xs font-bold text-[var(--ys-orange)] hover:underline">
                  {pick(locale, 'إعادة ضبط كل الفلاتر', 'Reset all filters')}
                </Link>
              ) : null}
            </div>

            <div className={styles.filterSection}>
              {leagues.length > 0 ? (
                <div className={styles.filterRail}>
                  {leagues.map((league) => {
                    const active = leagueId === league.id;
                    return (
                      <Link
                        key={league.id}
                        href={pageHref({ leagueId: active ? undefined : league.id })}
                        className={active ? styles.filterChipActive : styles.filterChip}
                      >
                        {league.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={league.logoUrl} alt="" className="h-4 w-4 object-contain" />
                        ) : null}
                        <span>{league.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {channelWall.length > 0 ? (
                <div className={styles.filterRail}>
                  {channelWall.map((channel) => {
                    const active = channelId === channel.id;
                    return (
                      <Link
                        key={channel.id}
                        href={pageHref({ channelId: active ? undefined : channel.id })}
                        className={active ? styles.filterChipActive : styles.filterChip}
                      >
                        {channel.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={channel.logoUrl} alt="" className="h-4 w-4 object-contain" />
                        ) : null}
                        <span>{channel.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ==========================================================================
            4. TWO-COLUMN CONTENT DECK (Channels, Schedule, VOD & Upcoming)
            ========================================================================== */}
        <div className={styles.twoColLayout}>
          {/* Main Column */}
          <div className={styles.mainColumn}>
            {/* Channels Wall */}
            <section className={styles.bandSection}>
              <div className={styles.bandHead}>
                <div className={styles.bandMark}>
                  <span className={styles.bandFolio}>02</span>
                  <div>
                    <h2 className={styles.bandTitle}>{t('channels_wall')}</h2>
                    <p className={styles.bandLead}>{t('tonight')}</p>
                  </div>
                </div>
              </div>

              {channelWall.length > 0 ? (
                <div className={styles.channelsGrid}>
                  {channelWall.map((channel) => {
                    const liveListing =
                      channel.listings.find((row) => isLiveStatus(row.match.status)) ?? channel.listings[0];
                    const headline = channel.playable[0]?.match ?? liveListing?.match;
                    return (
                      <article key={channel.id} className={styles.channelCard}>
                        <div>
                          <div className={styles.channelHeader}>
                            <div className={styles.channelMeta}>
                              <div className={styles.channelCrest}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={channel.logoUrl || '/placeholder.png'}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div>
                                <h3 className={styles.channelName}>{channel.name}</h3>
                                <p className={styles.channelSub}>
                                  {[channel.country, channel.playable.length ? t('watch_here') : t('tv_only')]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                channel.playable.length
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                              }`}
                            >
                              {channel.playable.length ? t('now_on_air') : t('on_television')}
                            </span>
                          </div>

                          {headline ? (
                            <div className={styles.matchLine}>
                              <span className="flex items-center gap-2 truncate">
                                <LeagueCrest
                                  name={headline.homeTeam.name}
                                  logoUrl={headline.homeTeam.logoUrl}
                                  className="h-4 w-4 shrink-0"
                                />
                                <span className="truncate">
                                  {headline.homeTeam.name} × {headline.awayTeam.name}
                                </span>
                                <LeagueCrest
                                  name={headline.awayTeam.name}
                                  logoUrl={headline.awayTeam.logoUrl}
                                  className="h-4 w-4 shrink-0"
                                />
                              </span>
                              <em className="font-bold not-italic text-[var(--primary)] tabular-nums">
                                {isLiveStatus(headline.status) ? (
                                  scoreLabel(headline.homeScore, headline.awayScore)
                                ) : (
                                  <ClientTime value={headline.kickoffAt} />
                                )}
                              </em>
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 pt-2">
                            {STREAMING_ENABLED &&
                              channel.playable.map((asset) => (
                                <Link
                                  key={asset.id}
                                  href={`/watch/${asset.id}`}
                                  className="flex-1 text-center rounded-lg bg-[var(--primary)] py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                                >
                                  {t('watch_here')}
                                </Link>
                              ))}
                            {headline ? (
                              <Link
                                href={`/match/${headline.id}`}
                                className="flex-1 text-center rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]"
                              >
                                {t('match_center')}
                              </Link>
                            ) : null}
                          </div>

                          {channel.listings.length > 1 ? (
                            <ul className={styles.listingsList}>
                              {channel.listings.slice(0, 3).map((row) => (
                                <li key={row.id} className={styles.listingRow}>
                                  <span className="truncate">
                                    {row.match.homeTeam.name} × {row.match.awayTeam.name}
                                  </span>
                                  <ClientTime value={row.match.kickoffAt} />
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  <p>{t('empty_tv')}</p>
                  <Link
                    href="/matches"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white"
                  >
                    {pick(locale, 'برنامج المباريات', 'Match programme')}
                  </Link>
                </div>
              )}
            </section>

            {/* Broadcast Schedule */}
            {programs.length > 0 ? (
              <section className={styles.bandSection}>
                <div className={styles.bandHead}>
                  <div className={styles.bandMark}>
                    <span className={styles.bandFolio}>03</span>
                    <h2 className={styles.bandTitle}>{t('schedule')}</h2>
                  </div>
                </div>

                <div className={styles.programsGrid}>
                  {programs.map((program) => (
                    <article key={program.assets[0].id} className={styles.programCard}>
                      <div>
                        <span className={styles.programLeague}>
                          {program.match?.league.name}
                          {program.match &&
                          isMajorLeague({
                            name: program.match.league.name,
                            slug: program.match.league.slug,
                            country: program.match.league.country ?? undefined,
                          })
                            ? ` · ${pick(locale, 'دوري رئيسي', 'Major League')}`
                            : ''}
                        </span>
                        <h3 className={styles.programTitle}>
                          {program.match
                            ? `${program.match.homeTeam.name} × ${program.match.awayTeam.name}`
                            : program.assets[0]?.channel?.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {STREAMING_ENABLED ? (
                          program.assets.map((asset) => (
                            <Link
                              key={asset.id}
                              href={`/watch/${asset.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              {asset.channel?.name || t('watch')}
                            </Link>
                          ))
                        ) : program.match ? (
                          <Link
                            href={`/match/${program.match.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--foreground)] hover:underline"
                          >
                            {t('match_center')}
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Linear Continuous Channels */}
            {linear.length > 0 ? (
              <section className={styles.bandSection}>
                <div className={styles.bandHead}>
                  <div className={styles.bandMark}>
                    <span className={styles.bandFolio}>04</span>
                    <h2 className={styles.bandTitle}>{t('linear_wall')}</h2>
                  </div>
                </div>

                <div className={styles.linearGrid}>
                  {linear.map((asset) => (
                    <Link key={asset.id} href={`/watch/${asset.id}`} className={styles.linearCard}>
                      <span className={styles.linearTag}>
                        {asset.channel?.kind === 'NEWS'
                          ? t('kind_news')
                          : asset.channel?.kind === 'MOVIE'
                            ? t('kind_movie')
                            : asset.channel?.kind === 'SERIES'
                              ? t('kind_series')
                              : asset.status === 'LIVE'
                                ? t('now_on_air')
                                : tw('ready_status')}
                      </span>
                      <strong className={styles.linearName}>{asset.channel?.name || t('title')}</strong>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* VOD Library */}
            {library.length > 0 ? (
              <section className={styles.bandSection}>
                <div className={styles.bandHead}>
                  <div className={styles.bandMark}>
                    <span className={styles.bandFolio}>05</span>
                    <h2 className={styles.bandTitle}>{t('vod_shelf')}</h2>
                  </div>
                </div>

                <div className={styles.programsGrid}>
                  {library.map((show) => {
                    const firstEpisode = show.episodes[0];
                    return (
                      <article key={show.id} className={styles.programCard}>
                        <div>
                          <span className={styles.programLeague}>
                            {show.type}
                            {show.releaseYear ? ` · ${show.releaseYear}` : ''}
                          </span>
                          <h3 className={styles.programTitle}>
                            <Link href={`/vod/${show.slug}`} className="hover:text-[var(--primary)]">
                              {show.title}
                            </Link>
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <Link
                            href={`/vod/${show.slug}`}
                            className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            {tw('open_title')}
                          </Link>
                          {firstEpisode ? (
                            <Link
                              href={`/vod/player/${firstEpisode.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              {tw('watch_asset')}
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {/* Side Aside: Upcoming Windows */}
          {upcoming.length > 0 ? (
            <aside className={styles.sideColumn}>
              <div className={styles.bandHead}>
                <div className={styles.bandMark}>
                  <span className={styles.bandFolio}>06</span>
                  <h2 className={styles.bandTitle}>{t('coming_windows')}</h2>
                </div>
              </div>

              <div className={styles.ticketList}>
                {upcoming.map((asset) => (
                  <Link key={asset.id} href={`/watch/${asset.id}`} className={styles.ticketCard}>
                    <span className={styles.ticketChannel}>{asset.channel?.name || t('title')}</span>
                    <strong className={styles.ticketTitle}>
                      {asset.match
                        ? `${asset.match.homeTeam.name} × ${asset.match.awayTeam.name}`
                        : t('title')}
                    </strong>
                    {asset.startsAt || asset.match?.kickoffAt ? (
                      <span className={styles.ticketTime}>
                        <ClientTime value={asset.startsAt ?? asset.match!.kickoffAt} />
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
