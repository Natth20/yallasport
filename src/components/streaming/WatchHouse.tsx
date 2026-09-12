import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import { STREAMING_ENABLED } from '@/lib/streaming';
import {
  listLinearCatalog,
  listLiveCatalog,
  listPublishedLibrary,
  upcomingLicensedWindows,
} from '@/lib/streaming/catalog';
import { countryFromHeaders, isGeoAllowed } from '@/lib/streaming/entitlement';
import { ClientTime } from '@/components/datetime/ClientTime';

function typeLabel(
  type: string,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  if (type === 'MOVIE') return t('type_movie');
  if (type === 'SERIES') return t('type_series');
  if (type === 'DOCUMENTARY') return t('type_doc');
  return type;
}

function channelKindLabel(
  kind: string | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  switch ((kind || '').toUpperCase()) {
    case 'NEWS':
      return t('kind_news');
    case 'MOVIE':
      return t('type_movie');
    case 'SERIES':
      return t('type_series');
    case 'DOCUMENTARY':
      return t('type_doc');
    case 'SPORTS':
      return t('kind_sports');
    default:
      return t('kind_tv');
  }
}

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

export async function WatchHouse() {
  const t = await getTranslations('watch');
  const country = countryFromHeaders(await headers());
  const editionYear = new Date().getFullYear();

  const [sports, linear, shows, upcomingRaw] = await Promise.all([
    STREAMING_ENABLED ? listLiveCatalog({ country }).catch(() => []) : Promise.resolve([]),
    STREAMING_ENABLED ? listLinearCatalog({ country }).catch(() => []) : Promise.resolve([]),
    STREAMING_ENABLED ? listPublishedLibrary({ take: 24 }).catch(() => []) : Promise.resolve([]),
    STREAMING_ENABLED
      ? upcomingLicensedWindows(6).catch(() => [])
      : Promise.resolve([]),
  ]);

  const upcoming = upcomingRaw.filter((item) => isGeoAllowed(country, item.geoAllow));
  const featuredSports = sports[0];
  const featuredLinear = !featuredSports ? linear[0] : null;
  const featured = featuredSports || featuredLinear;
  const live = featured?.status === 'LIVE';
  const liveRail = featuredSports ? sports.slice(0, 8) : linear.slice(0, 8);

  return (
    <div className="watch-booth watch-house relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />

      <div className="booth-first-band relative mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <HeroEnter>
          <header className="watch-marquee watch-marquee-lux">
            <div className="flex min-w-0 items-start gap-4">
              <BrandMark size={44} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e8b48a]">{t('kicker')}</p>
                  <EditionPlate year={editionYear} label={t('title')} className="watch-edition" />
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-foreground dark:text-foreground sm:text-5xl">{t('title')}</h1>
                <DeskRule className="mt-4 max-w-sm opacity-50" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/live" className="watch-chip-link">
                {t('back_live')}
              </Link>
              {live ? (
                <span className="watch-live-pill">
                  <i />
                  {t('on_air')}
                </span>
              ) : null}
            </div>
          </header>
        </HeroEnter>

        <Reveal>
          <div className="watch-signature mt-6">
          <div className={sports.length > 0 ? 'is-lead' : ''}>
            <strong>{sports.length}</strong>
            <span>{t('kind_sports')}</span>
          </div>
          <div className={linear.length > 0 && sports.length === 0 ? 'is-lead' : ''}>
            <strong>{linear.length}</strong>
            <span>{t('kind_tv')}</span>
          </div>
          <div>
            <strong>{shows.length}</strong>
            <span>{t('library')}</span>
          </div>
        </div>
        </Reveal>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-12">
            <section>
              <SectionMark
                folio="01"
                title={featuredSports ? t('booth') : featuredLinear ? t('kind_tv') : t('booth')}
              />
              <div className="watch-gate watch-gate-lux mt-5">
                <div className="watch-gate-screen">
                  {featured ? (
                    <div className="watch-featured-stage">
                      <span className="broadcast-snow" />
                      <PhotoCorners className="watch-stage-corners" />
                      <div className="watch-featured-meta">
                        <em>
                          {featured.channel?.name ||
                            (featured.episode?.show.title ?? t('booth'))}
                          {featured.match?.league.name ? ` · ${featured.match.league.name}` : ''}
                          {!featured.match && featured.channel?.kind
                            ? ` · ${channelKindLabel(featured.channel.kind, t)}`
                            : ''}
                        </em>
                        {live ? (
                          <span className="watch-live-pill is-compact">
                            <i />
                            {t('on_air')}
                          </span>
                        ) : (
                          <span className="watch-ready-pill is-compact">{t('ready_status')}</span>
                        )}
                      </div>

                      {featured.match ? (
                        <div className="watch-featured-duel">
                          <div className="watch-featured-side">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={featured.match.homeTeam.logoUrl || '/placeholder-team.png'}
                              alt=""
                              className="watch-featured-crest"
                            />
                            <strong>{featured.match.homeTeam.name}</strong>
                          </div>
                          <span className="watch-featured-vs" aria-hidden>
                            VS
                          </span>
                          <div className="watch-featured-side is-away">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={featured.match.awayTeam.logoUrl || '/placeholder-team.png'}
                              alt=""
                              className="watch-featured-crest"
                            />
                            <strong>{featured.match.awayTeam.name}</strong>
                          </div>
                        </div>
                      ) : (
                        <h2 className="watch-featured-title">
                          {featured.channel?.name ||
                            featured.episode?.show.title ||
                            t('booth')}
                        </h2>
                      )}

                      <div className="watch-featured-actions">
                        <Link href={`/watch/${featured.id}`} className="watch-featured-cta">
                          {t('watch_asset')}
                        </Link>
                        {featured.match ? (
                          <Link href={`/match/${featured.match.id}`} className="watch-chip-link is-ghost">
                            {t('match_center')}
                          </Link>
                        ) : null}
                        {featured.episode?.show.slug ? (
                          <Link
                            href={`/vod/${featured.episode.show.slug}`}
                            className="watch-chip-link is-ghost"
                          >
                            {t('open_title')}
                          </Link>
                        ) : null}
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
                      <p>{t('house_empty')}</p>
                      <Link href="/live" className="watch-chip-link mt-4">
                        {t('back_live')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {liveRail.length > 1 ? (
                <div className="watch-live-rail mt-5">
                  {liveRail.slice(1).map((item, index) => (
                    <Link key={item.id} href={`/watch/${item.id}`} className="watch-live-chip">
                      <span>{String(index + 2).padStart(2, '0')}</span>
                      <strong>
                        {item.match
                          ? `${item.match.homeTeam.name} × ${item.match.awayTeam.name}`
                          : item.channel?.name || item.episode?.show.title || t('booth')}
                      </strong>
                      <em>{item.status === 'LIVE' ? t('on_air') : t('ready_status')}</em>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>

            {shows.length > 0 ? (
              <section>
                <SectionMark folio="02" title={t('library')} />
                <div className="vod-library mt-5">
                  {shows.map((show, index) => {
                    const firstEpisode = show.episodes[0];
                    const playHref = firstEpisode
                      ? `/vod/player/${firstEpisode.id}`
                      : `/vod/${show.slug}`;
                    return (
                      <article
                        key={show.id}
                        className={`vod-shelf-card${index === 0 ? ' is-lead' : ''}`}
                      >
                        <Link href={`/vod/${show.slug}`} className="vod-shelf-media">
                          <span className="watch-poster-folio" aria-hidden>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {show.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={show.posterUrl} alt="" />
                          ) : (
                            <div className="vod-shelf-empty">{show.title}</div>
                          )}
                        </Link>
                        <div className="vod-shelf-copy">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#e8b48a]">
                            {typeLabel(show.type, t)}
                            {show.releaseYear ? ` · ${show.releaseYear}` : ''}
                          </p>
                          <h3>
                            <Link href={`/vod/${show.slug}`}>{show.title}</Link>
                          </h3>
                          <p className="vod-shelf-meta">
                            {show._count.episodes} {t('show_reel')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link href={`/vod/${show.slug}`} className="watch-chip-link is-ghost">
                              {t('open_title')}
                            </Link>
                            <Link href={playHref} className="watch-chip-link is-solid">
                              {t('watch_asset')}
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {upcoming.length > 0 ? (
            <aside className="watch-aside">
              <SectionMark folio="03" title={t('next_up')} />
              <ul className="mt-5 space-y-3">
                {upcoming.map((item, index) => (
                  <li key={item.id}>
                    <Link href={`/watch/${item.id}`} className="watch-ticket watch-ticket-lux block px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#c26a3a]">
                          {item.channel?.name || item.episode?.show.title || t('booth')}
                        </p>
                        <span className="text-[9px] font-black tabular-nums text-foreground/35">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-black leading-6">
                        {item.match
                          ? `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`
                          : item.channel?.name || item.episode?.show.title}
                      </p>
                      {item.startsAt ? (
                        <ClientTime value={item.startsAt} className="mt-1 block text-[11px] text-foreground/45" />
                      ) : null}
                      <TicketBarcode className="mt-3 text-foreground/50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
