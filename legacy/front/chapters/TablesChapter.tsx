import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontTables } from '@/lib/front/load-tables';
import { FrontMark } from '../FrontMark';
import styles from '../front-hall.module.css';

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
    <section className={styles.chapter}>
      <FrontMark num={t('ch03')} title={t('ch03_title')} note={t('ch03_note')} href="/leagues" cta={t('ch03_cta')} />
      <div className={styles.tables}>
        {tables.map((table) => (
          <article key={table.league.id} className={styles.table}>
            <Link href={`/league/${table.league.slug}`} className={styles.tableHead}>
              <LeagueCrest name={table.league.name} logoUrl={table.league.logoUrl} className="h-7 w-7" />
              <strong>{table.league.name}</strong>
              <em>{table.seasonId}</em>
            </Link>
            <ol>
              {table.rows.map((row) => {
                const zone = zoneKey(row.zone);
                const gd = row.goalsFor - row.goalsAgainst;
                const zoneClass = row.zone && ZONE_CLASS_MAP[row.zone] ? styles[ZONE_CLASS_MAP[row.zone] as keyof typeof styles] : undefined;
                return (
                  <li key={row.team.id} className={zoneClass}>
                    <Link href={`/team/${row.team.slug}`}>
                      <b>{row.rank}</b>
                      <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-5 w-5" />
                      <span>{row.team.name}</span>
                      <i>
                        {row.points} {t('pts')}
                      </i>
                    </Link>
                    <em>
                      {row.played} {t('p')} · {row.won}{t('w')} {row.drawn}{t('d')} {row.lost}{t('l')} · {row.goalsFor}:{row.goalsAgainst} · {gd > 0 ? '+' : ''}{gd} {t('gd')}
                      {zone ? ` · ${t(zone)}` : ''}
                    </em>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
