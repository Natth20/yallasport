import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { loadFrontBoard } from '@/lib/front/load-board';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import { FrontMark } from './FrontMark';
import { specialStatusLabel } from './front-labels';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeExhibit() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const board = await loadFrontBoard(locale);
  const friendlies = board.filter((match) => isFriendlyLeague(match.league));
  if (friendlies.length === 0) return null;
  const solo = friendlies.length === 1;

  return (
    <section className={`${shell.band} ${styles.exhibit}`}>
      <div className={shell.inner}>
        <FrontMark
          num="◇"
          title={pick(locale, 'المباريات الودية', 'Friendlies')}
          note={pick(
            locale,
            'لقاءات ودية كما وصلت من المصدر — ليست بطولة رسمية.',
            'Friendlies as stored — not an official competition.',
          )}
        />
        <ul className={`${styles.exhibitList}${solo ? ` ${styles.exhibitListSolo}` : ''}`}>
          {friendlies.slice(0, 6).map((match) => {
            const live = isLiveStatus(match.status);
            const finished = match.status === 'FINISHED';
            const special = specialStatusLabel(match.status, locale);
            const score =
              live || finished
                ? `${match.homeScore ?? '–'} : ${match.awayScore ?? '–'}`
                : '×';
            return (
              <li key={match.id}>
                <Link href={`/match/${match.id}`} className={styles.exhibitCard}>
                  <span className={styles.exhibitCorner} aria-hidden />
                  <span className={styles.exhibitLedger}>
                    <i className={styles.exhibitWax} aria-hidden />
                    <b>{pick(locale, 'ودية', 'Friendly')}</b>
                    <p>
                      {pick(
                        locale,
                        'ليست نقاطاً في جدول. لقاء ودي — النتيجة كما سجّلها المصدر.',
                        'No table points. A friendly — the score as stored.',
                      )}
                    </p>
                  </span>
                  <span className={styles.exhibitFace}>
                    <span className={styles.exhibitSeal}>{pick(locale, 'لقاء ودي', 'Friendly')}</span>
                    <span className={styles.exhibitDuel}>
                      <span>
                        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className={styles.exhibitCrest} />
                        <strong>{match.homeTeam.name}</strong>
                      </span>
                      <em className={`${styles.exhibitVs}${live ? ` ${styles.exhibitVsLive}` : ''}`} dir="ltr">
                        {score}
                      </em>
                      <span>
                        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className={styles.exhibitCrest} />
                        <strong>{match.awayTeam.name}</strong>
                      </span>
                    </span>
                    <small>
                      {live
                        ? `${t('live_badge')}${match.minute != null ? ` · ${match.minute}′` : ''}`
                        : finished
                          ? t('ft_badge')
                          : special || <ClientTime value={match.kickoffAt} locale={locale} variant="clock" />}
                    </small>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
