import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import { BrandMark } from '@/components/brand/BrandMark';
import { FrontMatchTile } from './FrontMatchTile';
import type { FrontMatch } from '@/lib/front/types';
import styles from './front-hall.module.css';

function Spotlight({
  match,
  label,
  liveLabel,
  ftLabel,
  vsLabel,
  previewLabel,
}: {
  match: FrontMatch;
  label: string;
  liveLabel: string;
  ftLabel: string;
  vsLabel: string;
  previewLabel: string;
}) {
  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  const showScore = live || finished;
  return (
    <Link href={`/match/${match.id}`} className={`${styles.spot}${live ? ` ${styles.spotLive}` : ''}`}>
      <span className={styles.spotTop}>
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        {match.league.name}
        <em className={styles.spotTag}>
          {live ? (
            <>
              <i className={styles.liveDot} aria-hidden />
              {liveLabel}
              {match.minute ? ` ${match.minute}′` : ''}
            </>
          ) : finished ? (
            ftLabel
          ) : (
            label
          )}
        </em>
      </span>
      <span className={styles.spotDuel}>
        <span className={styles.spotTeam}>
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-14 w-14" />
          <strong>{match.homeTeam.name}</strong>
        </span>
        <span className={styles.spotMid}>
          {showScore ? (
            <b className={styles.spotScore}>
              {match.homeScore ?? 0}
              <i>–</i>
              {match.awayScore ?? 0}
            </b>
          ) : (
            <>
              <b className={styles.spotVs}>{vsLabel}</b>
              <ClientTime
                className={styles.spotTime}
                value={match.kickoffAt}
                options={{ hour: '2-digit', minute: '2-digit' }}
              />
            </>
          )}
        </span>
        <span className={styles.spotTeam}>
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-14 w-14" />
          <strong>{match.awayTeam.name}</strong>
        </span>
      </span>
      <span className={styles.spotCta}>{previewLabel}</span>
    </Link>
  );
}

export async function FrontStage() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [{ lead }, board, pulse] = await Promise.all([
    loadFrontStories(locale),
    loadFrontBoard(locale),
    loadFrontPulse(),
  ]);

  const spotlight = board[0] ?? null;
  const dock = board.slice(1, 4);
  const ticker = board.slice(0, 14);

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
                      {live || finished ? `${match.homeScore ?? 0}-${match.awayScore ?? 0}` : (
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

        <div className={styles.stageBody}>
          <div className={styles.stageCopy}>
            <div className={styles.stageBrand}>
              <BrandMark size={44} priority />
              <span>{t('stage_kicker')}</span>
            </div>
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
              <Link href="/matches" className={styles.btnSolid}>
                {t('cta_matches')}
              </Link>
              <Link href="/live" className={styles.btn}>
                {t('cta_live')}
              </Link>
              <Link href="/news" className={styles.btn}>
                {t('cta_news')}
              </Link>
            </nav>
          </div>

          {spotlight ? (
            <aside className={styles.stageSide} aria-label={t('spotlight_label')}>
              <Spotlight
                match={spotlight}
                label={t('spotlight_label')}
                liveLabel={t('live_badge')}
                ftLabel={t('ft_badge')}
                vsLabel={t('vs')}
                previewLabel={t('match_preview')}
              />
              {dock.length > 0 ? (
                <div className={styles.stageDock}>
                  {dock.map((match) => (
                    <FrontMatchTile
                      key={match.id}
                      match={match}
                      liveLabel={t('live_badge')}
                      ftLabel={t('ft_badge')}
                      vsLabel={t('vs')}
                    />
                  ))}
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
