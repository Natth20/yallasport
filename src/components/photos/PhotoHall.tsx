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
  const [paused, setPaused] = useState(false);
  const [theater, setTheater] = useState(false);
  const [source, setSource] = useState('ALL');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(initialFrames[0]?.id || null);
  const touchX = useRef<number | null>(null);
  const ar = locale === 'ar';

  const sourceNames = useMemo(() => {
    const names = new Set<string>();
    for (const frame of frames) {
      if (frame.sourceName) names.add(frame.sourceName);
    }
    return Array.from(names);
  }, [frames]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return frames.filter((frame) => {
      if (source !== 'ALL' && frame.sourceName !== source) return false;
      if (!q) return true;
      return `${frame.title} ${frame.sourceName || ''}`.toLowerCase().includes(q);
    });
  }, [frames, query, source]);

  const current = visible.find((frame) => frame.id === active) || visible[0] || frames[0];
  const currentIndex = Math.max(0, visible.findIndex((frame) => frame.id === current?.id));
  const queue = visible.slice(0, 8);

  useEffect(() => {
    setFrames(initialFrames);
    setActive((prev) => (prev && initialFrames.some((frame) => frame.id === prev) ? prev : initialFrames[0]?.id || null));
  }, [initialFrames]);

  useEffect(() => {
    const pull = async () => {
      try {
        const res = await fetch(`/api/media/photos?locale=${locale}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { frames?: PhotoFrame[] };
        if (!Array.isArray(data.frames) || data.frames.length === 0) return;
        setFrames(data.frames);
        setActive((prev) => (prev && data.frames!.some((frame) => frame.id === prev) ? prev : data.frames![0]?.id || null));
      } catch {
        // keep the last wall
      }
    };
    const timer = window.setInterval(pull, 120_000);
    const first = window.setTimeout(pull, 8_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, [locale]);

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
                <span>{pick(locale, 'الصور', 'Photos')}</span>
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
            <div className={styles.chips}>
              <span className={styles.chipOn}>
                <Camera size={13} aria-hidden />
                <b>{current.sourceName || pick(locale, 'الصور', 'Photos')}</b>
              </span>
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
              <span className={styles.chip}>
                {folio(currentIndex)} / {folio(visible.length)}
              </span>
            </div>

            <h2 dir="auto" className={styles.programTitle}>
              {current.title}
            </h2>

            <div className={styles.acts}>
              <Link href={`/news/${current.slug}`} className={styles.go}>
                <span>{pick(locale, 'اقرأ التقرير', 'Read the report')}</span>
                <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  setPaused(true);
                  setTheater(true);
                }}
              >
                <Maximize2 size={13} aria-hidden />
                <span>{pick(locale, 'تكبير', 'Enlarge')}</span>
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
                        <small>{frame.sourceName || pick(locale, 'المصدر', 'Source')}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>

      <section id="photos-wall" className={styles.shelf}>
        <header className={styles.shelfHead}>
          <div>
            <div className={styles.shelfTitle}>
              <Sparkles size={18} aria-hidden />
              <h3>{pick(locale, 'معرض الصور', 'Photo gallery')}</h3>
              <span>{visible.length}</span>
            </div>
            <p>{pick(locale, 'شبكة واحدة. صفِّ بالمصدر أو بالعنوان، ثم اضغط الصورة للعرض.', 'One grid. Filter by source or title, then tap a photo to view.')}</p>
          </div>
        </header>

        <div className={styles.tools}>
          <div className={styles.search}>
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={pick(locale, 'ابحث في العناوين أو المصادر…', 'Search titles or sources…')}
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label={pick(locale, 'مسح البحث', 'Clear search')}>
                <X size={14} />
              </button>
            ) : null}
          </div>

          {sourceNames.length > 1 ? (
            <div id="photos-sources" className={styles.rail} role="tablist" aria-label={pick(locale, 'تصفية بالمصدر', 'Filter by source')}>
              <button
                type="button"
                className={`${styles.pill}${source === 'ALL' ? ` ${styles.on}` : ''}`}
                onClick={() => setSource('ALL')}
              >
                <span>{pick(locale, 'كل المصادر', 'All sources')}</span>
                <em>{frames.length}</em>
              </button>
              {sourceNames.map((name) => {
                const count = frames.filter((frame) => frame.sourceName === name).length;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`${styles.pill}${source === name ? ` ${styles.on}` : ''}`}
                    onClick={() => setSource(name)}
                  >
                    <span>{name}</span>
                    <em>{count}</em>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className={styles.quiet}>
            <Search size={22} aria-hidden />
            <p>{pick(locale, 'لا إطار يطابق هذا البحث.', 'No print matches this filter.')}</p>
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                setQuery('');
                setSource('ALL');
              }}
            >
              {pick(locale, 'إعادة ضبط', 'Reset')}
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
                  </span>
                  <span className={styles.copy}>
                    <small>{frame.sourceName || pick(locale, 'المصدر', 'Source')}</small>
                    <b dir="auto">{frame.title}</b>
                    {frame.publishedAt ? (
                      <em>
                        <ClientTime
                          value={frame.publishedAt}
                          locale={locale}
                          options={{ day: 'numeric', month: 'short' }}
                        />
                      </em>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

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
                  <strong dir="auto">{current.title}</strong>
                  <div className={styles.theaterActs}>
                    <Link href={`/news/${current.slug}`} className={styles.go}>
                      <span>{pick(locale, 'اقرأ التقرير', 'Read the report')}</span>
                      <ArrowUpRight size={14} />
                    </Link>
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
