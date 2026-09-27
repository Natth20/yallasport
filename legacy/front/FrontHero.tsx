import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { FrontMatchTile } from './FrontMatchTile';
import styles from './front-hall.module.css';

export async function FrontHero() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [{ lead }, board] = await Promise.all([loadFrontStories(locale), loadFrontBoard(locale)]);
  const rail = board.slice(0, 3);

  return (
    <div className={`${styles.inner} ${styles.heroQuiet}`}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{t('kicker')}</p>
        {!lead?.image ? <h1>{t('headline')}</h1> : null}
        <nav className={styles.heroCta}>
          <Link href="/matches" className={styles.btnSolid}>
            {t('cta_matches')}
          </Link>
          <Link href="/live" className={styles.btn}>
            {t('cta_live')}
          </Link>
          <Link href="/news" className={styles.btn}>
            {t('cta_news')}
          </Link>
        </nav>
      </div>
      {rail.length > 0 ? (
        <div className={styles.heroRail}>
          {rail.map((match) => (
            <FrontMatchTile
              key={match.id}
              match={match}
              liveLabel={t('live_badge')}
              ftLabel={t('ft_badge')}
              vsLabel={t('vs')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
