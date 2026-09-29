import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { loadFrontFacts } from '@/lib/front/load-facts';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeFacts() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { next, loud, podium, move, hours, census } = await loadFrontFacts(locale);
  if (!next && !loud && podium.length === 0 && !move && hours.length === 0) return null;

  const peak = Math.max(...hours.map((slot) => slot.count), 1);
  const glance = [
    { value: census.live, label: t('stat_live') },
    { value: census.remaining, label: pick(locale, 'لم تُلعب', 'Still to play') },
    { value: census.finished, label: pick(locale, 'انتهت', 'Finished') },
  ].filter((row) => row.value > 0);

  return (
    <section className={`${shell.band} ${styles.factsBand}`}>
      <div className={shell.inner}>
        <FrontMark
          num="●"
          title={pick(locale, 'دفتر اليوم', "Today's ledger")}
          note={pick(
            locale,
            'ختم اليوم، أقرب صافرة، أغزر نتيجة رسمية، المنصة، وأحدث انتقال — كما سجّلها المصدر.',
            "Today's seal, next kickoff, the loudest official scoreline, the podium, and the latest move — as stored.",
          )}
          href="/stats"
          cta={t('ch04_cta')}
        />

        {glance.length > 0 ? (
          <ul className={styles.factsGlance}>
            {glance.map((row) => (
              <li key={row.label}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.facts}>
          {next ? (
            <Link href={`/match/${next.id}`} className={`${styles.fact} ${styles.factNext}`}>
              <p>{pick(locale, 'أقرب صافرة', 'Next kickoff')}</p>
              <b className={styles.factClock}>
                <ClientTime value={next.kickoffAt} locale={locale} variant="clock" />
              </b>
              <span className={styles.factDuel}>
                <LeagueCrest name={next.homeTeam.name} logoUrl={next.homeTeam.logoUrl} className="h-12 w-12" />
                <strong>
                  {next.homeTeam.name}
                  <i> — </i>
                  {next.awayTeam.name}
                </strong>
                <LeagueCrest name={next.awayTeam.name} logoUrl={next.awayTeam.logoUrl} className="h-12 w-12" />
              </span>
              <small>
                {[next.league.name, next.venue, next.city].filter(Boolean).join(' · ')}
              </small>
            </Link>
          ) : null}

          {loud ? (
            <Link href={`/match/${loud.id}`} className={`${styles.fact} ${styles.factLoud}`}>
              <p>
                {isLiveStatus(loud.status)
                  ? t('live_badge')
                  : pick(locale, 'أغزر نتيجة اليوم', "Today's loudest")}
              </p>
              <b className={styles.factScore} dir="ltr">
                {loud.homeScore ?? 0}
                <i>:</i>
                {loud.awayScore ?? 0}
              </b>
              <strong>
                {loud.homeTeam.name} — {loud.awayTeam.name}
              </strong>
              <small>
                {loud.goals} {t('stat_goals')}
                {loud.league.name ? ` · ${loud.league.name}` : ''}
              </small>
            </Link>
          ) : null}

          {hours.length > 0 ? (
            <div className={`${styles.fact} ${styles.factHours}`}>
              <p>{pick(locale, 'إيقاع الركلات', 'Kickoff rhythm')}</p>
              <ol>
                {hours.map((slot) => (
                  <li key={slot.hour}>
                    <em>{String(slot.hour).padStart(2, '0')}</em>
                    <span aria-hidden>
                      <i style={{ height: `${Math.max(18, (slot.count / peak) * 100)}%` }} />
                    </span>
                    <b>{slot.count}</b>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        {podium.length > 0 ? (
          <ol className={styles.podium}>
            {podium.map((row, index) => {
              const place = index + 1;
              const body = (
                <>
                  <em>{String(place).padStart(2, '0')}</em>
                  {row.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.photoUrl} alt="" />
                  ) : (
                    <span aria-hidden>{row.name.charAt(0)}</span>
                  )}
                  <strong>{row.name}</strong>
                  <b>
                    {row.value} {t('ch04_goals')}
                  </b>
                </>
              );
              return (
                <li key={`${row.slug || row.name}-${place}`} className={place === 1 ? styles.podiumLead : undefined}>
                  {row.slug ? <Link href={`/player/${row.slug}`}>{body}</Link> : <div>{body}</div>}
                </li>
              );
            })}
          </ol>
        ) : null}

        {move ? (
          <Link href={`/player/${move.playerSlug}`} className={styles.move}>
            {move.playerPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={move.playerPhoto} alt="" className={styles.moveFace} />
            ) : (
              <span className={styles.moveFace} aria-hidden>
                {move.playerName.charAt(0)}
              </span>
            )}
            <span className={styles.moveCopy}>
              <p>{t('ch06_title')}</p>
              <strong>{move.playerName}</strong>
              <small>
                {[move.fromTeam, move.toTeam].filter(Boolean).join(locale === 'ar' ? ' ← ' : ' → ')}
                {move.fee ? ` · ${move.fee}` : ''}
              </small>
            </span>
            <span className={styles.moveCrests} aria-hidden>
              {move.fromLogo ? <img src={move.fromLogo} alt="" /> : <i />}
              {move.toLogo ? <img src={move.toLogo} alt="" /> : <i />}
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
