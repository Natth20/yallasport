import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontTables } from '@/lib/front/load-tables';
import { FrontMark } from '../FrontMark';

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
    <section className="fp-chapter">
      <FrontMark num={t('ch03')} title={t('ch03_title')} note={t('ch03_note')} href="/leagues" cta={t('ch03_cta')} />
      <div className="fp-tables">
        {tables.map((table) => (
          <article key={table.league.id} className="fp-table">
            <Link href={`/league/${table.league.slug}`} className="fp-table-head">
              <LeagueCrest name={table.league.name} logoUrl={table.league.logoUrl} className="h-7 w-7" />
              <strong>{table.league.name}</strong>
              <em>{table.seasonId}</em>
            </Link>
            <ol>
              {table.rows.map((row) => {
                const zone = zoneKey(row.zone);
                const gd = row.goalsFor - row.goalsAgainst;
                return (
                  <li key={row.team.id} className={row.zone ? `is-${row.zone}` : undefined}>
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
