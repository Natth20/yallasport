import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontSquads } from '@/lib/front/load-squads';
import styles from './home-salon.module.css';

export async function HomeLeagues() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { leagues } = await loadFrontSquads(locale);
  if (leagues.length === 0) return null;

  return (
    <section className={styles.wall}>
      <header className={styles.wallHead}>
        <div>
          <p>{t('ch03')}</p>
          <h3>{t('door_leagues')}</h3>
        </div>
        <Link href="/leagues" className={styles.more}>
          {t('ch03_cta')}
        </Link>
      </header>
      <div className={styles.leagues}>
        {leagues.map((league) => (
          <Link key={league.id} href={`/league/${league.slug}`} className={styles.league}>
            <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-10 w-10" />
            <strong>{league.name}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
