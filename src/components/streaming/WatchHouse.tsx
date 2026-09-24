import { swallow } from '@/lib/ops/caught';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/brand/BrandMark';
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
import { Tv, Radio, PlayCircle, Film, Sparkles, Flame, Clock, Shield, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { MatchStreamPlayer } from '@/components/streaming/MatchStreamPlayer';

function typeLabel(
  type: string,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  if (type === 'MOVIE') return t('type_movie');
  if (type === 'SERIES') return t('type_series');
  if (type === 'DOCUMENTARY') return t('type_doc');
  return type;
}

export async function WatchHouse({
  locale = 'ar',
  mode = 'live',
}: {
  locale?: string;
  mode?: 'live' | 'library';
} = {}) {
  const t = await getTranslations('watch');
  const country = countryFromHeaders(await headers());
  const editionYear = new Date().getFullYear();

  const isLibrary = mode === 'library';
  const [sports, linear, shows, upcomingRaw] = await Promise.all([
    !isLibrary && STREAMING_ENABLED ? listLiveCatalog({ country }).catch(swallow("src/components/streaming/WatchHouse.tsx:41", [])) : Promise.resolve([]),
    !isLibrary && STREAMING_ENABLED ? listLinearCatalog({ country }).catch(swallow("src/components/streaming/WatchHouse.tsx:42", [])) : Promise.resolve([]),
    isLibrary && STREAMING_ENABLED ? listPublishedLibrary({ take: 24 }).catch(swallow("src/components/streaming/WatchHouse.tsx:43", [])) : Promise.resolve([]),
    !isLibrary && STREAMING_ENABLED
      ? upcomingLicensedWindows(6).catch(swallow("src/components/streaming/WatchHouse.tsx:45", []))
      : Promise.resolve([]),
  ]);

  const upcoming = upcomingRaw.filter((item) => isGeoAllowed(country, item.geoAllow));
  const featuredSports = sports[0];
  const featuredLinear = !featuredSports ? linear[0] : null;
  const featured = featuredSports || featuredLinear;
  const live = featured?.status === 'LIVE';

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/20 via-emerald-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pt-6">
        {/* ——— Top Marquee Header ——— */}
        <HeroEnter>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <BrandMark size={44} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-md bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                    <Sparkles className="h-3 w-3" />
                    {t(isLibrary ? 'library_kicker' : 'kicker')}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {isLibrary ? `YS-VOD-${editionYear}` : `YS-LIVE-${editionYear}`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1 tracking-tight">
                  {t(isLibrary ? 'library_title' : 'title')}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={isLibrary ? '/watch' : '/vod'}
                className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10 hover:border-primary/40 transition-all"
              >
                {isLibrary ? <Radio className="h-4 w-4 text-primary" /> : <Film className="h-4 w-4 text-primary" />}
                <span>{t(isLibrary ? 'go_live' : 'go_library')}</span>
              </Link>
              <Link
                href="/live"
                className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10 hover:border-primary/40 transition-all"
              >
                <Radio className="h-4 w-4 text-primary" />
                <span>{t('back_live')}</span>
              </Link>
              {live && (
                <span className="flex items-center gap-2 rounded-2xl bg-red-500/20 border border-red-500/40 px-4 py-2.5 text-xs font-black text-red-400 shadow-lg shadow-red-500/20 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span>{t('on_air')}</span>
                </span>
              )}
            </div>
          </div>
        </HeroEnter>

        {/* ——— Stats Strip ——— */}
        <Reveal>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl text-center">
              <span className="text-xl sm:text-2xl font-black text-primary tabular-nums">{sports.length}</span>
              <p className="text-[11px] font-bold text-muted-foreground mt-1">{t('kind_sports')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">{linear.length}</span>
              <p className="text-[11px] font-bold text-muted-foreground mt-1">{t('kind_tv')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl text-center">
              <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums">{shows.length}</span>
              <p className="text-[11px] font-bold text-muted-foreground mt-1">{t('library')}</p>
            </div>
          </div>
        </Reveal>

        {/* ——— Main Layout Grid ——— */}
        <div className="grid gap-8 xl:grid-cols-12 items-start">
          {/* Main Broadcast Arena (Left Column) */}
          <div className="space-y-8 xl:col-span-8">
            {/* Live Sports Player Screen */}
            {!isLibrary ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  <span>{t('booth')} • {locale === 'ar' ? 'البث المباشر الفوري' : 'Live Stream'}</span>
                </h2>
                {live ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/20 px-3 py-1 text-[10px] font-black text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {t('on_air')}
                  </span>
                ) : null}
              </div>

              {featured ? (
                <MatchStreamPlayer assetId={featured.id} />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/80 px-6 text-center">
                  <Lock className="mb-3 h-8 w-8 text-white/40" />
                  <p className="text-sm font-black text-white">{t('house_empty')}</p>
                  <p className="mt-2 max-w-md text-xs text-muted-foreground">{t('house_empty_copy')}</p>
                </div>
              )}

              {/* Featured Match Card if active */}
              {featured?.match && (
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl transition-all hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={featured.match.homeTeam.logoUrl || '/placeholder-team.png'}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                        <strong className="text-sm font-black text-foreground">{featured.match.homeTeam.name}</strong>
                      </div>
                      <span className="font-mono text-xs font-black text-primary">VS</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-foreground">{featured.match.awayTeam.name}</strong>
                        <img
                          src={featured.match.awayTeam.logoUrl || '/placeholder-team.png'}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/match/${featured.match.id}`}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-foreground hover:bg-white/10 transition-all"
                      >
                        {t('match_center')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </section>
            ) : null}

            {/* Live & Linear Channels Grid */}
            {!isLibrary && linear.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Tv className="h-4 w-4 text-primary" />
                  <span>{t('kind_tv')}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {linear.map((item) => (
                    <Link
                      key={item.id}
                      href={`/watch/${item.id}`}
                      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card/90"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Tv className="h-4 w-4" />
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">24/7 LIVE</span>
                      </div>
                      <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mt-3">
                        {item.channel?.name || t('title')}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {item.channel?.country || 'Sports Network'}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* VOD Library Shows */}
            {isLibrary && (
              <section className="space-y-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Film className="h-4 w-4 text-primary" />
                  <span>{t('library')}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {shows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/vod/${show.slug}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:border-primary/40 hover:-translate-y-1 shadow-lg"
                    >
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {show.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={show.posterUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <Film className="h-6 w-6" />
                          </div>
                        )}
                        <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-md">
                          {typeLabel(show.type, t)}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {show.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {show.episodes.length} {t('episodes')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {!isLibrary ? (
          <aside className="space-y-6 xl:col-span-4">
            <div className="rounded-3xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{t('upcoming')}</span>
              </h3>

              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((item) => (
                    <Link
                      key={item.id}
                      href={`/watch/${item.id}`}
                      className="group flex flex-col gap-1.5 rounded-2xl border border-white/5 bg-foreground/5 p-3.5 transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-primary">
                        <span>{item.channel?.name || t('title')}</span>
                        {item.startsAt && <ClientTime value={item.startsAt} />}
                      </div>
                      <strong className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                        {item.match
                          ? `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`
                          : item.channel?.name}
                      </strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('no_upcoming')}</p>
              )}
            </div>
          </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
