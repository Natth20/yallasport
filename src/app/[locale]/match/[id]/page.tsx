import React, { type ReactNode } from 'react';
import { MapPin, Radio, Shield, Users } from 'lucide-react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { NewsCard } from '@/components/news/NewsCard';
import { MatchStreamPlayer } from '@/components/streaming/MatchStreamPlayer';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { PredictionWidget } from '@/components/sports/PredictionWidget';
import { MatchChat } from '@/components/sports/MatchChat';
import { ShareButton } from '@/components/common/ShareButton';
import { FollowButton } from '@/components/common/FollowButton';
import { MatchAIAnalyst } from '@/components/sports/MatchAIAnalyst';
import { notFound } from 'next/navigation';
import { getResolvedMatchDetail } from '@/lib/sports-data/match-resolver';
import { MatchDossier, type FormLetter } from '@/components/sports/MatchDossier';
import { MatchQuickActions } from '@/components/sports/MatchQuickActions';
import { MATCH_LIST_INCLUDE, toNormalizedMatch, toNormalizedStanding } from '@/lib/sports-data/from-db';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { licensedAssetForMatch } from '@/lib/streaming/catalog';
import { relatedNewsForMatch } from '@/lib/news/entity-suggest';
import { DeskRule } from '@/components/news/NewsOrnaments';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const locale = await getLocale();
  try {
    const { id } = await params;
    const match = await prisma.match.findFirst({
      where: { OR: [{ id }, { externalId: id }] },
      select: {
        homeScore: true,
        awayScore: true,
        status: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
      },
    });
    if (!match) {
      return pageMetadata({
        locale,
        title: pick(locale, 'مركز المباراة', 'Match center'),
        description: pick(locale, 'تغطية المباراة من مصدر البيانات الحقيقي.', 'Match coverage from the real data source.'),
        path: `/match/${id}`,
        noIndex: true,
      });
    }
    const hasScore = match.homeScore != null && match.awayScore != null;
    const scoreBit = hasScore ? ` ${match.homeScore}-${match.awayScore}` : '';
    const vs = pick(locale, 'ضد', 'vs');
    const title = `${match.homeTeam.name}${hasScore ? scoreBit : ''} ${vs} ${match.awayTeam.name}`;
    const description = hasScore
      ? pick(
          locale,
          `تغطية مباراة ${match.homeTeam.name} و${match.awayTeam.name} بالنتيجة ${match.homeScore}-${match.awayScore} من مصدر البيانات الحقيقي.`,
          `Coverage of ${match.homeTeam.name} vs ${match.awayTeam.name} at ${match.homeScore}-${match.awayScore} from the real data source.`
        )
      : pick(
          locale,
          `تغطية مباراة ${match.homeTeam.name} ضد ${match.awayTeam.name}: التشكيلة، الأحداث، والقنوات من المصدر الحقيقي دون نتائج وهمية.`,
          `Coverage of ${match.homeTeam.name} vs ${match.awayTeam.name}: lineups, events, and TV listings from the real source — no invented scores.`
        );
    return pageMetadata({
      locale,
      title,
      description,
      path: `/match/${id}`,
      images: [match.homeTeam.logoUrl, match.awayTeam.logoUrl],
    });
  } catch {
    return pageMetadata({
      locale,
      title: pick(locale, 'مركز المباراة', 'Match center'),
      description: pick(locale, 'تغطية المباراة من مصدر البيانات الحقيقي.', 'Match coverage from the real data source.'),
      path: '/matches',
    });
  }
}

function toForm(
  teamId: string,
  rows: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }>
): FormLetter[] {
  return rows.map((row) => {
    const isHome = row.homeTeamId === teamId;
    const scored = (isHome ? row.homeScore : row.awayScore) ?? 0;
    const conceded = (isHome ? row.awayScore : row.homeScore) ?? 0;
    if (scored > conceded) return 'W';
    if (scored < conceded) return 'L';
    return 'D';
  });
}

function belongsToTeam(teamId: string, team: { id: string; externalId: string }) {
  return teamId === team.id || teamId === team.externalId;
}

