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
  const homeName = localizeTeamName(locale, home.name);
  const awayName = localizeTeamName(locale, away.name);

  return (
    <Link href={href} className="league-desk-faceoff" title={`${homeName} × ${awayName}`}>
      <span className="league-desk-side is-home">
        <span className="league-desk-name" title={homeName}>
          <bdi dir="auto">{homeName}</bdi>
        </span>
        <span className="league-desk-badge shrink-0">
          <LeagueCrest name={home.name} logoUrl={home.logoUrl} className="h-full w-full object-contain" />
        </span>
      </span>
      <span className="league-desk-score shrink-0">{centre}</span>
      <span className="league-desk-side is-away">
        <span className="league-desk-badge shrink-0">
          <LeagueCrest name={away.name} logoUrl={away.logoUrl} className="h-full w-full object-contain" />
        </span>
        <span className="league-desk-name" title={awayName}>
          <bdi dir="auto">{awayName}</bdi>
        </span>
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

        <div className="league-desk-identity min-w-0 flex-1">
          <Link href={`/league/${league.slug}`} className="hover:text-orange-500 transition-colors">
            <h3 className="text-foreground dark:text-foreground font-black text-sm sm:text-base leading-snug">
              {localizeCompetitionTitle(locale, league)}
            </h3>
          </Link>
          {meta.length > 0 ? <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">{meta.slice(0, 3).join(' · ')}</p> : null}
        </div>

        <div className="league-desk-follow shrink-0">
          <LeagueFollowChip leagueId={league.id} isLoggedIn={loggedIn} initialIsFollowing={followed} />
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
            className="block rounded-2xl border border-border/70 bg-card/60 p-3 transition-colors hover:border-orange-500/40 hover:bg-card/90"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-[11px]">
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
            <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 text-xs sm:text-[13px]">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background p-0.5 border border-border/50">
                  <LeagueCrest
                    name={league.nextMatch.homeTeam.name}
                    logoUrl={league.nextMatch.homeTeam.logoUrl}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="flex-1 min-w-0 font-bold text-foreground leading-tight break-words line-clamp-2">
                  <bdi dir="auto">{localizeTeamName(locale, league.nextMatch.homeTeam.name)}</bdi>
                </span>
              </div>

              <span className="shrink-0 rounded-full bg-muted/80 px-2 py-0.5 text-[9px] font-black uppercase text-muted-foreground">
                VS
              </span>

              <div className="flex min-w-0 items-center justify-end gap-2 text-end">
                <span className="flex-1 min-w-0 font-bold text-foreground leading-tight break-words line-clamp-2">
                  <bdi dir="auto">{localizeTeamName(locale, league.nextMatch.awayTeam.name)}</bdi>
                </span>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background p-0.5 border border-border/50">
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
          <Link
            href={`/league/${league.slug}/standings`}
            className="league-desk-leader"
            title={pick(locale, `المتصدر: ${leaderName}`, `Leader: ${leaderName}`)}
          >
            <div className="league-desk-leader-crest">
              <LeagueCrest
                name={league.leader.team.name}
                logoUrl={league.leader.team.logoUrl}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="league-desk-leader-info">
              <span className="league-desk-leader-tag">
                <span className="league-desk-crown" aria-hidden>👑</span>
                {pick(locale, 'صدارة الترتيب', 'Table Leader')}
              </span>
              <strong className="league-desk-leader-name">
                <bdi dir="auto">{leaderName}</bdi>
              </strong>
            </div>
            <div className="league-desk-leader-pts">
              <span className="league-desk-pts-val tabular-nums">{league.leader.points}</span>
              <span className="league-desk-pts-lbl">{pick(locale, 'نقطة', 'pts')}</span>
            </div>
          </Link>
        ) : (
          <div className="league-desk-idle-hub">
            <div className="league-desk-idle-main">
              <span className="league-desk-idle-icon">🏆</span>
              <div className="league-desk-idle-meta min-w-0 flex-1">
                <span className="league-desk-idle-title">
                  {league.census.upcoming > 0
                    ? pick(locale, `${league.census.upcoming} مباراة مجدولة قادمة`, `${league.census.upcoming} scheduled fixtures`)
                    : league.census.finished > 0
                      ? pick(locale, `${league.census.finished} مباراة في أرشيف البطولة`, `${league.census.finished} archived matches`)
                      : pick(locale, 'في انتظار انطلاق المنافسات', 'Awaiting tournament kickoff')}
                </span>
                <span className="league-desk-idle-sub">
                  {league.season
                    ? pick(locale, `الموسم الرياضي: ${league.season}`, `Season: ${league.season}`)
                    : pick(locale, 'تابع تفاصيل البطولة وجدول المباريات', 'Follow tournament details and fixtures')}
                </span>
              </div>
            </div>
          </div>
        )}

        {league.leader && league.runnerUp && !live && gap != null ? (
          <div className="league-desk-race">
            <span className="league-desk-race-tag">
              {gap === 0
                ? pick(locale, 'تساوي بالنقاط', 'Level on points')
                : pick(locale, `فارق ${gap} نقاط`, `${gap} pts gap`)}
            </span>
            <div className="league-desk-race-teams" dir="auto">
              <bdi className="truncate">{leaderName}</bdi>
              <span className="opacity-40 font-normal">×</span>
              <bdi className="truncate">{runnerName}</bdi>
            </div>
          </div>
        ) : null}

        {roundText ? <p className="league-desk-round">{roundText}</p> : null}
      </div>

      <footer className="league-desk-card-foot">
        {league.standings > 0 ? (
          <Link href={`/league/${league.slug}/standings`}>{pick(locale, 'الجدول', 'Table')}</Link>
        ) : null}
        {league.census.upcoming > 0 ? (
          <Link href={`/league/${league.slug}/fixtures`}>{pick(locale, 'المباريات', 'Fixtures')}</Link>
        ) : null}
        {league.census.finished > 0 ? (
          <Link href={`/league/${league.slug}/archive`}>{pick(locale, 'الأرشيف', 'Archive')}</Link>
        ) : null}
        <Link href={`/league/${league.slug}`} className="is-primary" title={pick(locale, 'فتح البطولة', 'Open league')}>
          <span>{pick(locale, 'فتح', 'Open')}</span>
          <ArrowUpLeft className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </footer>
    </article>
  );
}
