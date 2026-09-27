import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { ClientTime } from '@/components/datetime/ClientTime';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import { BrandMark } from '@/components/brand/BrandMark';
import { FrontWhen } from './FrontWhen';
import { MetaLine } from './MetaLine';
import { specialStatusLabel } from './front-labels';
import shell from './front-shell.module.css';
import styles from './stage.module.css';

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
      <div className={shell.inner}>
        {ticker.length > 0 ? (
          <div className={styles.ticker} aria-label={t('ch01_title')}>
            <span className={styles.tickerTag}>{t('stage_kicker')}</span>
            <div className={styles.tickerRail}>
              {ticker.map((match) => {
                const live = isLiveStatus(match.status);
                const finished = match.status === 'FINISHED';
                const special = specialStatusLabel(match.status, locale);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className={`${styles.tick}${live ? ` ${styles.tickLive}` : ''}`}>
                    <span className={styles.tickLine}>
                      {live ? (
                        <span className={styles.liveBadge}>
                          <i className={styles.liveDot} aria-hidden />
                          {match.minute != null ? `${match.minute}′` : t('live_badge')}
                        </span>
                      ) : finished ? (
                        <em>{t('ft_badge')}</em>
                      ) : special ? (
                        <em>{special}</em>
                      ) : null}
                      <b>{match.homeTeam.name}</b>
                      <i>
                        {live || finished ? (
                          `${match.homeScore ?? '—'}–${match.awayScore ?? '—'}`
                        ) : (
                          <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                        )}
                      </i>
                      <b>{match.awayTeam.name}</b>
                    </span>
                    <MetaLine
                      className={shell.meta}
                      parts={[match.league.name, match.league.country]}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.cinema}>
          <div className={styles.lead}>
            <div className={styles.brand}>
              <BrandMark size={48} priority />
              <span>{t('stage_kicker')}</span>
            </div>
            <p className={styles.tagline}>{t('tagline')}</p>
            <MetaLine
              className={`${shell.meta} ${styles.kicker}`}
              parts={[
                lead ? deskLabel(lead.category, locale) : t('kicker'),
                lead?.sourceName || t('source_seal'),
              ]}
            />
            <h1>
              <Link href={href}>{title}</Link>
            </h1>
            {lead ? (
              <p className={shell.meta}>
                <FrontWhen value={lead.publishedAt} />
              </p>
            ) : null}
            {lead?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.leadImg} src={lead.image} alt="" referrerPolicy="no-referrer" />
            ) : null}
            <p className={styles.lede}>{lead?.excerpt || t('standfirst')}</p>
            {chips.length > 0 ? (
              <ul className={styles.chips} aria-label={t('pulse_note')}>
                {chips.map((item) => (
                  <li key={item.label} className={item.live ? styles.chipLive : styles.chip}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <nav className={styles.actions}>
              <Link href={href} className={styles.btnMetal}>
                {t('cta_read')}
              </Link>
              <Link href="/matches" className={styles.btnQuiet}>
                {t('cta_matches')}
              </Link>
              <Link href="/live" className={styles.btnSilver}>
                {t('cta_live')}
              </Link>
            </nav>
          </div>

          {rail.length > 0 ? (
            <aside className={styles.rail} aria-label={t('rail_title')}>
              <h2>{t('rail_title')}</h2>
              <ul>
                {rail.map((story) => (
                  <li key={story.id}>
                    <Link href={`/news/${story.slug}`} className={styles.railLink}>
                      {story.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={story.image} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span className={styles.railFallback}>{story.title.charAt(0)}</span>
                      )}
                      <span>
                        <strong>{story.title}</strong>
                        <MetaLine
                          className={shell.meta}
                          parts={[
                            deskLabel(story.category, locale),
                            story.sourceName,
                            <FrontWhen key={story.id} value={story.publishedAt} />,
                          ]}
                        />
                        {story.excerpt ? <em className={`${shell.meta} ${shell.clamp} ${styles.excerpt}`}>{story.excerpt}</em> : null}
                      </span>
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