export default async function MatchCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const { id } = await params;
  const session = await auth();
  const match = await getResolvedMatchDetail(id);
  if (!match) notFound();

  const [h2hRows, standingRows, relatedNews, userPrediction, matchComments, userFollow, userReminder, formRows, licensedAsset] =
    await Promise.all([
      prisma.match
        .findMany({
          where: {
            status: 'FINISHED',
            id: { not: match.id },
            OR: [
              { homeTeamId: match.homeTeam.id, awayTeamId: match.awayTeam.id },
              { homeTeamId: match.awayTeam.id, awayTeamId: match.homeTeam.id },
            ],
          },
          orderBy: { kickoffAt: 'desc' },
          take: 8,
          include: MATCH_LIST_INCLUDE,
        })
        .catch(() => []),
      prisma.standing
        .findMany({
          where: { leagueId: match.league.id },
          orderBy: [{ seasonId: 'desc' }, { rank: 'asc' }],
          take: 40,
          include: { team: true },
        })
        .catch(() => []),
      relatedNewsForMatch(match.id, locale, 3).catch(() => []),
      session?.user?.email
        ? prisma.prediction
            .findFirst({
              where: {
                matchId: match.id,
                user: { email: session.user.email },
              },
            })
            .catch(() => null)
        : null,
      prisma.comment
        .findMany({
          where: { matchId: match.id },
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
          take: 50,
        })
        .catch(() => []),
      session?.user?.email
        ? prisma.userFavorite
            .findFirst({
              where: {
                entityId: match.id,
                entityType: 'MATCH',
                user: { email: session.user.email },
              },
            })
            .catch(() => null)
        : null,
      session?.user?.id
        ? prisma.matchReminder
            .findUnique({
              where: { userId_matchId: { userId: session.user.id, matchId: match.id } },
              select: { id: true },
            })
            .catch(() => null)
        : null,
      prisma.match
        .findMany({
          where: {
            status: 'FINISHED',
            id: { not: match.id },
            OR: [
              { homeTeamId: match.homeTeam.id },
              { awayTeamId: match.homeTeam.id },
              { homeTeamId: match.awayTeam.id },
              { awayTeamId: match.awayTeam.id },
            ],
          },
          orderBy: { kickoffAt: 'desc' },
          take: 16,
          select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        })
        .catch(() => []),
      licensedAssetForMatch(match.id).catch(() => null),
    ]);

  const h2hMatches = h2hRows.map(toNormalizedMatch);
  const latestSeason = standingRows[0]?.seasonId;
  const leagueStandings = standingRows
    .filter((row) => row.seasonId === latestSeason)
    .map(toNormalizedStanding);

  const homeStanding = leagueStandings.find((row) => row.team.id === match.homeTeam.id);
  const awayStanding = leagueStandings.find((row) => row.team.id === match.awayTeam.id);
  const involvedRanks = [homeStanding?.rank, awayStanding?.rank].filter(
    (rank): rank is number => typeof rank === 'number'
  );
  const tableWindow = leagueStandings.filter((row) => {
    if (involvedRanks.length === 0) return row.rank <= 8;
    const minRank = Math.min(...involvedRanks);
    const maxRank = Math.max(...involvedRanks);
    return row.rank >= Math.max(1, minRank - 2) && row.rank <= maxRank + 2;
  });
  const venueName = typeof match.venue === 'string' ? match.venue : match.venueDetail?.name || match.venue;
  const matchSheetRows = [
    ...(typeof venueName === 'string' && venueName
      ? [
          {
            icon: MapPin,
            label: pick(locale, 'الملعب', 'Venue'),
            value: `${venueName}${match.venueDetail?.city ? ` · ${match.venueDetail.city}` : ''}${
              match.venueDetail?.capacity
                ? ` · ${match.venueDetail.capacity.toLocaleString(locale)} ${pick(locale, 'مقعد', 'seats')}`
                : ''
            }`,
          },
        ]
      : []),
    ...(match.referee?.name
      ? [{ icon: Shield, label: pick(locale, 'الحكم', 'Referee'), value: match.referee.name }]
      : []),
    ...(match.channels.length
      ? [
          {
            icon: Radio,
            label: pick(locale, 'النقل', 'Broadcast'),
            value: match.channels.map((channel) => channel.name).join(', '),
          },
        ]
      : []),
    ...(match.commentators?.length
      ? [
          {
            icon: Users,
            label: pick(locale, 'التعليق', 'Commentary'),
            value: match.commentators.map((commentator) => commentator.name).join(', '),
          },
        ]
      : []),
  ];

  const homeForm = toForm(
    match.homeTeam.id,
    formRows
      .filter((row) => row.homeTeamId === match.homeTeam.id || row.awayTeamId === match.homeTeam.id)
      .slice(0, 5)
  );
  const awayForm = toForm(
    match.awayTeam.id,
    formRows
      .filter((row) => row.homeTeamId === match.awayTeam.id || row.awayTeamId === match.awayTeam.id)
      .slice(0, 5)
  );
  const h2hTally = h2hMatches.reduce(
    (tally, item) => {
      if (typeof item.homeScore !== 'number' || typeof item.awayScore !== 'number') return tally;
      const homeScore = item.homeScore;
      const awayScore = item.awayScore;
      if (homeScore === awayScore) return { ...tally, draw: tally.draw + 1 };
      const homeSideWon = homeScore > awayScore;
      const currentHomeWon =
        (homeSideWon && item.homeTeam.id === match.homeTeam.id) ||
        (!homeSideWon && item.awayTeam.id === match.homeTeam.id);
      return currentHomeWon ? { ...tally, home: tally.home + 1 } : { ...tally, away: tally.away + 1 };
    },
    { home: 0, draw: 0, away: 0 }
  );

  const homeStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.homeTeam));
  const awayStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.awayTeam));
  const hasBrief =
    (homeStats?.possession != null && awayStats?.possession != null) ||
    (homeStats?.shotsOnTarget != null && awayStats?.shotsOnTarget != null) ||
    match.events.some((event) => event.type === 'YELLOW_CARD' || event.type === 'RED_CARD');

  const standingChip = (row?: typeof homeStanding) =>
    row
      ? {
          rank: row.rank,
          points: row.points,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
        }
      : undefined;

  return (
    <MatchDossier
      initial={match}
      h2hMatches={h2hMatches}
      homeStanding={standingChip(homeStanding)}
      awayStanding={standingChip(awayStanding)}
      homeForm={homeForm}
      awayForm={awayForm}
      h2hTally={h2hMatches.length > 0 ? h2hTally : undefined}
      leagueCountry={match.league.country ?? undefined}
      headerActions={
        <>
          <FollowButton
            entityId={match.id}
            entityType="MATCH"
            isLoggedIn={!!session}
            initialIsFollowing={!!userFollow}
          />
          <MatchQuickActions
            matchId={match.id}
            title={`${match.homeTeam.name} ${pick(locale, 'ضد', 'vs')} ${match.awayTeam.name}`}
            kickoffAt={new Date(match.kickoffAt).toISOString()}
            venue={typeof venueName === 'string' ? venueName : undefined}
            isLoggedIn={Boolean(session?.user)}
            initialReminder={Boolean(userReminder)}
          />
          <ShareButton
            title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
            text={pick(locale, 'تابع المباراة مباشرة على يلا سبورت', 'Follow the match live on Yalla Sport')}
          />
        </>
      }
    >
      {hasBrief ? (
        <FolioPanel
          folio="05"
          kicker={pick(locale, 'ملخص', 'Brief')}
          title={pick(locale, 'قراءة من الأرقام', 'Reading the numbers')}
        >
          <MatchAIAnalyst
            homeName={match.homeTeam.name}
            awayName={match.awayTeam.name}
            homeStats={homeStats}
            awayStats={awayStats}
            events={match.events}
          />
        </FolioPanel>
      ) : null}

      {STREAMING_ENABLED && licensedAsset ? (
        <FolioPanel
          folio="06"
          kicker={pick(locale, 'النقل', 'Broadcast')}
          title={pick(locale, 'البث', 'Stream')}
        >
          <MatchStreamPlayer assetId={licensedAsset.id} />
          <Link href={`/watch/${licensedAsset.id}`} className="mt-3 inline-block text-xs font-black text-orange-500">
            {pick(locale, 'فتح صفحة المشاهدة', 'Open watch page')}
          </Link>
        </FolioPanel>
      ) : null}

      {(homeStanding || awayStanding) && (
        <FolioPanel
          folio="07"
          kicker={pick(locale, 'المستوى', 'Form')}
          title={pick(locale, 'موقع الفريقين', 'Team positions')}
        >
          <div className="space-y-3">
            {[
              { row: homeStanding, form: homeForm },
              { row: awayStanding, form: awayForm },
            ]
              .filter((item) => item.row)
              .map(({ row, form }) => (
                <div key={row!.team.id} className="match-side-team">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tabular-nums text-orange-500">{row!.rank}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row!.team.logoUrl || '/placeholder-team.png'}
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                    <span className="truncate text-[12px] font-bold text-foreground dark:text-foreground">
                      {row!.team.name}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                    {row!.played} {pick(locale, 'لعب', 'P')} · {row!.won}
                    {pick(locale, 'ف', 'W')} {row!.drawn}
                    {pick(locale, 'ت', 'D')} {row!.lost}
                    {pick(locale, 'خ', 'L')} · {row!.goalsFor}:{row!.goalsAgainst} · {row!.points}{' '}
                    {pick(locale, 'نقطة', 'points')}
                  </p>
                  {form.length > 0 ? (
                    <div className="mt-2 flex gap-1">
                      {form.map((letter, index) => (
                        <span
                          key={`${row!.team.id}-${index}`}
                          className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold ${
                            letter === 'W'
                              ? 'bg-emerald-500 text-white'
                              : letter === 'L'
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-200 text-foreground dark:bg-muted/10 dark:text-foreground/70'
                          }`}
                        >
                          {letter === 'W'
                            ? pick(locale, 'ف', 'W')
                            : letter === 'L'
                              ? pick(locale, 'خ', 'L')
                              : pick(locale, 'ت', 'D')}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </FolioPanel>
      )}

      <div className="match-plate overflow-hidden !p-0">
        <PredictionWidget
          matchId={match.id}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
          isLoggedIn={!!session}
          existingPrediction={userPrediction?.predictedOutcome}
        />
      </div>

      {tableWindow.length > 0 ? (
        <div className="match-table-plate">
          <div className="match-table-head">
            <div className="match-section-kicker-row">
              <span className="match-folio-mark is-light">08</span>
              <span className="atlas-section-kicker text-orange-400">
                {pick(locale, 'الجدول', 'Table')}
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-white">
              {pick(locale, 'نافذة الترتيب', 'Standings window')}
            </h2>
          </div>
          <div className="divide-y divide-white/[0.07]">
            <div className="grid grid-cols-[1.5rem_1fr_repeat(4,1.6rem)] gap-1 px-5 py-2 text-[8px] font-bold text-white/35">
              <span>#</span>
              <span>{pick(locale, 'فريق', 'Team')}</span>
              <span className="text-center">{pick(locale, 'ل', 'P')}</span>
              <span className="text-center">{pick(locale, 'ف', 'W')}</span>
              <span className="text-center">+/-</span>
              <span className="text-center">{pick(locale, 'ن', 'Pts')}</span>
            </div>
            {tableWindow.map((row) => {
              const involved = row.team.id === match.homeTeam.id || row.team.id === match.awayTeam.id;
              return (
                <div
                  key={row.team.id}
                  className={`grid grid-cols-[1.5rem_1fr_repeat(4,1.6rem)] items-center gap-1 px-5 py-3 ${
                    involved ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <span className="text-[10px] font-bold tabular-nums text-white/30">{row.rank}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.team.logoUrl || '/placeholder-team.png'}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                    <span className="truncate text-[11px] font-bold">{row.team.name}</span>
                  </span>
                  <span className="text-center text-[10px] tabular-nums text-white/60">{row.played}</span>
                  <span className="text-center text-[10px] tabular-nums text-white/60">{row.won}</span>
                  <span className="text-center text-[10px] tabular-nums text-white/60">
                    {row.goalsFor - row.goalsAgainst}
                  </span>
                  <span className="text-center text-[11px] font-bold tabular-nums text-orange-300">
                    {row.points}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href={`/league/${match.league.slug}/standings`}
            className="block border-t border-white/10 px-5 py-3 text-[10px] font-bold text-orange-400"
          >
            {pick(locale, 'الجدول الكامل', 'Full table')}
          </Link>
        </div>
      ) : null}

      {matchSheetRows.length > 0 ? (
        <FolioPanel
          folio="09"
          kicker={pick(locale, 'ملاحظات', 'Notes')}
          title={pick(locale, 'ورقة المباراة', 'Match sheet')}
        >
          <div className="-mx-1 divide-y divide-[rgba(15,23,42,0.06)] dark:divide-white/5">
            {matchSheetRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 py-3.5">
                <row.icon className="mt-0.5 h-4 w-4 text-orange-500" />
                <div>
                  <span className="block text-[9px] font-semibold text-muted-foreground">{row.label}</span>
                  <strong className="mt-1 block text-[13px] text-foreground dark:text-foreground">{row.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </FolioPanel>
      ) : null}

      {relatedNews.length > 0 ? (
        <div>
          <div className="match-section-kicker-row mb-3">
            <span className="match-folio-mark">10</span>
            <span className="atlas-section-kicker text-orange-500">
              {pick(locale, 'تقارير ذات صلة', 'Related reports')}
            </span>
          </div>
          <div className="space-y-3">
            {relatedNews.map(
              (news) =>
                news.publishedAt && (
                  <NewsCard
                    key={news.id}
                    news={{
                      ...news,
                      excerpt: news.excerpt ?? undefined,
                      featuredImage: news.featuredImage ?? undefined,
                      publishedAt: news.publishedAt,
                    }}
                    variant="horizontal"
                  />
                )
            )}
          </div>
        </div>
      ) : null}

      <div className="match-plate match-chat-plate overflow-hidden !p-0">
        <MatchChat
          matchId={match.id}
          isLoggedIn={!!session}
          initialComments={matchComments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            user: {
              name: comment.user.name || 'User',
              role: comment.user.role,
            },
          }))}
        />
      </div>
    </MatchDossier>
  );
}

function FolioPanel({
  folio,
  kicker,
  title,
  children,
}: {
  folio: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="match-plate">
      <div className="match-section-kicker-row">
        <span className="match-folio-mark" aria-hidden>
          {folio}
        </span>
        <span className="atlas-section-kicker">{kicker}</span>
      </div>
      <h2 className="match-section-title !text-[1.2rem]">{title}</h2>
      <DeskRule className="my-3 max-w-[9rem] opacity-45" />
      <div>{children}</div>
    </section>
  );
}
