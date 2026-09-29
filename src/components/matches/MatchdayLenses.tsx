import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import styles from './matches-hall.module.css';

export type LensChip = {
  value: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
  logoUrl?: string | null;
};

export async function MatchdayLenses({
  leagues,
  channels,
  hours,
  clearHref,
}: {
  leagues: LensChip[];
  channels: LensChip[];
  hours: LensChip[];
  clearHref: string;
}) {
  const locale = await getLocale();
  const hasActive = leagues.some((chip) => chip.active)
    || channels.some((chip) => chip.active)
    || hours.some((chip) => chip.active);

  if (leagues.length < 2 && channels.length === 0 && hours.length < 2 && !hasActive) {
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
      {leagues.length > 0 ? (
        <LensRail label={pick(locale, 'بطولة', 'Competition')} chips={leagues} />
      ) : null}
      {channels.length > 0 ? (
        <LensRail label={pick(locale, 'قناة', 'Channel')} chips={channels} />
      ) : null}
      {hours.length > 0 ? (
        <LensRail label={pick(locale, 'ساعة', 'Hour')} chips={hours} tabular />
      ) : null}
    </div>
  );
}

function LensRail({
  label,
  chips,
  tabular,
}: {
  label: string;
  chips: LensChip[];
  tabular?: boolean;
}) {
  return (
    <div className={styles.lensRow}>
      <span className={styles.lensLabel}>{label}</span>
      <div className={styles.lensRail}>
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
    </div>
  );
}
