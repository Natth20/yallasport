import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontBoard } from '@/lib/front/load-board';
import { rotateTake } from '@/lib/front/rotate-shelf';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import { pick } from '@/i18n/pick';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeWhistle() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const board = await loadFrontBoard(locale);
  const finished = board.filter(
    (match) => match.status === 'FINISHED' && !isFriendlyLeague(match.league),
  );
  const shown = rotateTake(finished, 6, 9);
  if (shown.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.whistle}`}>
      <div className={shell.inner}>
        <FrontMark
          num="—"
          title={pick(locale, 'صافرة النهاية', 'Full time')}
          note={pick(
            locale,
            'نتائج رسمية انتهت كما خزّنها المصدر — الرف يتبدّل من نفس الدفتر.',
            'Official finished scores as stored — the shelf rotates from the same ledger.',
          )}
          href="/matches"
          cta={t('ch01_cta')}
        />
        <ul className={styles.whistleList}>
          {shown.map((match) => (
            <li key={match.id}>
              <Link href={`/match/${match.id}`}>
                <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className={styles.whistleCrest} />
                <span>
                  <strong>
                    {match.homeTeam.name}
                    <em dir="ltr">
                      {match.homeScore ?? '–'} : {match.awayScore ?? '–'}
                    </em>
                    {match.awayTeam.name}
                  </strong>
                  <small>{match.league.name}</small>
                </span>
                <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className={styles.whistleCrest} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
