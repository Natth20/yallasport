import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pickCinemaMatch } from '@/lib/front/pick-cinema';
import { loadFrontBoard } from '@/lib/front/load-board';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import hall from '@/components/salon/entity-hall.module.css';
import styles from './home-salon.module.css';
import { specialStatusLabel } from './front-labels';

export async function HomeScreen() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const board = await loadFrontBoard(locale);
  const match = pickCinemaMatch(board);
  if (!match) return null;

  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  const friendly = isFriendlyLeague(match.league);
  const special = specialStatusLabel(match.status, locale);
  const clock = live && match.minute != null ? `${match.minute}′` : live ? t('live_badge') : pick(locale, 'الشاشة', 'Screen');
  const seal = friendly ? pick(locale, 'صالون الودية', 'Exhibition salon') : match.league.name;

  return (
    <section id="hall-screen" className={hall.wideScreen} aria-label={t('stage_kicker')}>
      <div className={hall.chassis}>
        <HallBezel label={seal} clock={clock} />
        <div className={`${hall.frame} ${styles.cinemaFrame}${friendly ? ` ${styles.cinemaFriendly}` : ''}`}>
          <div className={hall.crestWash} aria-hidden>
            {match.homeTeam.logoUrl ? <img src={match.homeTeam.logoUrl} alt="" /> : <span />}
            {match.awayTeam.logoUrl ? <img src={match.awayTeam.logoUrl} alt="" /> : <span />}
          </div>
          <div className={hall.duel}>
            <Link href={`/team/${match.homeTeam.slug}`} className={hall.side}>
              <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-20 w-20" />
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
                {friendly
                  ? pick(locale, 'لقاء ودي', 'Friendly')
                  : live
                    ? t('live_badge')
                    : finished
                      ? t('ft_badge')
                      : special || match.league.name}
              </em>
            </div>
            <Link href={`/team/${match.awayTeam.slug}`} className={hall.side}>
              <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-20 w-20" />
              <strong>{match.awayTeam.name}</strong>
            </Link>
          </div>
          <div className={hall.caption}>
            <span>
              <b>
                {match.homeTeam.name} — {match.awayTeam.name}
              </b>
            </span>
            <Link href={`/match/${match.id}`} className={styles.screenGo}>
              {t('match_preview')}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <HallBrackets />
        </div>
      </div>
    </section>
  );
}
