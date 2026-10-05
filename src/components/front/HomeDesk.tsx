import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontBoard } from '@/lib/front/load-board';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import { HomeDayTabs } from './HomeDayTabs';
import styles from './home-salon.module.css';

export async function HomeDesk() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const board = await loadFrontBoard(locale);
  const live = board.filter((match) => isLiveStatus(match.status));

  if (board.length === 0) return null;

  return (
    <div className={styles.desk}>
      <HomeDayTabs
        matches={board}
        locale={locale}
        labels={{
          today: pick(locale, 'اليوم', 'Today'),
          tomorrow: pick(locale, 'غدًا', 'Tomorrow'),
          after: pick(locale, 'بعد غد', 'Day after'),
        }}
        programmeKicker={pick(locale, 'مباريات اليوم', "Today's matches")}
        programmeTitle={t('cta_matches')}
        allLabel={t('ch01_cta')}
        empty={pick(locale, 'لا مواعيد في هذا اليوم من المصدر.', 'No fixtures from the source on this day.')}
        liveLabel={t('live_badge')}
        ftLabel={t('ft_badge')}
      />
      <aside className={styles.rail} aria-label={t('stat_live')}>
        <header className={styles.railHead}>
          <div>
            <p className={styles.liveMark}>
              <i className={styles.dot} aria-hidden />
              {t('live_badge')}
            </p>
            <h3>{t('stat_live')}</h3>
          </div>
          <Link href="/matches" className={styles.more}>
            {t('ch01_cta')}
          </Link>
        </header>
        {live.length === 0 ? (
          <p className={styles.empty}>{pick(locale, 'لا مباريات مباشرة الآن.', 'No live matches right now.')}</p>
        ) : (
          live.slice(0, 10).map((match) => (
            <Link key={match.id} href={`/match/${match.id}`} className={styles.liveItem}>
              <span className={styles.liveCrests}>
                <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
                <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
              </span>
              <span>
                <b>
                  {match.homeTeam.name} — {match.awayTeam.name}
                </b>
                <small>
                  {match.league.name}
                  {match.minute != null ? ` · ${match.minute}′` : ''}
                </small>
              </span>
              <span className={styles.liveScore}>
                {match.homeScore ?? '–'}:{match.awayScore ?? '–'}
              </span>
            </Link>
          ))
        )}
      </aside>
    </div>
  );
}
