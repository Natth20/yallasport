import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { ClientTime } from '@/components/datetime/ClientTime';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import { BrandMark } from '@/components/brand/BrandMark';
import styles from './front-hall.module.css';

export async function FrontStage() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [{ lead, rest }, board, pulse] = await Promise.all([
    loadFrontStories(locale),
    loadFrontBoard(locale),
    loadFrontPulse(),
  ]);

  const ticker = board.slice(0, 16);
  const rail = rest.slice(0, 5);
  const chips = [
    pulse.live > 0 ? { label: t('stat_live'), value: pulse.live, live: true } : null,
    pulse.matches > 0 ? { label: t('stat_matches'), value: pulse.matches, live: false } : null,
    pulse.goals > 0 ? { label: t('stat_goals'), value: pulse.goals, live: false } : null,
    pulse.yellow > 0 ? { label: t('stat_yellow'), value: pulse.yellow, live: false } : null,
    pulse.red > 0 ? { label: t('stat_red'), value: pulse.red, live: false } : null,
  ].filter(Boolean) as Array<{ label: string; value: number; live: boolean }>;

  const title = lead?.title || t('headline');
  const href = lead ? `/news/${lead.slug}` : '/news';

  return (
    <section className={styles.stage}>
      <div className={styles.stageMedia} aria-hidden>
        {lead?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lead.image} alt="" referrerPolicy="no-referrer" />
        ) : null}
        <span className={styles.auroraA} />
        <span className={styles.auroraB} />
        <span className={styles.pitch} />
      </div>

      <div className={styles.stageShell}>
        {ticker.length > 0 ? (
          <div className={styles.ticker} aria-label={t('ch01_title')}>
            <span className={styles.tickerTag}>{t('stage_kicker')}</span>
            <div className={styles.tickerRail}>
              {ticker.map((match) => {
                const live = isLiveStatus(match.status);
                const finished = match.status === 'FINISHED';
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className={`${styles.tick}${live ? ` ${styles.tickLive}` : ''}`}>
                    <em>{live ? `${match.minute ?? ''}′` : finished ? t('ft_badge') : ''}</em>
                    <b>{match.homeTeam.name}</b>
                    <i>
                      {live || finished ? (
                        `${match.homeScore ?? '—'}–${match.awayScore ?? '—'}`
                      ) : (
                        <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                      )}
                    </i>
                    <b>{match.awayTeam.name}</b>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.cinema}>
          <div className={styles.cinemaMain}>
            <div className={styles.stageBrand}>
              <BrandMark size={48} priority />
              <span>{t('stage_kicker')}</span>
            </div>
            <p className={styles.tagline}>{t('tagline')}</p>
            <p className={styles.stageMeta}>
              {lead ? <em>{deskLabel(lead.category, locale)}</em> : <em>{t('kicker')}</em>}
              {lead?.sourceName ? <b>{lead.sourceName}</b> : <b>{t('source_seal')}</b>}
            </p>
            <h1>
              <Link href={href}>{title}</Link>
            </h1>
            <p className={styles.stageLede}>{lead?.excerpt || t('standfirst')}</p>
            {chips.length > 0 ? (
              <ul className={styles.pulseChips} aria-label={t('pulse_note')}>
                {chips.map((item) => (
                  <li key={item.label} className={item.live ? styles.chipLive : undefined}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <nav className={styles.heroCta}>
              <Link href={href} className={styles.btnSolid}>
                {t('cta_read')}
              </Link>
              <Link href="/matches" className={styles.btn}>
                {t('cta_matches')}
              </Link>
              <Link href="/live" className={styles.btn}>
                {t('cta_live')}
              </Link>
            </nav>
          </div>

          {rail.length > 0 ? (
            <aside className={styles.cinemaRail} aria-label={t('rail_title')}>
              <p>{t('rail_title')}</p>
              <ul>
                {rail.map((story) => (
                  <li key={story.id}>
                    <Link href={`/news/${story.slug}`}>
                      {story.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={story.image} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{story.title.charAt(0)}</span>
                      )}
                      <strong>{story.title}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
