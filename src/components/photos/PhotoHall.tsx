'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
import './photo-hall.css';

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

function accession(index: number) {
  return `YS-${String(index + 1).padStart(3, '0')}`;
}

export function PhotoHall({
  locale,
  frames,
  emptyTitle,
  emptyLead,
}: {
  locale: string;
  frames: PhotoFrame[];
  emptyTitle: string;
  emptyLead: string;
}) {
  const ids = useMemo(() => frames.map((frame) => frame.id), [frames]);
  const [active, setActive] = useState(ids[0] || null);
  const easelRef = useRef<HTMLElement>(null);
  const current = frames.find((frame) => frame.id === active) || frames[0];
  const sources = useMemo(() => new Set(frames.map((frame) => frame.sourceName).filter(Boolean)).size, [frames]);
  const currentIndex = Math.max(0, frames.findIndex((frame) => frame.id === current?.id));

  function show(id: string) {
    setActive(id);
    easelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function step(delta: number) {
    if (!frames.length) return;
    const next = frames[(currentIndex + delta + frames.length) % frames.length];
    show(next.id);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      const dir = locale === 'ar' ? -delta : delta;
      const next = frames[(currentIndex + dir + frames.length) % frames.length];
      if (!next) return;
      setActive(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, frames, locale]);

  if (!current) {
    return (
      <div className="ph-empty">
        <span className="ph-empty-mark" aria-hidden />
        <strong>{emptyTitle}</strong>
        <p>{emptyLead}</p>
      </div>
    );
  }

  return (
    <div className="ph-hall">
      <section ref={easelRef} className="ph-easel" aria-live="polite">
        <div className="ph-stage">
          <div className="ph-print-wrap">
            <Link href={`/news/${current.slug}`} className="ph-print" aria-label={current.title}>
              <CoverImage
                src={current.image}
                srcSet={current.srcSet}
                alt={current.title}
                sizes="(max-width: 860px) 100vw, 62vw"
                priority
                className="object-cover"
              />
            </Link>
            <button type="button" className="ph-step is-prev" onClick={() => step(-1)} aria-label={pick(locale, 'الإطار السابق', 'Previous print')}>
              ‹
            </button>
            <button type="button" className="ph-step is-next" onClick={() => step(1)} aria-label={pick(locale, 'الإطار التالي', 'Next print')}>
              ›
            </button>
          </div>
          <div className="ph-plaque">
            <div className="ph-plaque-top">
              <span className="ph-folio">{accession(currentIndex)}</span>
              <em>
                {current.sourceName || pick(locale, 'قاعة الصور', 'Photo hall')}
                {' · '}
                <ClientTime
                  value={current.publishedAt}
                  locale={locale}
                  options={{ day: 'numeric', month: 'short' }}
                />
              </em>
            </div>
            <h2 dir="auto">
              <Link href={`/news/${current.slug}`}>{current.title}</Link>
            </h2>
            <Link href={`/news/${current.slug}`} className="ph-open">
              {pick(locale, 'اقرأ التقرير كامل', 'Read the full report')}
            </Link>
          </div>
        </div>
      </section>

      <div className="ph-band">
        <div>
          <h3>{pick(locale, 'جدار القاعة', 'The wall')}</h3>
          <p>{pick(locale, 'اضغط أي صورة لفتح التقرير كامل.', 'Tap any print to open the full report.')}</p>
        </div>
        <dl className="ph-brief">
          <div>
            <dt>{pick(locale, 'إطارات', 'Frames')}</dt>
            <dd>{frames.length}</dd>
          </div>
          <div>
            <dt>{pick(locale, 'مصادر', 'Sources')}</dt>
            <dd>{sources}</dd>
          </div>
          <div>
            <dt>{pick(locale, 'المعروض', 'On easel')}</dt>
            <dd>
              {folio(currentIndex)} / {folio(frames.length - 1)}
            </dd>
          </div>
        </dl>
      </div>

      <Stagger className="ph-wall" delay={0.03}>
        {frames.map((frame, index) => (
          <StaggerItem key={frame.id} className="ph-cell">
            <Link
              href={`/news/${frame.slug}`}
              className={`ph-frame${frame.id === current.id ? ' is-on' : ''}`}
            >
              <div className="ph-print">
                <CoverImage
                  src={frame.image}
                  srcSet={frame.srcSet}
                  alt={frame.title}
                  sizes="(max-width: 560px) 100vw, (max-width: 980px) 50vw, 33vw"
                  priority={index < 6}
                  className="object-cover"
                />
              </div>
              <div className="ph-plaque">
                <span className="ph-folio">{accession(index)}</span>
                <strong dir="auto">{frame.title}</strong>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
