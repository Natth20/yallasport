import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontTables } from '@/lib/front/load-tables';
import { FrontMark } from '../FrontMark';
import { MetaLine } from '../MetaLine';
import shell from '../front-shell.module.css';
import styles from '../tables.module.css';

const ZONE_CLASS_MAP: Record<string, string> = {
  cl: 'zoneCl',
  direct: 'zoneDirect',
  el: 'zoneEl',
  playoff: 'zonePlayoff',
  rel: 'zoneRel',
  out: 'zoneOut',
};

function zoneKey(zone: string | null) {
  if (!zone) return null;
  if (zone === 'cl' || zone === 'el' || zone === 'rel' || zone === 'direct' || zone === 'playoff' || zone === 'out') {
    return `zone_${zone}` as const;
  }
  return null;
}

export async function TablesChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const tables = await loadFrontTables(locale);
  if (tables.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch03')} title={t('ch03_title')} note={t('ch03_note')} href="/leagues" cta={t('ch03_cta')} />
        <div className={styles.grid}>
          {tables.map((table) => (
            <article key={table.league.id} className={styles.table}>
              <Link href={`/league/${table.league.slug}`} className={styles.head}>
                <LeagueCrest name={table.league.name} logoUrl={table.league.logoUrl} className="h-7 w-7" />
                <span>
                  <strong>{table.league.name}</strong>
                  <MetaLine className={shell.meta} parts={[table.league.country, table.seasonId]} />
                </span>
              </Link>
              <ol className={styles.rows}>
                {table.rows.map((row) => {
                  const zone = zoneKey(row.zone);
                  const gd = row.goalsFor - row.goalsAgainst;
                  const zoneClass = row.zone && ZONE_CLASS_MAP[row.zone] ? styles[ZONE_CLASS_MAP[row.zone] as keyof typeof styles] : undefined;
                  return (
                    <li key={row.team.id} className={zoneClass}>
                      <Link href={`/team/${row.team.slug}`}>
                        <b className={styles.rank}>{row.rank}</b>
                        <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-5 w-5" />
                        <span className={styles.name}>{row.team.name}</span>
                        <i className={styles.pts}>
                          {row.points} {t('pts')}
                        </i>
                      </Link>
                      <em className={`${shell.meta} ${styles.line}`}>
                        {row.played} {t('p')}
                        <span aria-hidden="true"> · </span>
                        <span className={styles.up}>{row.won}{t('w')}</span>
                        {` ${row.drawn}${t('d')} ${row.lost}${t('l')}`}
                        <span aria-hidden="true"> · </span>
                        {row.goalsFor}:{row.goalsAgainst}
                        <span aria-hidden="true"> · </span>
                        <span className={gd > 0 ? styles.up : gd < 0 ? styles.down : undefined}>
                          {gd > 0 ? '+' : ''}{gd} {t('gd')}
                        </span>
                        {zone ? <span> · {t(zone)}</span> : null}
                      </em>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
