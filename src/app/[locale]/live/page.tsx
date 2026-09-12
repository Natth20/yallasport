import { cookies, headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listLinearCatalog, listLiveCatalog, listPublishedLibrary, listTonightTvGuide, upcomingLicensedWindows } from '@/lib/streaming/catalog';
import { countryFromHeaders, isGeoAllowed } from '@/lib/streaming/entitlement';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { pick } from '@/i18n/pick';
import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { ClientTime } from '@/components/datetime/ClientTime';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { isMajorLeague, matchdayWeight } from '@/lib/sports-data/matchday-weight';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

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

function SectionMark({ folio, title, lead }: { folio: string; title: string; lead?: string }) {
  return (
    <div className="watch-section-mark">
      <div className="watch-section-mark-row">
        <span aria-hidden>{folio}</span>
        <h2>{title}</h2>
      </div>
      {lead ? <p className="watch-section-lead">{lead}</p> : null}
      <DeskRule className="mt-3 max-w-xs opacity-45" />
    </div>
  );
}

export default async function LivePage({
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
  const editionYear = new Date().getFullYear();

  const items = STREAMING_ENABLED
    ? await listLiveCatalog({
        country,
        leagueId: leagueId || undefined,
        channelId: channelId || undefined,
      }).catch(() => [])
    : [];

  const linear = STREAMING_ENABLED
    ? await listLinearCatalog({
        country,
        channelId: channelId || undefined,
      }).catch(() => [])
    : [];

  const library = STREAMING_ENABLED
    ? await listPublishedLibrary({ take: 12 }).catch(() => [])
    : [];

  const tvRows = await listTonightTvGuide({
    start,
    end,
    leagueId: leagueId || undefined,
    channelId: channelId || undefined,
  }).catch(() => [] as Awaited<ReturnType<typeof listTonightTvGuide>>);

  const upcoming = STREAMING_ENABLED
    ? (await upcomingLicensedWindows(8).catch(() => [])).filter((asset) => isGeoAllowed(country, asset.geoAllow))
    : [];

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

  const featuredSports = programs[0];
  const featuredLinear = !featuredSports ? linear[0] : null;
  const featuredLive = isLiveStatus(featuredSports?.match?.status) || featuredLinear?.status === 'LIVE';

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

  return (
    <div className="watch-booth broadcast-studio relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-0 sm:px-6 booth-first-band">
        <header className="watch-marquee watch-marquee-lux">
          <div className="flex min-w-0 items-start gap-4">
            <BrandMark size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e8b48a]">
                  {t('studio_kicker')}
                </p>
                <EditionPlate year={editionYear} label={t('title')} className="watch-edition" />
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-foreground dark:text-foreground sm:text-5xl">{t('title')}</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground dark:text-foreground/50">{t('description')}</p>
              <DeskRule className="mt-4 max-w-sm opacity-50" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/watch" className="watch-chip-link">
              {tw('title')}
            </Link>
            {featuredLive ? (
              <span className="watch-live-pill">
                <i />
                {t('now_on_air')}
              </span>
            ) : null}
          </div>
        </header>

        <div className="watch-signature mt-6">
          <div className={programs.length > 0 ? 'is-lead' : ''}>
            <strong>{programs.length}</strong>
            <span>{t('program_count')}</span>
          </div>
          <div className={linear.length > 0 && programs.length === 0 ? 'is-lead' : ''}>
            <strong>{linear.length}</strong>
            <span>{t('linear_wall')}</span>
          </div>
          <div>
            <strong>{library.length}</strong>
            <span>{t('vod_shelf')}</span>
          </div>
        </div>

        <section className="mt-10">
          <SectionMark
            folio="01"
            title={featuredSports ? t('now_on_air') : featuredLinear ? t('linear_wall') : t('now_on_air')}
          />
          <div className="watch-gate watch-gate-lux mt-5">
            <div className="watch-gate-screen">
              {featuredSports ? (
                <div className="watch-featured-stage is-broadcast">
                  <span className="broadcast-snow" />
                  <PhotoCorners className="watch-stage-corners" />
                  <div className="watch-featured-meta">
                    <em>
                      {featuredSports.match?.league.name}
                      {featuredSports.assets[0]?.channel?.name
                        ? ` · ${featuredSports.assets[0].channel.name}`
                        : ''}
                    </em>
                    <span className={`watch-live-pill is-compact${featuredLive ? '' : ' is-ready'}`}>
                      <i />
                      {featuredLive
                        ? featuredSports.match?.minute
                          ? `${t('now_on_air')} ${featuredSports.match.minute}'`
                          : t('now_on_air')
                        : t('watch')}
                    </span>
                  </div>

                  <div className="watch-featured-duel">
                    <div className="watch-featured-side">
                      {featuredSports.match ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featuredSports.match.homeTeam.logoUrl || '/placeholder-team.png'}
                          alt=""
                          className="watch-featured-crest"
                        />
                      ) : null}
                      <strong>
                        {featuredSports.match?.homeTeam.name ?? featuredSports.assets[0]?.channel?.name}
                      </strong>
                    </div>
                    <div className="watch-featured-score">
                      <strong className={featuredLive ? 'is-live' : ''}>
                        {scoreLabel(featuredSports.match?.homeScore, featuredSports.match?.awayScore)}
                      </strong>
                      <span>VS</span>
                    </div>
                    <div className="watch-featured-side is-away">
                      {featuredSports.match ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featuredSports.match.awayTeam.logoUrl || '/placeholder-team.png'}
                          alt=""
                          className="watch-featured-crest"
                        />
                      ) : null}
                      <strong>{featuredSports.match?.awayTeam.name ?? ''}</strong>
                    </div>
                  </div>

                  <div className="watch-featured-actions">
                    {featuredSports.assets.map((asset) => (
                      <Link key={asset.id} href={`/watch/${asset.id}`} className="watch-featured-cta">
                        {asset.channel?.name || t('watch_here')}
                      </Link>
                    ))}
                    {featuredSports.match ? (
                      <Link href={`/match/${featuredSports.match.id}`} className="watch-chip-link is-ghost">
                        {t('match_center')}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : featuredLinear ? (
                <div className="watch-featured-stage is-broadcast">
                  <span className="broadcast-snow" />
                  <PhotoCorners className="watch-stage-corners" />
                  <div className="watch-featured-meta">
                    <em>
                      {featuredLinear.channel?.name}
                      {featuredLinear.channel?.kind ? ` · ${featuredLinear.channel.kind}` : ''}
                    </em>
                    <span className="watch-live-pill is-compact">
                      <i />
                      {t('now_on_air')}
                    </span>
                  </div>
                  <h2 className="watch-featured-title">
                    {featuredLinear.channel?.name || t('linear_wall')}
                  </h2>
                  <div className="watch-featured-actions">
                    <Link href={`/watch/${featuredLinear.id}`} className="watch-featured-cta">
                      {t('watch_here')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="watch-empty-stage">
                  <span className="broadcast-snow" />
                  <PitchWatermark className="pointer-events-none absolute h-44 w-auto text-white/10" />
                  <PhotoCorners className="watch-stage-corners" />
                  <span className="watch-empty-seal" aria-hidden>
                    YS
                  </span>
                  <p>{t('empty')}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {(leagues.length > 1 || channelWall.length > 1 || leagueId || channelId) && (
          <section className="mt-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b48a]">{t('filters')}</p>
              {leagueId || channelId ? (
                <Link href="/live" className="watch-chip-link is-ghost">
                  {pick(locale, 'عرض كل القنوات', 'Show every channel')}
                </Link>
              ) : null}
            </div>
            {leagues.length > 0 ? (
              <div className="watch-filter-rail">
                {leagues.map((league) => {
                  const active = leagueId === league.id;
                  return (
                    <Link
                      key={league.id}
                      href={pageHref({ leagueId: active ? undefined : league.id })}
                      className={`watch-filter-chip${active ? ' is-active' : ''}`}
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
              <div className="watch-filter-rail">
                {channelWall.map((channel) => {
                  const active = channelId === channel.id;
                  return (
                    <Link
                      key={channel.id}
                      href={pageHref({ channelId: active ? undefined : channel.id })}
                      className={`watch-filter-chip${active ? ' is-active' : ''}`}
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
          </section>
        )}

        <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-12">
            <section>
              <SectionMark folio="02" title={t('channels_wall')} lead={t('tonight')} />
              {channelWall.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {channelWall.map((channel, index) => {
                    const liveListing = channel.listings.find((row) => isLiveStatus(row.match.status)) ?? channel.listings[0];
                    const headline = channel.playable[0]?.match ?? liveListing?.match;
                    return (
                      <article key={channel.id} className="broadcast-channel-lux">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="broadcast-channel-crest">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={channel.logoUrl || '/placeholder.png'} alt="" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#e8b48a]">
                                {String(index + 1).padStart(2, '0')}
                              </p>
                              <h3 className="truncate text-[16px] font-black text-white">{channel.name}</h3>
                              <p className="text-[10px] font-medium text-white/40">
                                {[channel.country, channel.playable.length ? t('watch_here') : t('tv_only')]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                          </div>
                          {channel.playable.length > 0 ? (
                            <span className="watch-live-pill is-compact">
                              <i />
                              {t('now_on_air')}
                            </span>
                          ) : (
                            <span className="watch-ready-pill is-compact">{t('on_television')}</span>
                          )}
                        </div>

                        {headline ? (
                          <div className="broadcast-channel-match">
                            <div className="flex min-w-0 items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={headline.homeTeam.logoUrl || '/placeholder-team.png'} alt="" />
                              <span className="truncate text-[13px] font-bold text-white">
                                {headline.homeTeam.name} × {headline.awayTeam.name}
                              </span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={headline.awayTeam.logoUrl || '/placeholder-team.png'} alt="" />
                            </div>
                            <span className="shrink-0 text-[11px] font-black tabular-nums text-[#e8b48a]">
                              {isLiveStatus(headline.status) ? (
                                scoreLabel(headline.homeScore, headline.awayScore)
                              ) : (
                                <ClientTime value={headline.kickoffAt} />
                              )}
                            </span>
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {channel.playable.map((asset) => (
                            <Link key={asset.id} href={`/watch/${asset.id}`} className="watch-chip-link is-solid">
                              {t('watch_here')}
                            </Link>
                          ))}
                          {headline ? (
                            <Link href={`/match/${headline.id}`} className="watch-chip-link is-ghost">
                              {t('match_center')}
                            </Link>
                          ) : null}
                        </div>

                        {channel.listings.length > 1 ? (
                          <ul className="broadcast-channel-listings">
                            {channel.listings.slice(0, 4).map((row) => (
                              <li key={row.id}>
                                <span>
                                  {row.match.homeTeam.name} × {row.match.awayTeam.name}
                                </span>
                                <ClientTime value={row.match.kickoffAt} className="tabular-nums text-white/40" />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="watch-aside-empty mt-5 text-center">
                  <p>{t('empty_tv')}</p>
                  <Link href="/matches" className="watch-chip-link is-solid mt-4 inline-flex">
                    {pick(locale, 'برنامج المباريات', 'Match programme')}
                  </Link>
                </div>
              )}
            </section>

            {programs.length > 0 ? (
              <section>
                <SectionMark folio="03" title={t('schedule')} />
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {programs.map((program, index) => (
                    <article key={program.assets[0].id} className="broadcast-program-card">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-white/40">
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
                        <span className="text-[9px] font-black tabular-nums text-[#e8b48a]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="mt-1 text-[15px] font-black text-white">
                        {program.match
                          ? `${program.match.homeTeam.name} × ${program.match.awayTeam.name}`
                          : program.assets[0]?.channel?.name}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {program.assets.map((asset) => (
                          <Link key={asset.id} href={`/watch/${asset.id}`} className="watch-chip-link is-ghost">
                            {asset.channel?.name || t('watch')}
                          </Link>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {linear.length > 0 ? (
              <section>
                <SectionMark folio="04" title={t('linear_wall')} />
                <div className="watch-live-rail mt-5">
                  {linear.map((asset, index) => (
                    <Link key={asset.id} href={`/watch/${asset.id}`} className="watch-live-chip">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{asset.channel?.name || t('title')}</strong>
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
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {library.length > 0 ? (
              <section>
                <SectionMark folio="05" title={t('vod_shelf')} />
                <div className="vod-library mt-5">
                  {library.map((show, index) => {
                    const firstEpisode = show.episodes[0];
                    return (
                      <article
                        key={show.id}
                        className={`vod-shelf-card${index === 0 ? ' is-lead' : ''}`}
                      >
                        <Link href={`/vod/${show.slug}`} className="vod-shelf-media">
                          {show.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={show.posterUrl} alt="" />
                          ) : (
                            <div className="vod-shelf-empty">{show.title}</div>
                          )}
                        </Link>
                        <div className="vod-shelf-copy">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#e8b48a]">
                            {show.type}
                            {show.releaseYear ? ` · ${show.releaseYear}` : ''}
                          </p>
                          <h3>
                            <Link href={`/vod/${show.slug}`}>{show.title}</Link>
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link href={`/vod/${show.slug}`} className="watch-chip-link is-ghost">
                              {tw('open_title')}
                            </Link>
                            {firstEpisode ? (
                              <Link
                                href={`/vod/player/${firstEpisode.id}`}
                                className="watch-chip-link is-solid"
                              >
                                {tw('watch_asset')}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="watch-aside space-y-8">
            {upcoming.length > 0 ? (
              <section>
                <SectionMark folio="04" title={t('coming_windows')} />
                <ul className="mt-5 space-y-3">
                  {upcoming.map((asset, index) => (
                    <li key={asset.id}>
                      <Link href={`/watch/${asset.id}`} className="watch-ticket watch-ticket-lux block px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#c26a3a]">
                            {asset.channel?.name || t('title')}
                          </p>
                          <span className="text-[9px] font-black tabular-nums text-foreground/35">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-black leading-6">
                          {asset.match
                            ? `${asset.match.homeTeam.name} vs ${asset.match.awayTeam.name}`
                            : t('title')}
                        </p>
                        {asset.startsAt || asset.match?.kickoffAt ? (
                          <ClientTime
                            value={asset.startsAt ?? asset.match!.kickoffAt}
                            className="mt-1 block text-[11px] text-foreground/45"
                          />
                        ) : null}
                        <TicketBarcode className="mt-3 text-foreground/50" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
