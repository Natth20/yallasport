import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontTables } from '@/lib/front/load-tables';
import { rotateStart } from '@/lib/front/rotate-shelf';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-pitch.module.css';

export async function HomePitch() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const tables = await loadFrontTables(locale);
  const boards = rotateStart(tables, 2).slice(0, 8);
  if (boards.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.pitch}`}>
      <div className={shell.inner}>
        <FrontMark num="01" title={t('ch03_title')} note={t('ch03_note')} href="/leagues" cta={t('ch03_cta')} />
        <div className={styles.boards}>
          {boards.map((table) => (
            <article key={table.league.id}>
              <Link href={`/league/${table.league.slug}`} className={styles.boardHead}>
                <LeagueCrest name={table.league.name} logoUrl={table.league.logoUrl} className={styles.crestSm} />
                <strong>{table.league.name}</strong>
              </Link>
              <ol>
                {table.rows.slice(0, 7).map((row) => (
                  <li key={row.team.id}>
                    <Link href={`/team/${row.team.slug}`}>
                      <b>{row.rank}</b>
                      <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className={styles.crestSm} />
                      <span>{row.team.name}</span>
                      <em>{row.played}</em>
                      <i>
                        {row.points} {t('pts')}
                      </i>
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
