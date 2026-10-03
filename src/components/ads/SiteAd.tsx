import { headers } from 'next/headers';
import { getActiveAd } from '@/lib/ads/load';
import type { AdPlacementId } from '@/lib/ads/catalog';
import { AdCreative } from '@/components/ads/AdCreative';
import { pick } from '@/i18n/pick';
import styles from './site-ad.module.css';

export async function SiteAd({
  placement,
  locale,
}: {
  placement: AdPlacementId;
  locale: string;
}) {
  const page = (await headers()).get('x-ys-page') || '';
  if (page.startsWith('/admin')) return null;

  const slot = await getActiveAd(placement);
  if (!slot) return null;

  return (
    <aside className={styles.rail} aria-label={pick(locale, 'إعلان', 'Advertisement')}>
      <div className={styles.unit}>
        <span className={styles.kicker}>{pick(locale, 'إعلان', 'Advertisement')}</span>
        <AdCreative slot={slot} locale={locale} />
      </div>
    </aside>
  );
}
