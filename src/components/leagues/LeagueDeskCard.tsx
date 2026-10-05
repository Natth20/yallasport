import React from 'react';
import { ArrowUpLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueFollowChip } from '@/components/leagues/LeagueFollowChip';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizeCompetitionTitle, localizeLeagueRegion, localizeRoundName } from '@/lib/i18n/competition-names';
import { arabicCountLabel, countLabel } from '@/lib/i18n/arabic-count';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';

type Crest = { name: string; logoUrl: string | null };

export type DeskCardLeague = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  externalId?: string | null;
  standings: number;
  season: string | null;
  extraLive: number;
  census: { live: number; upcoming: number; finished: number; total: number };
  nextMatch: {
    id: string;
    kickoffAt: Date;
    round?: string | null;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  lastResult: {
    id: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  liveMatch: {
    id: string;
    status: string;
    minute: number | null;
    round?: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  leader: { team: Crest; points: number } | null;
  runnerUp: { team: Crest; points: number } | null;
};

function hasScore(home: number | null | undefined, away: number | null | undefined) {
  return typeof home === 'number' && typeof away === 'number';
}

function liveClock(match: { status: string; minute: number | null }, locale: string) {
  if (match.status === 'HALFTIME') return pick(locale, 'استراحة', 'Half-time');
  if (match.minute) return `${match.minute}'`;
  return pick(locale, 'مباشر', 'Live');
}

function FaceOff({
  home,
  away,
  centre,
  href,
  locale,
}: {
  home: { name: string; logoUrl: string | null };
  away: { name: string; logoUrl: string | null };
  centre: React.ReactNode;
  href: string;
  locale: string;
}) {
  return (
    <Link href={href} className="league-desk-faceoff">
      <span className="league-desk-side is-home">
        <span className="league-desk-badge">
          <LeagueCrest name={home.name} logoUrl={home.logoUrl} className="h-full w-full" />
        </span>
        <span className="truncate">{localizeTeamName(locale, home.name)}</span>
      </span>
      <span className="league-desk-score">{centre}</span>
      <span className="league-desk-side is-away">
        <span className="league-desk-badge">
          <LeagueCrest name={away.name} logoUrl={away.logoUrl} className="h-full w-full" />
        </span>
        <span className="truncate">{localizeTeamName(locale, away.name)}</span>
      </span>
    </Link>
  );
}

export function LeagueDeskCard({
  league,
  followed,
  loggedIn,
  locale,
}: {
  league: DeskCardLeague;
  followed: boolean;
  loggedIn: boolean;
  locale: string;
}) {
  const live = Boolean(league.liveMatch);
  const liveScore = league.liveMatch && hasScore(league.liveMatch.homeScore, league.liveMatch.awayScore);
  const hasResult =
    Boolean(league.lastResult) && hasScore(league.lastResult?.homeScore, league.lastResult?.awayScore);
  const gap =
    league.leader && league.runnerUp ? league.leader.points - league.runnerUp.points : null;
  const leaderName = league.leader ? localizeTeamName(locale, league.leader.team.name) : '';
  const runnerName = league.runnerUp ? localizeTeamName(locale, league.runnerUp.team.name) : '';
  const roundText = localizeRoundName(
    locale,
    league.liveMatch?.round || league.nextMatch?.round || null
  );

  const meta = [
    localizeLeagueRegion(locale, league.country, league.externalId) || pick(locale, 'غير مصنفة', 'Unclassified'),
    league.season,
    league.standings > 0
      ? locale === 'ar'
        ? arabicCountLabel(league.standings, 'team')
        : `${league.standings} ${countLabel(locale, league.standings, 'team', 'teams')}`
      : null,
    !live && league.census.live > 0
      ? locale === 'ar'
        ? arabicCountLabel(league.census.live, 'liveMatch')
        : `${league.census.live} live`
      : null,
    league.census.upcoming > 0
      ? locale === 'ar'
        ? arabicCountLabel(league.census.upcoming, 'match')
        : `${league.census.upcoming} upcoming`
      : null,
  ].filter((item): item is string => Boolean(item));

  const tone = live ? 'is-live' : league.leader ? 'is-table' : league.nextMatch ? 'is-next' : 'is-quiet';

  return (
    <article className={`league-desk-card ${tone}`}>
      <div className="league-desk-card-top">
        <div className="league-desk-follow">
          <LeagueFollowChip leagueId={league.id} isLoggedIn={loggedIn} initialIsFollowing={followed} />
        </div>

        <Link href={`/league/${league.slug}`} className="league-desk-crest-stage">
          <span className="league-desk-crest-ring" aria-hidden />
          <span className="league-desk-crest-orb">
            <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-full w-full text-4xl" />
          </span>
          {live ? (
            <span className="league-desk-live-pill">
              <i />
              {pick(locale, 'مباشر', 'Live')}
              {league.extraLive > 0 ? ` +${league.extraLive}` : ''}
            </span>
          ) : null}
        </Link>

        <div className="league-desk-identity">
          <Link href={`/league/${league.slug}`}>
            <h3>{localizeCompetitionTitle(locale, league)}</h3>
          </Link>
          {meta.length > 0 ? <p>{meta.slice(0, 3).join(' · ')}</p> : null}
        </div>
      </div>

      <div className="league-desk-card-body">
        {league.liveMatch ? (
          <FaceOff
            locale={locale}
            home={league.liveMatch.homeTeam}
            away={league.liveMatch.awayTeam}
            href={`/match/${league.liveMatch.id}`}
            centre={
              liveScore ? (
                <strong>
                  {league.liveMatch.homeScore}
                  <span>–</span>
                  {league.liveMatch.awayScore}
                </strong>
              ) : (
                <em>{liveClock(league.liveMatch, locale)}</em>
              )
            }
          />
        ) : league.nextMatch ? (
          <FaceOff
            locale={locale}
            home={league.nextMatch.homeTeam}
            away={league.nextMatch.awayTeam}
            href={`/match/${league.nextMatch.id}`}
            centre={
              <span className="league-desk-kick">
                <em>{pick(locale, 'قادمة', 'Next')}</em>
                <ClientTime value={league.nextMatch.kickoffAt} />
              </span>
            }
          />
        ) : hasResult && league.lastResult ? (
          <FaceOff
            locale={locale}
            home={league.lastResult.homeTeam}
            away={league.lastResult.awayTeam}
            href={`/match/${league.lastResult.id}`}
            centre={
              <strong>
                {league.lastResult.homeScore}
                <span>–</span>
                {league.lastResult.awayScore}
              </strong>
            }
          />
        ) : league.leader ? (
          <Link href={`/league/${league.slug}/standings`} className="league-desk-leader">
            <span className="league-desk-badge">
              <LeagueCrest
                name={league.leader.team.name}
                logoUrl={league.leader.team.logoUrl}
                className="h-full w-full"
              />
            </span>
            <span className="min-w-0">
              <em>{pick(locale, 'الصدارة', 'Leader')}</em>
              <strong className="truncate">{leaderName}</strong>
            </span>
            <b className="tabular-nums">{league.leader.points}</b>
          </Link>
        ) : null}

        {league.leader && league.runnerUp && !live && gap != null ? (
          <p className="league-desk-race">
            <span>
              {gap === 0
                ? pick(locale, 'يتساوى الفريقان في النقاط.', 'The two teams are level on points.')
                : pick(locale, `الفارق بين الفريقين: ${gap} نقطة.`, `The gap between the two teams is ${gap} pts.`)}
            </span>
            <span className="truncate">
              {leaderName} · {runnerName}
            </span>
          </p>
        ) : null}

        {roundText ? <p className="league-desk-round">{roundText}</p> : null}
      </div>

      <footer className="league-desk-card-foot">
        {league.standings > 0 ? (
          <Link href={`/league/${league.slug}/standings`}>{pick(locale, 'الجدول', 'Table')}</Link>
        ) : null}
        {league.census.finished > 0 ? (
          <Link href={`/league/${league.slug}/archive`}>{pick(locale, 'الأرشيف', 'Archive')}</Link>
        ) : null}
        <Link href={`/league/${league.slug}`} className="is-primary">
          {pick(locale, 'فتح البطولة', 'Open league')}
          <ArrowUpLeft className="h-3 w-3" />
        </Link>
      </footer>
    </article>
  );
}
