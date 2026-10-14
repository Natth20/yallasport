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
          <Link href={`/league/${league.slug}`} className="hover:text-orange-500 transition-colors">
            <h3 className="text-foreground dark:text-foreground font-extrabold text-sm sm:text-base">
              {localizeCompetitionTitle(locale, league)}
            </h3>
          </Link>
          {meta.length > 0 ? <p className="text-muted-foreground">{meta.slice(0, 3).join(' · ')}</p> : null}
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
          <Link
            href={`/match/${league.nextMatch.id}`}
            className="block rounded-xl border border-border/70 bg-card/60 p-2.5 transition-colors hover:border-orange-500/40 hover:bg-card/90"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 text-[10px]">
              <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">
                {roundText || pick(locale, 'المباراة القادمة', 'Next match')}
              </span>
              <div className="flex items-center gap-1 font-semibold text-muted-foreground shrink-0" dir="ltr">
                <ClientTime
                  value={league.nextMatch.kickoffAt}
                  options={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }}
                />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-background p-0.5 border border-border/50">
                  <LeagueCrest
                    name={league.nextMatch.homeTeam.name}
                    logoUrl={league.nextMatch.homeTeam.logoUrl}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="truncate font-bold text-foreground">
                  {localizeTeamName(locale, league.nextMatch.homeTeam.name)}
                </span>
              </div>

              <span className="shrink-0 rounded-full bg-muted/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-muted-foreground">
                VS
              </span>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-end">
                <span className="truncate font-bold text-foreground">
                  {localizeTeamName(locale, league.nextMatch.awayTeam.name)}
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-background p-0.5 border border-border/50">
                  <LeagueCrest
                    name={league.nextMatch.awayTeam.name}
                    logoUrl={league.nextMatch.awayTeam.logoUrl}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </Link>
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
