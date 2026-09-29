import { getTranslations } from 'next-intl/server';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import styles from './home-salon.module.css';

export async function HomeRibbon() {
  const t = await getTranslations('front');
  const pulse = await loadFrontPulse();
  const meters = [
    { value: pulse.matches, label: t('stat_matches') },
    { value: pulse.live, label: t('stat_live') },
    { value: pulse.goals, label: t('stat_goals') },
    { value: pulse.yellow, label: t('stat_yellow') },
    { value: pulse.red, label: t('stat_red') },
  ].filter((row) => row.value > 0);
  if (meters.length === 0) return null;

  return (
    <ul className={styles.ribbon} aria-label={t('stat_matches')}>
      {meters.map((row) => (
        <li key={row.label}>
          <strong>{row.value}</strong>
          <span>{row.label}</span>
        </li>
      ))}
    </ul>
  );
}
