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
    <Link href={`/match/${match.id}`} className={`fp-spot${live ? ' is-live' : ''}`}>
      <span className="fp-spot-top">
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        {match.league.name}
        <em className="fp-spot-tag">
          {live ? (
            <>
              <i className="fp-live-dot" aria-hidden />
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
      <span className="fp-spot-duel">
        <span className="fp-spot-team">
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-14 w-14" />
          <strong>{match.homeTeam.name}</strong>
        </span>
        <span className="fp-spot-mid">
          {showScore ? (
            <b className="fp-spot-score">
              {match.homeScore ?? 0}
              <i>–</i>
              {match.awayScore ?? 0}
            </b>
          ) : (
            <>
              <b className="fp-spot-vs">{vsLabel}</b>
              <ClientTime
                className="fp-spot-time"
                value={match.kickoffAt}
                options={{ hour: '2-digit', minute: '2-digit' }}
              />
            </>
          )}
        </span>
        <span className="fp-spot-team">
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-14 w-14" />
          <strong>{match.awayTeam.name}</strong>
        </span>
      </span>
      <span className="fp-spot-cta">{previewLabel}</span>
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
    <section className="fp-stage">
      <div className="fp-stage-media" aria-hidden>
        {lead?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lead.image} alt="" referrerPolicy="no-referrer" />
        ) : null}
        <span className="fp-aurora fp-aurora-a" />
        <span className="fp-aurora fp-aurora-b" />
        <span className="fp-pitch" />
      </div>

      <div className="fp-stage-shell">
        {ticker.length > 0 ? (
          <div className="fp-ticker" aria-label={t('ch01_title')}>
            <span className="fp-ticker-tag">{t('stage_kicker')}</span>
            <div className="fp-ticker-rail">
              {ticker.map((match) => {
                const live = isLiveStatus(match.status);
                const finished = match.status === 'FINISHED';
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className={`fp-tick${live ? ' is-live' : ''}`}>
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

        <div className="fp-stage-body">
          <div className="fp-stage-copy">
            <div className="fp-stage-brand">
              <BrandMark size={44} priority />
              <span>{t('stage_kicker')}</span>
            </div>
            <p className="fp-stage-meta">
              {lead ? <em>{deskLabel(lead.category, locale)}</em> : <em>{t('kicker')}</em>}
              {lead?.sourceName ? <b>{lead.sourceName}</b> : <b>{t('source_seal')}</b>}
            </p>
            <h1>
              <Link href={href}>{title}</Link>
            </h1>
            <p className="fp-stage-lede">{lead?.excerpt || t('standfirst')}</p>
            {chips.length > 0 ? (
              <ul className="fp-pulse-chips" aria-label={t('pulse_note')}>
                {chips.map((item) => (
                  <li key={item.label} className={item.live ? 'is-live' : undefined}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <nav className="fp-hero-cta">
              <Link href="/matches" className="fp-btn is-solid">
                {t('cta_matches')}
              </Link>
              <Link href="/live" className="fp-btn">
                {t('cta_live')}
              </Link>
              <Link href="/news" className="fp-btn">
                {t('cta_news')}
              </Link>
            </nav>
          </div>

          {spotlight ? (
            <aside className="fp-stage-side" aria-label={t('spotlight_label')}>
              <Spotlight
                match={spotlight}
                label={t('spotlight_label')}
                liveLabel={t('live_badge')}
                ftLabel={t('ft_badge')}
                vsLabel={t('vs')}
                previewLabel={t('match_preview')}
              />
              {dock.length > 0 ? (
                <div className="fp-stage-dock">
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
