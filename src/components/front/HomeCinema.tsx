import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { deskLabel } from '@/lib/news/desks';
import { cinemaPrefersMatch, pickCinemaMatch, pickCinemaStory } from '@/lib/front/pick-cinema';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import { loadFrontStories } from '@/lib/front/load-stories';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import hall from '@/components/salon/entity-hall.module.css';
import styles from './home-salon.module.css';
import { specialStatusLabel } from './front-labels';

export async function HomeCinema() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [{ lead, rest }, board, pulse] = await Promise.all([
    loadFrontStories(locale),
    loadFrontBoard(locale),
    loadFrontPulse(),
  ]);

  const match = pickCinemaMatch(board);
  const story = pickCinemaStory(lead, rest);
  const useMatch = Boolean(match && (cinemaPrefersMatch(board) || !story?.image));
  const live = match ? isLiveStatus(match.status) : false;
  const finished = match?.status === 'FINISHED';
  const special = match ? specialStatusLabel(match.status, locale) : null;

  const clock = live
    ? match?.minute != null
      ? `${match.minute}′`
      : t('live_badge')
    : pulse.live > 0
      ? `${pulse.live} ${t('stat_live')}`
      : pick(locale, 'صالة اليوم', "Today's salon");

  return (
    <section id="hall-screen" className={hall.wideScreen} aria-label={t('stage_kicker')}>
      <div className={hall.chassis}>
        <HallBezel
          label={useMatch && match ? match.league.name : pick(locale, 'صالة اليوم', "Today's salon")}
          clock={clock}
        />
        <div className={`${hall.frame} ${styles.cinemaFrame}`}>
          {useMatch && match ? (
            <>
              <div className={hall.crestWash} aria-hidden>
                {match.homeTeam.logoUrl ? <img src={match.homeTeam.logoUrl} alt="" /> : <span />}
                {match.awayTeam.logoUrl ? <img src={match.awayTeam.logoUrl} alt="" /> : <span />}
              </div>
              <div className={hall.duel}>
                <Link href={`/team/${match.homeTeam.slug}`} className={hall.side}>
                  <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-16 w-16" />
                  <strong>{match.homeTeam.name}</strong>
                </Link>
                <div className={hall.score}>
                  {live || finished ? (
                    <b>
                      {match.homeScore ?? '–'} : {match.awayScore ?? '–'}
                    </b>
                  ) : (
                    <span className={styles.kickoffBlock}>
                      <ClientTime value={match.kickoffAt} locale={locale} variant="clock" />
                    </span>
                  )}
                  <em className={live ? hall.liveBadge : undefined}>
                    {live ? <span className={hall.liveDot} /> : null}
                    {live
                      ? t('live_badge')
                      : finished
                        ? t('ft_badge')
                        : special || match.league.name}
                  </em>
                </div>
                <Link href={`/team/${match.awayTeam.slug}`} className={hall.side}>
                  <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-16 w-16" />
                  <strong>{match.awayTeam.name}</strong>
                </Link>
              </div>
            </>
          ) : story?.image ? (
            <>
              <img src={story.image} alt="" className={styles.cinemaPhoto} referrerPolicy="no-referrer" />
              <div className={styles.cinemaShade} aria-hidden />
              <div className={styles.cinemaCopy}>
                <em>{deskLabel(story.category, locale)}</em>
                <h2>{story.title}</h2>
                {story.excerpt ? <p>{story.excerpt}</p> : null}
              </div>
            </>
          ) : (
            <div className={`${styles.cinemaCopy} ${styles.cinemaIdle}`}>
              <em>{t('kicker')}</em>
              <h2>{t('headline')}</h2>
              <p>{t('standfirst')}</p>
            </div>
          )}
          <div className={hall.caption}>
            <span>
              <b>{useMatch && match ? `${match.homeTeam.name} — ${match.awayTeam.name}` : story?.title || t('headline')}</b>
            </span>
            {pulse.matches > 0 ? (
              <span>
                {pulse.matches} {t('stat_matches')}
                {pulse.live > 0 ? ` · ${pulse.live} ${t('stat_live')}` : ''}
              </span>
            ) : null}
          </div>
          <HallBrackets />
        </div>
      </div>

      <div className={hall.program}>
        <div className={hall.chips}>
          <span className={hall.chipOn}>{t('stage_kicker')}</span>
          {pulse.live > 0 ? <span className={hall.chip}>{pulse.live} {t('stat_live')}</span> : null}
          {pulse.goals > 0 ? <span className={hall.chip}>{pulse.goals} {t('stat_goals')}</span> : null}
          {story?.sourceName ? <span className={hall.chip}>{story.sourceName}</span> : null}
        </div>
        <h2 className={hall.programTitle}>
          {useMatch && match
            ? `${match.homeTeam.name} — ${match.awayTeam.name}`
            : story?.image
              ? pick(locale, 'التقرير على الشاشة', 'On the screen')
              : story?.title || t('headline')}
        </h2>
        {useMatch && match ? (
          <p className={styles.programLead}>{match.league.name}</p>
        ) : story?.excerpt ? (
          <p className={styles.programLead}>{story.excerpt}</p>
        ) : (
          <p className={styles.programLead}>{t('standfirst')}</p>
        )}
        <div className={hall.acts}>
          {useMatch && match ? (
            <Link href={`/match/${match.id}`} className={hall.go}>
              <span>{t('match_preview')}</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : story ? (
            <Link href={`/news/${story.slug}`} className={hall.go}>
              <span>{t('cta_read')}</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : null}
          <Link href="/matches" className={hall.ghost}>
            {t('cta_matches')}
          </Link>
          <Link href="/live" className={hall.ghost}>
            {t('cta_live')}
          </Link>
        </div>
      </div>
    </section>
  );
}
