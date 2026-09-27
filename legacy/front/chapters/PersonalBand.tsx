import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontPersonal } from '@/lib/front/load-personal';
import { FrontMark } from '../FrontMark';
import styles from '../front-hall.module.css';

export async function PersonalBand() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { loggedIn, items } = await loadFrontPersonal(locale);
  if (!loggedIn) {
    return (
      <section className={styles.chapter}>
        <FrontMark num={t('ch11')} title={t('ch11_title')} note={t('ch11_login')} href="/login" cta={t('ch11_cta')} />
      </section>
    );
  }
  if (items.length === 0) return null;
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch11')} title={t('ch11_title')} href="/favorites" cta={t('ch11_all')} />
      <ul className={styles.crestGrid}>
        {items.map((item) => {
          const href = item.kind === 'TEAM' ? `/team/${item.slug}` : item.kind === 'LEAGUE' ? `/league/${item.slug}` : `/player/${item.slug}`;
          return (
            <li key={`${item.kind}-${item.slug}`}>
              <Link href={href}>
                <LeagueCrest name={item.name} logoUrl={item.logoUrl} className="h-8 w-8" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

