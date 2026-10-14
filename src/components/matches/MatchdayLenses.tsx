'use client';

import { useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './matches-hall.module.css';

export type LensChip = {
  value: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
  logoUrl?: string | null;
};

export function MatchdayLenses({
  locale = 'ar',
  countries = [],
  leagues,
  channels,
  hours,
  clearHref,
}: {
  locale?: string;
  countries?: LensChip[];
  leagues: LensChip[];
  channels: LensChip[];
  hours: LensChip[];
  clearHref: string;
}) {
  const hasActive = countries.some((chip) => chip.active)
    || leagues.some((chip) => chip.active)
    || channels.some((chip) => chip.active)
    || hours.some((chip) => chip.active);

  if (countries.length === 0 && leagues.length < 2 && channels.length === 0 && hours.length < 2 && !hasActive) {
    return null;
  }

  return (
    <div className={styles.lensDeck}>
      <div className={styles.lensDeckHead}>
        <span>{pick(locale, 'عدّسات اليوم', "Today's lenses")}</span>
        {hasActive ? (
          <Link href={clearHref} className={styles.lensClear}>
            {pick(locale, 'مسح العدسات', 'Clear lenses')}
          </Link>
        ) : null}
      </div>
      {countries.length > 0 ? (
        <LensRail label={pick(locale, 'الدولة', 'Country')} chips={countries} locale={locale} />
      ) : null}
      {leagues.length > 0 ? (
        <LensRail label={pick(locale, 'بطولة', 'Competition')} chips={leagues} locale={locale} />
      ) : null}
      {channels.length > 0 ? (
        <LensRail label={pick(locale, 'قناة', 'Channel')} chips={channels} locale={locale} />
      ) : null}
      {hours.length > 0 ? (
        <LensRail label={pick(locale, 'ساعة', 'Hour')} chips={hours} tabular locale={locale} />
      ) : null}
    </div>
  );
}

function LensRail({
  label,
  chips,
  tabular,
  locale = 'ar',
}: {
  label: string;
  chips: LensChip[];
  tabular?: boolean;
  locale?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    if (railRef.current) {
      const step = railRef.current.clientWidth * 0.65 * dir;
      railRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.lensRow}>
      <span className={styles.lensLabel}>{label}</span>
      <div className={styles.lensScrollContainer}>
        {chips.length > 4 ? (
          <button
            type="button"
            className={`${styles.lensArrow} ${styles.lensArrowPrev}`}
            onClick={() => scroll(-1)}
            aria-label={pick(locale, 'السابق', 'Previous')}
          >
            <ChevronRight size={13} />
          </button>
        ) : null}
        <div ref={railRef} className={styles.lensRail}>
          {chips.map((chip) => (
            <Link
              key={chip.value}
              href={chip.href}
              className={`${styles.lensChip} ${chip.active ? styles.lensChipOn : ''}`}
            >
              {chip.logoUrl ? (
                <img src={chip.logoUrl} alt="" className={styles.lensLogo} />
              ) : null}
              <span className={tabular ? styles.lensTabular : undefined}>{chip.label}</span>
              <b>{chip.count}</b>
            </Link>
          ))}
        </div>
        {chips.length > 4 ? (
          <button
            type="button"
            className={`${styles.lensArrow} ${styles.lensArrowNext}`}
            onClick={() => scroll(1)}
            aria-label={pick(locale, 'التالي', 'Next')}
          >
            <ChevronLeft size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
