import { swallow } from '@/lib/ops/caught';
import { Suspense, type ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listLinearCatalog, listLiveCatalog, listPublishedLibrary, listTonightTvGuide, upcomingLicensedWindows } from '@/lib/streaming/catalog';
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
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';
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

function BandHead({ folio, title, lead, extra }: { folio: string; title: string; lead?: string; extra?: ReactNode }) {
  return (
    <div className="live-band-head">
      <div className="live-mark">
        <i>{folio}</i>
        <h2>{title}</h2>
      </div>
      {extra ?? (lead ? <p>{lead}</p> : null)}
    </div>
  );
}

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
    }).catch(swallow("src/app/[locale]/live/page.tsx:67", []))
    : [];

  const linear = STREAMING_ENABLED
    ? await listLinearCatalog({
      country,
      channelId: channelId || undefined,
    }).catch(swallow("src/app/[locale]/live/page.tsx:74", []))
    : [];

  const library = STREAMING_ENABLED
    ? await listPublishedLibrary({ take: 12 }).catch(swallow("src/app/[locale]/live/page.tsx:78", []))
    : [];

  const tvRows = await listTonightTvGuide({
    start,
    end,
    leagueId: leagueId || undefined,
    channelId: channelId || undefined,
  }).catch(swallow("src/app/[locale]/live/page.tsx:86", [] as Awaited<ReturnType<typeof listTonightTvGuide>>));

  const upcoming = STREAMING_ENABLED
    ? (await upcomingLicensedWindows(8).catch(swallow("src/app/[locale]/live/page.tsx:89", []))).filter((asset) => isGeoAllowed(country, asset.geoAllow))
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
  const featuredListing =
    tvRows.find((row) => isLiveStatus(row.match.status)) ?? tvRows[0] ?? null;
  const featuredLive =
    isLiveStatus(featuredSports?.match?.status) || isLiveStatus(featuredListing?.match.status);

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
    <div className={`${styles.liveHall} live-hall`}>
      <span className="live-aura" aria-hidden />
      <span className="live-grain" aria-hidden />

      <div className="live-inner">
        <HeroEnter>
          <header className="live-mast">
            <div className="live-mast-brand">
              <BrandMark size={52} priority />
              <div className="live-mast-copy">
                <p className="live-kicker">{t('studio_kicker')}</p>
                <h1>{t('title')}</h1>
                <p className="live-mast-lead">{t('description')}</p>
              </div>
            </div>
            <div className="live-meters">
              <div className={`live-meter${featuredLive ? ' is-hot' : ''}`}>
                <b>{featuredLive ? 'LIVE' : '—'}</b>
                <span>{t('now_on_air')}</span>
              </div>
              <div className="live-meter">
                <b>{tvRows.length}</b>
                <span>{t('listing_count')}</span>
              </div>
              <div className="live-meter">
                <b>{channelWall.length}</b>
                <span>{t('channel_count')}</span>
              </div>
            </div>
          </header>
        </HeroEnter>

        <Reveal className="live-screen">
          <div className="live-screen-bezel">
            <span className="live-scan" aria-hidden />
            {featuredMatch || featuredSports ? (
              <div className="live-stage">
                <div className="live-stage-top">
                  <em>
                    {[featuredLeague, featuredChannel].filter(Boolean).join(' · ')}
                  </em>
                  <span className={`live-pill${featuredLive ? '' : ' is-ready'}`}>
                    <i />
                    {featuredLive
                      ? featuredSports?.match?.minute
                        ? `${t('now_on_air')} ${featuredSports.match.minute}'`
                        : t('now_on_air')
                      : featuredListing
                        ? t('on_television')
                        : t('watch')}
                  </span>
                </div>
                <div className="live-duel">
                  <div className="live-side">
                    {featuredMatch ? (
                      <LeagueCrest
                        name={featuredMatch.homeTeam.name}
                        logoUrl={featuredMatch.homeTeam.logoUrl}
                        className="live-crest"
                      />
                    ) : null}
                    <strong>
                      {featuredMatch?.homeTeam.name ?? featuredChannel}
                    </strong>
                  </div>
                  <div className="live-score">
                    <b className={featuredLive ? 'is-live' : ''}>
                      {scoreLabel(featuredMatch?.homeScore, featuredMatch?.awayScore)}
                    </b>
                    <span>VS</span>
                  </div>
                  <div className="live-side is-away">
                    {featuredMatch ? (
                      <LeagueCrest
                        name={featuredMatch.awayTeam.name}
                        logoUrl={featuredMatch.awayTeam.logoUrl}
                        className="live-crest"
                      />
                    ) : null}
                    <strong>{featuredMatch?.awayTeam.name ?? ''}</strong>
                  </div>
                </div>
                <div className="live-actions">
                  {STREAMING_ENABLED
                    ? featuredAssets.map((asset) => (
                      <Link key={asset.id} href={`/watch/${asset.id}`} className="live-cta">
                        {asset.channel?.name || t('watch_here')}
                      </Link>
                    ))
                    : null}
                  {featuredMatch ? (
                    <Link href={`/match/${featuredMatch.id}`} className="live-ghost">
                      {t('match_center')}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="live-empty">
                <p>{t('empty')}</p>
              </div>
            )}
          </div>
        </Reveal>

        {(leagues.length > 1 || channelWall.length > 1 || leagueId || channelId) ? (
          <Reveal className="live-band">
            <div className="live-band-head">
              <div className="live-mark">
                <i>01</i>
                <h2>{t('filters')}</h2>
              </div>
              {leagueId || channelId ? (
                <Link href="/live">{pick(locale, 'عرض كل القنوات', 'Show every channel')}</Link>
              ) : null}
            </div>
            <div className="live-filters">
              {leagues.length > 0 ? (
                <div className="live-rail">
                  {leagues.map((league) => {
                    const active = leagueId === league.id;
                    return (
                      <Link
                        key={league.id}
                        href={pageHref({ leagueId: active ? undefined : league.id })}
                        className={`live-chip${active ? ' is-on' : ''}`}
                      >
                        {league.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={league.logoUrl} alt="" />
                        ) : null}
                        {league.name}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
              {channelWall.length > 0 ? (
                <div className="live-rail">
                  {channelWall.map((channel) => {
                    const active = channelId === channel.id;
                    return (
                      <Link
                        key={channel.id}
                        href={pageHref({ channelId: active ? undefined : channel.id })}
                        className={`live-chip${active ? ' is-on' : ''}`}
                      >
                        {channel.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={channel.logoUrl} alt="" />
                        ) : null}
                        {channel.name}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}

        <div className="live-deck">
          <div>
            <Reveal className="live-band">
              <BandHead folio="02" title={t('channels_wall')} lead={t('tonight')} />
              {channelWall.length > 0 ? (
                <div className="live-channels">
                  {channelWall.map((channel) => {
                    const liveListing = channel.listings.find((row) => isLiveStatus(row.match.status)) ?? channel.listings[0];
                    const headline = channel.playable[0]?.match ?? liveListing?.match;
                    return (
                      <article key={channel.id} className="live-channel">
                        <div className="live-channel-top">
                          <div className="live-channel-id">
                            <div className="live-channel-crest">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={channel.logoUrl || '/placeholder.png'} alt="" />
                            </div>
                            <div>
                              <h3>{channel.name}</h3>
                              <p>
                                {[channel.country, channel.playable.length ? t('watch_here') : t('tv_only')]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                          </div>
                          <span className={`live-pill${channel.playable.length ? '' : ' is-ready'}`}>
                            <i />
                            {channel.playable.length ? t('now_on_air') : t('on_television')}
                          </span>
                        </div>

                        {headline ? (
                          <div className="live-matchline">
                            <span>
                              <LeagueCrest name={headline.homeTeam.name} logoUrl={headline.homeTeam.logoUrl} className="h-5 w-5" />
                              {headline.homeTeam.name} × {headline.awayTeam.name}
                              <LeagueCrest name={headline.awayTeam.name} logoUrl={headline.awayTeam.logoUrl} className="h-5 w-5" />
                            </span>
                            <em>
                              {isLiveStatus(headline.status) ? (
                                scoreLabel(headline.homeScore, headline.awayScore)
                              ) : (
                                <ClientTime value={headline.kickoffAt} />
                              )}
                            </em>
                          </div>
                        ) : null}

                        <div className="live-actions">
                          {STREAMING_ENABLED
                            ? channel.playable.map((asset) => (
                              <Link key={asset.id} href={`/watch/${asset.id}`} className="live-cta">
                                {t('watch_here')}
                              </Link>
                            ))
                            : null}
                          {headline ? (
                            <Link href={`/match/${headline.id}`} className="live-ghost">
                              {t('match_center')}
                            </Link>
                          ) : null}
                        </div>

                        {channel.listings.length > 1 ? (
                          <ul className="live-listings">
                            {channel.listings.slice(0, 4).map((row) => (
                              <li key={row.id}>
                                <span>
                                  {row.match.homeTeam.name} × {row.match.awayTeam.name}
                                </span>
                                <ClientTime value={row.match.kickoffAt} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="live-void">
                  <p>{t('empty_tv')}</p>
                  <Link href="/matches" className="live-cta" style={{ marginTop: '0.9rem' }}>
                    {pick(locale, 'برنامج المباريات', 'Match programme')}
                  </Link>
                </div>
              )}
            </Reveal>

            {programs.length > 0 ? (
              <Reveal className="live-band">
                <BandHead folio="03" title={t('schedule')} />
                <div className="live-programs">
                  {programs.map((program) => (
                    <article key={program.assets[0].id} className="live-program">
                      <p>
                        {program.match?.league.name}
                        {program.match &&
                          isMajorLeague({
                            name: program.match.league.name,
                            slug: program.match.league.slug,
                            country: program.match.league.country ?? undefined,
                          })
                          ? ` · ${pick(locale, 'كبرى', 'Major')}`
                          : ''}
                      </p>
                      <h3>
                        {program.match
                          ? `${program.match.homeTeam.name} × ${program.match.awayTeam.name}`
                          : program.assets[0]?.channel?.name}
                      </h3>
                      <div className="live-actions" style={{ marginTop: '0.7rem' }}>
                        {STREAMING_ENABLED
                          ? program.assets.map((asset) => (
                            <Link key={asset.id} href={`/watch/${asset.id}`} className="live-ghost">
                              {asset.channel?.name || t('watch')}
                            </Link>
                          ))
                          : program.match ? (
                            <Link href={`/match/${program.match.id}`} className="live-ghost">
                              {t('match_center')}
                            </Link>
                          ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {linear.length > 0 ? (
              <Reveal className="live-band">
                <BandHead folio="04" title={t('linear_wall')} />
                <div className="live-linear">
                  {linear.map((asset) => (
                    <Link key={asset.id} href={`/watch/${asset.id}`}>
                      <em>
                        {asset.channel?.kind === 'NEWS'
                          ? t('kind_news')
                          : asset.channel?.kind === 'MOVIE'
                            ? t('kind_movie')
                            : asset.channel?.kind === 'SERIES'
                              ? t('kind_series')
                              : asset.status === 'LIVE'
                                ? t('now_on_air')
                                : tw('ready_status')}
                      </em>
                      <strong>{asset.channel?.name || t('title')}</strong>
                    </Link>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {library.length > 0 ? (
              <Reveal className="live-band">
                <BandHead folio="05" title={t('vod_shelf')} />
                <div className="live-programs">
                  {library.map((show) => {
                    const firstEpisode = show.episodes[0];
                    return (
                      <article key={show.id} className="live-program">
                        <p>
                          {show.type}
                          {show.releaseYear ? ` · ${show.releaseYear}` : ''}
                        </p>
                        <h3>
                          <Link href={`/vod/${show.slug}`}>{show.title}</Link>
                        </h3>
                        <div className="live-actions" style={{ marginTop: '0.7rem' }}>
                          <Link href={`/vod/${show.slug}`} className="live-ghost">
                            {tw('open_title')}
                          </Link>
                          {firstEpisode ? (
                            <Link href={`/vod/player/${firstEpisode.id}`} className="live-cta">
                              {tw('watch_asset')}
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </Reveal>
            ) : null}
          </div>

          {upcoming.length > 0 ? (
            <aside className="live-aside">
              <BandHead folio="06" title={t('coming_windows')} />
              {upcoming.map((asset) => (
                <Link key={asset.id} href={`/watch/${asset.id}`} className="live-ticket">
                  <p>{asset.channel?.name || t('title')}</p>
                  <strong>
                    {asset.match
                      ? `${asset.match.homeTeam.name} × ${asset.match.awayTeam.name}`
                      : t('title')}
                  </strong>
                  {asset.startsAt || asset.match?.kickoffAt ? (
                    <ClientTime value={asset.startsAt ?? asset.match!.kickoffAt} />
                  ) : null}
                </Link>
              ))}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
