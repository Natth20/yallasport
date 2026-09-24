import { getTranslations } from 'next-intl/server';
import { loadFrontPulse } from '@/lib/front/load-pulse';

export async function FrontPulse() {
  const t = await getTranslations('front');
  const pulse = await loadFrontPulse();
  const items = [
    pulse.matches > 0 ? { label: t('stat_matches'), value: pulse.matches } : null,
    pulse.live > 0 ? { label: t('stat_live'), value: pulse.live } : null,
    pulse.goals > 0 ? { label: t('stat_goals'), value: pulse.goals } : null,
    pulse.yellow > 0 ? { label: t('stat_yellow'), value: pulse.yellow } : null,
    pulse.red > 0 ? { label: t('stat_red'), value: pulse.red } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;
  if (items.length === 0) return null;
  return (
    <section className="fp-pulse" aria-label={t('pulse_note')}>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <p>{t('pulse_note')}</p>
    </section>
  );
}
