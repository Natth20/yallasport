import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontBoard } from '@/lib/front/load-board';
import { pick } from '@/i18n/pick';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeResults() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const finished = (await loadFrontBoard(locale)).filter((match) => match.status === 'FINISHED').slice(0, 6);
  if (finished.length === 0) return null;

  return (
    <section className={shell.band}>
      <FrontMark
        num="—"
        title={pick(locale, 'نتائج اليوم', "Today's results")}
        note={pick(locale, 'أهم النتائج المنتهية من المصدر.', 'Finished scores from the source.')}
        href="/matches"
        cta={pick(locale, 'كل النتائج', 'All results')}
      />
      <div className={styles.cards}>
        {finished.map((match) => (
          <Link key={match.id} href={`/match/${match.id}`} className={styles.card}>
            <span className={styles.cardTop}>
              <span>{match.league.name}</span>
              <span>{t('ft_badge')}</span>
            </span>
            <span className={styles.cardRow}>
              <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
              <strong>{match.homeTeam.name}</strong>
              <b className={styles.cardMark}>{match.homeScore ?? '–'}</b>
            </span>
            <span className={styles.cardRow}>
              <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
              <strong>{match.awayTeam.name}</strong>
              <b className={styles.cardMark}>{match.awayScore ?? '–'}</b>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
