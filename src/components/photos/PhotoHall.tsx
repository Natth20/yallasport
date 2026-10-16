'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import {
  ArrowUpRight,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  Search,
  Sparkles,
  Trophy,
  Swords,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
  X,
} from 'lucide-react';
import styles from './photo-hall.module.css';

export type PhotoFrame = {
  id: string;
  slug: string;
  title: string;
  image: string;
  srcSet?: string;
  sourceName: string | null;
  publishedAt: string;
  categoryGroup?: 'ALL' | 'TOURNAMENT' | 'LEAGUE' | 'MATCH' | 'EVENT';
  categoryLabel?: string;
  categoryTag?: string;
  relatedNewsSlug?: string;
  relatedTeam?: {
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  relatedLeague?: {
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  relatedMatch?: {
    id: string;
    label: string;
  } | null;
};

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

export function PhotoHall({
  locale,
  frames: initialFrames,
  emptyTitle,
  emptyLead,
}: {
  locale: string;
  frames: PhotoFrame[];
  emptyTitle: string;
  emptyLead: string;
}) {
  const [frames, setFrames] = useState(initialFrames);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TOURNAMENT' | 'LEAGUE' | 'MATCH' | 'EVENT'>('ALL');
  const [paused, setPaused] = useState(false);
  const [theater, setTheater] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(initialFrames[0]?.id || null);
  const touchX = useRef<number | null>(null);
  const ar = locale === 'ar';

  useEffect(() => {
    setFrames(initialFrames);
    setActive((prev) => (prev && initialFrames.some((frame) => frame.id === prev) ? prev : initialFrames[0]?.id || null));
  }, [initialFrames]);

  // Tab definitions
  const tabs = [
    { id: 'ALL' as const, label: ar ? 'كل الصور' : 'All Photos', icon: Layers },
    { id: 'TOURNAMENT' as const, label: ar ? 'البطولات القارية' : 'Continental Cups', icon: Trophy },
    { id: 'LEAGUE' as const, label: ar ? 'الدوريات الكبرى' : 'Domestic Leagues', icon: Flame },
    { id: 'MATCH' as const, label: ar ? 'المباريات والقمم' : 'Matches & Clashes', icon: Swords },
    { id: 'EVENT' as const, label: ar ? 'الانتقالات والأحداث' : 'Transfers & Events', icon: Sparkles },
  ];

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: frames.length, TOURNAMENT: 0, LEAGUE: 0, MATCH: 0, EVENT: 0 };
    for (const f of frames) {
      if (f.categoryGroup && counts[f.categoryGroup] !== undefined) {
        counts[f.categoryGroup] += 1;
      }
    }
    return counts;
  }, [frames]);

  // Filtered frames
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return frames.filter((frame) => {
      // Tab filter
      if (activeTab !== 'ALL' && frame.categoryGroup !== activeTab) {
        return false;
      }
      // Text search
      if (!q) return true;
      const haystack = `${frame.title} ${frame.sourceName || ''} ${frame.categoryLabel || ''} ${frame.relatedTeam?.name || ''} ${frame.relatedLeague?.name || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTab, frames, query]);

  const current = visible.find((frame) => frame.id === active) || visible[0] || frames[0];
  const currentIndex = Math.max(0, visible.findIndex((frame) => frame.id === current?.id));
  const queue = visible.slice(0, 8);

  useEffect(() => {
    if (paused || theater || visible.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((prev) => {
        const index = Math.max(0, visible.findIndex((frame) => frame.id === prev));
        return visible[(index + 1) % visible.length]?.id || prev;
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [paused, theater, visible]);

  useEffect(() => {
    document.body.style.overflow = theater ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [theater]);

  function show(id: string) {
    setActive(id);
  }

  function step(delta: number) {
    if (!visible.length) return;
    const next = visible[(currentIndex + delta + visible.length) % visible.length];
    if (next) show(next.id);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && theater) {
        setTheater(false);
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      const dir = ar ? -delta : delta;
      const next = visible[(currentIndex + dir + visible.length) % visible.length];
      if (next) setActive(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ar, currentIndex, theater, visible]);

  if (!current) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyMark}>
          <Camera size={24} />
        </span>
        <strong>{emptyTitle}</strong>
        <p>{emptyLead}</p>
      </div>
    );
  }

  return (
    <div className={styles.hall}>
      {/* ----------------- TOP CATEGORY TABS NAVIGATION (شريط سحب أنيق وتمرير أفقي سلس) ----------------- */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/70 border border-border/60 backdrop-blur-md mb-6 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth whitespace-nowrap [-webkit-overflow-scrolling:touch]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon size={15} />
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.console}>
        <section id="photos-cinema" className={styles.screen} aria-live="polite">
          <div
            className={styles.chassis}
            onTouchStart={(event) => {
              touchX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchX.current == null) return;
              const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) < 48) return;
              step(dx > 0 ? (ar ? 1 : -1) : ar ? -1 : 1);
            }}
          >
            <div className={styles.bezel}>
              <div className={styles.bezelLeft}>
                <span className={styles.equalizer} aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span>{current.categoryLabel || pick(locale, 'الصور المعتمدة', 'Official Photos')}</span>
              </div>
              <div className={styles.bezelRight}>
                <span className={styles.clock}>
                  {folio(currentIndex)} / {folio(visible.length)}
                </span>
              </div>
            </div>

            <div className={styles.frame}>
              <button
                type="button"
                className={styles.print}
                onClick={() => {
                  setPaused(true);
                  setTheater(true);
                }}
                aria-label={pick(locale, 'افتح الإطار مكبراً', 'Open the print')}
              >
                <CoverImage
                  src={current.image}
                  srcSet={current.srcSet}
                  alt={current.title}
                  sizes="(max-width: 1100px) 100vw, 70vw"
                  priority
                  className="object-cover"
                />
              </button>
              <span className={`${styles.bracket} ${styles.tl}`} aria-hidden />
              <span className={`${styles.bracket} ${styles.tr}`} aria-hidden />
              <span className={`${styles.bracket} ${styles.bl}`} aria-hidden />
              <span className={`${styles.bracket} ${styles.br}`} aria-hidden />

              {visible.length > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.step} ${styles.prev}`}
                    onClick={() => step(-1)}
                    aria-label={pick(locale, 'السابق', 'Previous')}
                  >
                    {ar ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                  </button>
                  <button
                    type="button"
                    className={`${styles.step} ${styles.next}`}
                    onClick={() => step(1)}
                    aria-label={pick(locale, 'التالي', 'Next')}
                  >
                    {ar ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
                  </button>
                </>
              ) : null}

              <span
                key={`${current.id}-${paused}-${theater}`}
                className={`${styles.meter}${paused || theater ? ` ${styles.held}` : ''}`}
                aria-hidden
              />
            </div>
          </div>

          <div className={styles.program}>
            {/* Classification & Relation Badges */}
            <div className={styles.chips}>
              {current.categoryLabel ? (
                <span className={styles.chipOn}>
                  <Trophy size={13} aria-hidden />
                  <b>{current.categoryLabel}</b>
                </span>
              ) : null}

              {current.relatedTeam ? (
                <Link
                  href={`/team/${current.relatedTeam.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <Shield size={12} />
                  <span>{current.relatedTeam.name}</span>
                </Link>
              ) : null}

              {current.sourceName ? (
                <span className={styles.chip}>
                  <Camera size={12} aria-hidden />
                  <span>{current.sourceName}</span>
                </span>
              ) : null}

              {current.publishedAt ? (
                <span className={styles.chip}>
                  <Calendar size={12} aria-hidden />
                  <ClientTime
                    value={current.publishedAt}
                    locale={locale}
                    options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                  />
                </span>
              ) : null}
            </div>

            <h2 dir="auto" className={styles.programTitle}>
              {current.title}
            </h2>

            {/* Direct Related News, Match, and Team Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Link href={`/news/${current.slug}`} className={styles.go}>
                <span>{pick(locale, 'اقرأ التقرير الإخباري الكامل', 'Read Full Report')}</span>
                <ArrowUpRight size={14} />
              </Link>

              {current.relatedLeague ? (
                <Link
                  href={`/league/${current.relatedLeague.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:border-orange-500 text-xs font-bold text-foreground transition-all"
                >
                  <Trophy size={13} className="text-orange-500" />
                  <span>{current.relatedLeague.name}</span>
                </Link>
              ) : null}

              {current.relatedMatch ? (
                <Link
                  href={`/matches`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:border-orange-500 text-xs font-bold text-foreground transition-all"
                >
                  <Swords size={13} className="text-orange-500" />
                  <span>{current.relatedMatch.label}</span>
                </Link>
              ) : null}

              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  setPaused(true);
                  setTheater(true);
                }}
              >
                <Maximize2 size={13} aria-hidden />
                <span>{pick(locale, 'تكبير الصورة', 'Enlarge')}</span>
              </button>

              {visible.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.ghost}${paused ? ` ${styles.isPaused}` : ''}`}
                  onClick={() => setPaused((value) => !value)}
                >
                  {paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
                  <span>{paused ? pick(locale, 'تشغيل', 'Play') : pick(locale, 'إيقاف', 'Pause')}</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {queue.length > 1 ? (
          <aside className={styles.queue} aria-label={pick(locale, 'قائمة الإطارات', 'Print queue')}>
            <header className={styles.queueHead}>
              <p>{pick(locale, 'الصورة الحالية', 'Current photo')}</p>
              <h3>{pick(locale, 'المعرض', 'Gallery')}</h3>
            </header>
            <ol className={styles.queueList}>
              {queue.map((frame, index) => {
                const on = frame.id === current.id;
                return (
                  <li key={frame.id}>
                    <button
                      type="button"
                      className={`${styles.queueItem}${on ? ` ${styles.on}` : ''}`}
                      onClick={() => show(frame.id)}
                      aria-pressed={on}
                    >
                      <span className={styles.queueNum}>{folio(index)}</span>
                      <span className={styles.queueThumb}>
                        <CoverImage src={frame.image} srcSet={frame.srcSet} alt="" sizes="120px" className="object-cover" />
                      </span>
                      <span className={styles.queueCopy}>
                        <b dir="auto">{frame.title}</b>
                        <small>{frame.categoryLabel || frame.sourceName || pick(locale, 'المصدر', 'Source')}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>

      {/* ----------------- PHOTO WALL / GRID ----------------- */}
      <section id="photos-wall" className={styles.shelf}>
        <header className={styles.shelfHead}>
          <div>
            <div className={styles.shelfTitle}>
              <Sparkles size={18} aria-hidden />
              <h3>{pick(locale, 'معرض الصور المصنّفة', 'Categorized Photo Gallery')}</h3>
              <span>{visible.length}</span>
            </div>
            <p>
              {pick(
                locale,
                'صور موثقة مرتبطة بالبطولات والأندية والمباريات المنشورة. اضغط على أي صورة للعرض والاطلاع على التقرير المرتبط.',
                'Verified sports photos linked to matches, tournaments, and clubs. Tap any photo to view.',
              )}
            </p>
          </div>
        </header>

        <div className={styles.tools}>
          <div className={styles.search}>
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={pick(locale, 'ابحث في العناوين أو الأندية أو البطولات…', 'Search titles, clubs, or tournaments…')}
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label={pick(locale, 'مسح البحث', 'Clear search')}>
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className={styles.quiet}>
            <Search size={22} aria-hidden />
            <p>{pick(locale, 'لا توجد صور تطابق هذا التصنيف أو البحث.', 'No photos match this category or search.')}</p>
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                setQuery('');
                setActiveTab('ALL');
              }}
            >
              {pick(locale, 'عرض كل الصور', 'Show All Photos')}
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((frame, index) => {
              const on = frame.id === current.id;
              return (
                <button
                  key={frame.id}
                  type="button"
                  className={`${styles.tile}${on ? ` ${styles.on}` : ''}`}
                  onClick={() => show(frame.id)}
                  aria-pressed={on}
                  aria-label={frame.title}
                >
                  <span className={styles.poster}>
                    <CoverImage
                      src={frame.image}
                      srcSet={frame.srcSet}
                      alt=""
                      sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 25vw"
                      priority={index < 8}
                      className="object-cover"
                    />
                    <span className={styles.scrim} aria-hidden />
                    <span className={styles.folio}>{folio(index)}</span>

                    {/* Category Pill on top of photo */}
                    {frame.categoryLabel ? (
                      <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-md px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-white border border-white/10 z-10 max-w-[85%] truncate">
                        {frame.categoryLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.copy}>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-1 overflow-hidden">
                      <span className="truncate max-w-[58%]">{frame.sourceName || pick(locale, 'المصدر', 'Source')}</span>
                      {frame.publishedAt ? (
                        <span className="shrink-0 text-[10px]">
                          <ClientTime
                            value={frame.publishedAt}
                            locale={locale}
                            options={{ day: 'numeric', month: 'short' }}
                          />
                        </span>
                      ) : null}
                    </div>
                    <b dir="auto">{frame.title}</b>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------- FULLSCREEN LIGHTBOX / THEATER MODAL ----------------- */}
      {theater
        ? createPortal(
            <div className={styles.theater} role="dialog" aria-modal="true" aria-label={current.title}>
              <button
                type="button"
                className={styles.scrimBtn}
                onClick={() => setTheater(false)}
                aria-label={pick(locale, 'إغلاق', 'Close')}
              />
              <figure className={styles.theaterCard}>
                <button type="button" className={styles.close} onClick={() => setTheater(false)}>
                  <X size={16} />
                  <span>Esc</span>
                </button>
                <div className={styles.theaterStage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.image} srcSet={current.srcSet} sizes="min(1200px, 94vw)" alt={current.title} referrerPolicy="no-referrer" />
                  {visible.length > 1 ? (
                    <>
                      <button type="button" className={`${styles.step} ${styles.prev}`} onClick={() => step(-1)}>
                        {ar ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                      </button>
                      <button type="button" className={`${styles.step} ${styles.next}`} onClick={() => step(1)}>
                        {ar ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
                      </button>
                    </>
                  ) : null}
                </div>
                <figcaption>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {current.categoryLabel ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-black text-orange-500 border border-orange-500/20">
                        {current.categoryLabel}
                      </span>
                    ) : null}
                    {current.relatedTeam ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-500 border border-emerald-500/20">
                        {current.relatedTeam.name}
                      </span>
                    ) : null}
                  </div>

                  <strong dir="auto">{current.title}</strong>

                  {/* Related story and entities links */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/40">
                    <Link href={`/news/${current.slug}`} className={styles.go}>
                      <span>{pick(locale, 'اقرأ التقرير الإخباري الكامل', 'Read Full Report')}</span>
                      <ArrowUpRight size={14} />
                    </Link>

                    {current.relatedTeam ? (
                      <Link
                        href={`/team/${current.relatedTeam.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:border-orange-500 text-xs font-bold text-foreground transition-all"
                      >
                        <Shield size={13} className="text-emerald-500" />
                        <span>{current.relatedTeam.name}</span>
                      </Link>
                    ) : null}

                    {current.relatedLeague ? (
                      <Link
                        href={`/league/${current.relatedLeague.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 hover:border-orange-500 text-xs font-bold text-foreground transition-all"
                      >
                        <Trophy size={13} className="text-orange-500" />
                        <span>{current.relatedLeague.name}</span>
                      </Link>
                    ) : null}

                    <button type="button" className={styles.ghost} onClick={() => setTheater(false)}>
                      {pick(locale, 'إغلاق', 'Close')}
                    </button>
                  </div>
                </figcaption>
              </figure>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
