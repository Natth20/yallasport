import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontTables } from '@/lib/front/load-tables';
import { pick } from '@/i18n/pick';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-pitch.module.css';

function signedDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export async function HomePitch() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const tables = await loadFrontTables(locale);
  if (tables.length === 0) return null;

  const cols = [
    { key: 'pos', label: pick(locale, 'المركز', 'Pos') },
    { key: 'club', label: pick(locale, 'الفريق', 'Club') },
    { key: 'p', label: t('p') },
    { key: 'w', label: t('w') },
    { key: 'd', label: t('d') },
    { key: 'l', label: t('l') },
    { key: 'gf', label: t('gf') },
    { key: 'ga', label: t('ga') },
    { key: 'gd', label: t('gd') },
    { key: 'pts', label: t('pts') },
  ];

  return (
    <section className={`${shell.band} ${styles.pitch}`}>
      <div className={shell.inner}>
        <FrontMark num="01" title={t('ch03_title')} note={t('ch03_note')} href="/leagues" cta={t('ch03_cta')} />
        <div className={styles.boards}>
          {tables.map((table) => (
            <article key={table.league.id} className={styles.board}>
              <Link href={`/league/${table.league.slug}/standings`} className={styles.boardHead}>
                <LeagueCrest name={table.league.name} logoUrl={table.league.logoUrl} className={styles.crestSm} />
                <strong>{table.league.name}</strong>
                <em>
                  {table.seasonId} · {table.rows.length} {pick(locale, 'فريق', 'clubs')}
                </em>
              </Link>
              <div className={styles.scroll}>
                <table className={styles.table}>
                  <caption className={styles.caption}>
                    {pick(locale, 'جدول الترتيب الكامل', 'Full standings')} {table.league.name}
                  </caption>
                  <thead>
                    <tr>
                      {cols.map((col) => (
                        <th key={col.key} scope="col">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => {
                      const gd = row.goalDiff ?? row.goalsFor - row.goalsAgainst;
                      return (
                        <tr key={row.team.id}>
                          <td className={styles.rank}>{row.rank}</td>
                          <td>
                            <Link href={`/team/${row.team.slug}`} className={styles.club}>
                              <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className={styles.crestSm} />
                              <span>{row.team.name}</span>
                            </Link>
                          </td>
                          <td>{row.played}</td>
                          <td className={styles.win}>{row.won}</td>
                          <td>{row.drawn}</td>
                          <td className={styles.loss}>{row.lost}</td>
                          <td>{row.goalsFor}</td>
                          <td>{row.goalsAgainst}</td>
                          <td className={gd > 0 ? styles.plus : gd < 0 ? styles.minus : undefined}>{signedDiff(gd)}</td>
                          <td className={styles.pts}>{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
