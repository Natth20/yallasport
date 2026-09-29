'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
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
  const [active, setActive] = useState(initialFrames[0]?.id || null);
  const easelRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const sourceNames = useMemo(() => {
    const names = new Set<string>();
    for (const frame of frames) {
      if (frame.sourceName) names.add(frame.sourceName);
    }
    return Array.from(names);
  }, [frames]);

  const visible = useMemo(
    () => (source === 'ALL' ? frames : frames.filter((frame) => frame.sourceName === source)),
    [frames, source],
  );
  const shelves = useMemo(() => {
    const buckets = new Map<string, PhotoFrame[]>();
    for (const frame of visible) {
      const key = frame.sourceName || pick(locale, 'بدون مصدر', 'Unsourced');
      const list = buckets.get(key) || [];
      list.push(frame);
      buckets.set(key, list);
    }
    return Array.from(buckets.entries()).map(([name, items]) => ({ name, items }));
  }, [locale, visible]);
  const current = visible.find((frame) => frame.id === active) || visible[0] || frames[0];
  const currentIndex = Math.max(0, visible.findIndex((frame) => frame.id === current?.id));

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
    const node = stripRef.current?.querySelector<HTMLElement>(`[data-frame="${current?.id || ''}"]`);
    node?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current?.id]);

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
      const dir = locale === 'ar' ? -delta : delta;
      const next = visible[(currentIndex + dir + visible.length) % visible.length];
      if (next) setActive(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, locale, theater, visible]);

  if (!current) {
    return (
      <div className={styles.empty}>
        <i aria-hidden />
        <strong>{emptyTitle}</strong>
        <p>{emptyLead}</p>
      </div>
    );
  }

  const print = (
    <CoverImage
      src={current.image}
      srcSet={current.srcSet}
      alt={current.title}
      sizes="100vw"
      priority
      className="object-cover"
    />
  );

  return (
    <div className={styles.hall}>
      <section
        id="photos-cinema"
        ref={easelRef}
        className={styles.cinema}
        aria-live="polite"
        onTouchStart={(event) => {
          touchX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current == null) return;
          const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) < 48) return;
          const rtl = locale === 'ar';
          step(dx > 0 ? (rtl ? 1 : -1) : rtl ? -1 : 1);
        }}
      >
        <div className={styles.stage}>
          <button
            type="button"
            className={styles.print}
            onClick={() => {
              setPaused(true);
              setTheater(true);
            }}
            aria-label={pick(locale, 'افتح الإطار في الصالة', 'Open the print in the salon')}
          >
            <span key={current.id} className={styles.drift}>
              {print}
            </span>
          </button>
          <div className={styles.veil} aria-hidden />
          <div className={styles.corners} aria-hidden />
          <div className={styles.caption}>
            <p>
              <b>{folio(currentIndex)}</b>
              <em>
                {current.sourceName || pick(locale, 'قاعة الصور', 'Photo hall')}
                {current.publishedAt ? (
                  <>
                    {' · '}
                    <ClientTime
                      value={current.publishedAt}
                      locale={locale}
                      options={{ day: 'numeric', month: 'short' }}
                    />
                  </>
                ) : null}
              </em>
            </p>
            <h2 dir="auto">
              <Link href={`/news/${current.slug}`}>{current.title}</Link>
            </h2>
            <div className={styles.acts}>
              <Link href={`/news/${current.slug}`} className={styles.go}>
                {pick(locale, 'افتح التقرير', 'Open the report')}
              </Link>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  setPaused(true);
                  setTheater(true);
                }}
              >
                {pick(locale, 'الصالة', 'Salon')}
              </button>
              {visible.length > 1 ? (
                <button type="button" className={styles.ghost} onClick={() => setPaused((value) => !value)}>
                  {paused ? pick(locale, 'شغّل', 'Play') : pick(locale, 'أوقف', 'Pause')}
                </button>
              ) : null}
            </div>
          </div>
          {visible.length > 1 ? (
            <>
              <button type="button" className={`${styles.step} ${styles.prev}`} onClick={() => step(-1)} aria-label={pick(locale, 'السابق', 'Previous')}>
                ‹
              </button>
              <button type="button" className={`${styles.step} ${styles.next}`} onClick={() => step(1)} aria-label={pick(locale, 'التالي', 'Next')}>
                ›
              </button>
            </>
          ) : null}
          <span key={`${current.id}-${paused}-${theater}`} className={`${styles.meter}${paused || theater ? ` ${styles.held}` : ''}`} aria-hidden />
        </div>

        {visible.length > 1 ? (
          <div className={styles.film} ref={stripRef} role="list">
            {visible.map((frame, index) => (
              <button
                key={frame.id}
                type="button"
                data-frame={frame.id}
                role="listitem"
                className={frame.id === current.id ? styles.on : undefined}
                onClick={() => show(frame.id)}
                aria-label={frame.title}
              >
                <CoverImage src={frame.image} srcSet={frame.srcSet} alt="" sizes="140px" className="object-cover" />
                <em>{folio(index)}</em>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className={styles.band}>
        <div>
          <p>{pick(locale, 'جدار القاعة', 'The wall')}</p>
          <h3 id="photos-wall">{pick(locale, 'مرتّبة حسب المصدر', 'Ordered by source')}</h3>
        </div>
        <dl>
          <div>
            <dt>{pick(locale, 'إطارات', 'Frames')}</dt>
            <dd>{frames.length}</dd>
          </div>
          <div>
            <dt>{pick(locale, 'مصادر', 'Sources')}</dt>
            <dd>{sourceNames.length}</dd>
          </div>
          <div>
            <dt>{pick(locale, 'المعروض', 'On view')}</dt>
            <dd>
              {folio(currentIndex)} / {folio(Math.max(0, visible.length - 1))}
            </dd>
          </div>
        </dl>
      </div>

      {sourceNames.length > 1 ? (
        <div id="photos-sources" className={styles.rail} role="tablist" aria-label={pick(locale, 'المصادر', 'Sources')}>
          <button type="button" className={source === 'ALL' ? styles.on : undefined} onClick={() => setSource('ALL')}>
            {pick(locale, 'كل المصادر', 'All sources')}
          </button>
          {sourceNames.map((name) => (
            <button
              key={name}
              type="button"
              className={source === name ? styles.on : undefined}
              onClick={() => setSource(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className={styles.quiet}>{pick(locale, 'ما في إطار من هالمصدر.', 'No print from this source.')}</p>
      ) : (
        <div className={styles.shelves}>
          {shelves.map((shelf) => (
            <section key={shelf.name} className={styles.shelf}>
              <header>
                <h4>{shelf.name}</h4>
                <em>{shelf.items.length}</em>
              </header>
              <Stagger className={styles.wall} delay={0.02}>
                {shelf.items.map((frame) => {
                  const index = visible.findIndex((item) => item.id === frame.id);
                  return (
                    <StaggerItem key={frame.id} className={styles.cell}>
                      <button
                        type="button"
                        onClick={() => {
                          show(frame.id);
                          setPaused(true);
                          setTheater(true);
                        }}
                        className={`${styles.tile}${frame.id === current.id ? ` ${styles.on}` : ''}`}
                      >
                        <span className={styles.tilePrint}>
                          <CoverImage
                            src={frame.image}
                            srcSet={frame.srcSet}
                            alt={frame.title}
                            sizes="(max-width: 720px) 50vw, 25vw"
                            priority={index < 8}
                            className="object-cover"
                          />
                        </span>
                        <span className={styles.tileMeta}>
                          <em>{folio(index)}</em>
                          <strong dir="auto">{frame.title}</strong>
                        </span>
                      </button>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </section>
          ))}
        </div>
      )}

      {theater
        ? createPortal(
          <div className={styles.theater} role="dialog" aria-modal="true" aria-label={current.title}>
            <button type="button" className={styles.scrim} onClick={() => setTheater(false)} aria-label={pick(locale, 'إغلاق', 'Close')} />
            <figure>
              <div className={styles.theaterStage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={current.id}
                  src={current.image}
                  srcSet={current.srcSet}
                  sizes="min(1100px, 96vw)"
                  alt={current.title}
                  referrerPolicy="no-referrer"
                />
                {visible.length > 1 ? (
                  <>
                    <button type="button" className={`${styles.step} ${styles.prev}`} onClick={() => step(-1)} aria-label={pick(locale, 'السابق', 'Previous')}>
                      ‹
                    </button>
                    <button type="button" className={`${styles.step} ${styles.next}`} onClick={() => step(1)} aria-label={pick(locale, 'التالي', 'Next')}>
                      ›
                    </button>
                  </>
                ) : null}
              </div>
              <figcaption>
                <em>
                  {current.sourceName || pick(locale, 'قاعة الصور', 'Photo hall')}
                  {current.publishedAt ? (
                    <>
                      {' · '}
                      <ClientTime value={current.publishedAt} locale={locale} options={{ day: 'numeric', month: 'long' }} />
                    </>
                  ) : null}
                </em>
                <strong dir="auto">{current.title}</strong>
                <span>
                  <Link href={`/news/${current.slug}`}>{pick(locale, 'اقرأ التقرير', 'Read the report')}</Link>
                  <button type="button" onClick={() => setTheater(false)}>
                    {pick(locale, 'أغلق', 'Close')}
                  </button>
                </span>
              </figcaption>
            </figure>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}
