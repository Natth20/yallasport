import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';

type EpisodeBit = {
  id: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  title: string | null;
  description: string | null;
  duration: number | null;
};

type ShowBit = {
  title: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  type: string;
  releaseYear: number | null;
  rating: string | null;
  categories: string[];
  episodes: EpisodeBit[];
};

function typeLabel(type: string, locale: string) {
  if (type === 'MOVIE') return pick(locale, 'فيلم', 'Film');
  if (type === 'SERIES') return pick(locale, 'مسلسل', 'Series');
  if (type === 'DOCUMENTARY') return pick(locale, 'وثائقي', 'Documentary');
  return type;
}

function episodeTitle(ep: EpisodeBit, locale: string) {
  if (ep.title?.trim()) return ep.title;
  if (ep.episodeNumber != null) {
    return pick(locale, `الحلقة ${ep.episodeNumber}`, `Episode ${ep.episodeNumber}`);
  }
  return pick(locale, 'حلقة', 'Episode');
}

export function VodTitle({ locale, show }: { locale: string; show: ShowBit }) {
  const firstEpisode = show.episodes[0];
  const seasons = [
    ...new Set(show.episodes.map((ep) => ep.seasonNumber).filter((n): n is number => typeof n === 'number')),
  ];
  const facts = [
    show.releaseYear ? { label: pick(locale, 'السنة', 'Year'), value: String(show.releaseYear) } : null,
    show.rating ? { label: pick(locale, 'التصنيف', 'Rating'), value: show.rating } : null,
    show.episodes.length > 0
      ? { label: pick(locale, 'الحلقات', 'Episodes'), value: String(show.episodes.length) }
      : null,
    seasons.length > 0
      ? { label: pick(locale, 'المواسم', 'Seasons'), value: String(seasons.length) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const art = show.backdropUrl || show.posterUrl;

  return (
    <div className="watch-booth vod-title relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />

      <section className="vod-hero">
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" className="vod-hero-wash" />
        ) : (
          <PitchWatermark className="vod-hero-ghost" />
        )}
        <div className="vod-hero-shade" aria-hidden />
        <PhotoCorners className="vod-hero-corners" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-5 sm:px-6 lg:flex-row lg:items-end lg:gap-10">
          <div className="vod-poster-frame">
            {show.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={show.posterUrl} alt="" />
            ) : (
              <div className="vod-poster-empty">
                <BrandMark size={48} />
                <span>{show.title}</span>
              </div>
            )}
            <span className="vod-poster-folio" aria-hidden>
              YS
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link href="/vod" className="watch-chip-link is-ghost">
                {pick(locale, 'المكتبة', 'Library')}
              </Link>
              <Link href="/live" className="watch-chip-link is-ghost">
                {pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live')}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="watch-seal">{typeLabel(show.type, locale)}</span>
              {show.releaseYear ? <span className="watch-ready-pill is-compact">{show.releaseYear}</span> : null}
              {show.rating ? <span className="watch-ready-pill is-compact">{show.rating}</span> : null}
              <EditionPlate
                year={show.releaseYear || new Date().getFullYear()}
                label={pick(locale, 'عرض', 'Title')}
                className="watch-edition"
              />
            </div>

            <h1 className="vod-wordmark">{show.title}</h1>
            {show.description ? <p className="vod-standfirst">{show.description}</p> : null}
            <DeskRule className="mt-5 max-w-sm opacity-50" />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {firstEpisode ? (
                <Link href={`/vod/player/${firstEpisode.id}`} className="watch-featured-cta">
                  {pick(locale, 'تشغيل', 'Play')}
                </Link>
              ) : null}
              {show.episodes.length > 0 ? (
                <a href="#episodes" className="watch-chip-link">
                  {pick(locale, `${show.episodes.length} حلقة`, `${show.episodes.length} episodes`)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
        <div className="space-y-8">
          <section id="episodes" className="vod-plate scroll-mt-28">
            <div className="watch-section-mark">
              <div className="watch-section-mark-row">
                <span aria-hidden>01</span>
                <h2>{pick(locale, 'الحلقات', 'Episodes')}</h2>
              </div>
              <DeskRule className="mt-3 max-w-xs opacity-45" />
            </div>

            {show.episodes.length > 0 ? (
              <ul className="vod-episode-stack mt-6">
                {show.episodes.map((ep, index) => (
                  <li key={ep.id}>
                    <Link href={`/vod/player/${ep.id}`} className="vod-episode-row">
                      <span className="vod-episode-index" aria-hidden>
                        {String(ep.episodeNumber ?? index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong>{episodeTitle(ep, locale)}</strong>
                        <div className="vod-episode-meta">
                          {ep.seasonNumber != null ? (
                            <em>
                              {pick(locale, 'موسم', 'Season')} {ep.seasonNumber}
                            </em>
                          ) : null}
                          {ep.duration != null ? (
                            <em>
                              {ep.duration} {pick(locale, 'د', 'min')}
                            </em>
                          ) : null}
                        </div>
                        {ep.description ? <p>{ep.description}</p> : null}
                      </div>
                      <span className="vod-episode-play" aria-hidden>
                        ▶
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-white/40">
                {pick(locale, 'لا حلقات لهذا العنوان بعد.', 'No episodes for this title yet.')}
              </p>
            )}
          </section>
        </div>

        <aside className="watch-aside space-y-5">
          {facts.length > 0 ? (
            <section className="vod-plate">
              <div className="watch-section-mark">
                <div className="watch-section-mark-row">
                  <span aria-hidden>02</span>
                  <h2>{pick(locale, 'البطاقة', 'Title card')}</h2>
                </div>
                <DeskRule className="mt-3 max-w-xs opacity-45" />
              </div>
              <dl className="vod-facts mt-5">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <TicketBarcode className="mt-5 text-primary/55" />
            </section>
          ) : null}

          {show.categories.length > 0 ? (
            <section className="vod-plate">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {pick(locale, 'التصنيفات', 'Categories')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {show.categories.map((cat) => (
                  <span key={cat} className="watch-ready-pill is-compact">
                    {cat}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="vod-ticket">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">
              {typeLabel(show.type, locale)}
            </p>
            <p className="mt-1 text-sm font-black leading-6 text-foreground">{show.title}</p>
            {show.releaseYear ? (
              <p className="mt-1 text-[11px] font-bold text-foreground/45">{show.releaseYear}</p>
            ) : null}
            <TicketBarcode className="mt-3 text-foreground/45" />
          </div>
        </aside>
      </div>
    </div>
  );
}
