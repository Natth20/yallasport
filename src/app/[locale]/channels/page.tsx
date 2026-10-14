import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { localizeTeamName, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import {
  Tv,
  Radio,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Trophy,
  Calendar,
  Mic,
  AlertCircle,
  Globe,
  Filter,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { toChannelSlug, BroadcastDataStatus } from '@/lib/channels/catalog';
import styles from './channels.module.css';

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'دليل القنوات الناقلة — مواعيد البث المباشر والمعلقين', 'Live Sports TV Channels & Broadcast Schedules'),
    description: pick(
      locale,
      'دليل القنوات الناقلة للمباريات في يلا سبورت: جدول البث المباشر المعتمد، القنوات الرياضية، المعلقين الصوتيين، ومواعيد انطلاق المباريات.',
      'Comprehensive sports broadcast schedule on Yalla Sport: confirmed TV channels, live commentators, kickoff times, and official networks.'
    ),
    path: '/channels',
  });
}

export default async function ChannelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    date?: string;
    status?: string;
    league?: string;
    channel?: string;
    country?: string;
    sport?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const search = await searchParams;
  const ar = locale === 'ar';

  const selectedDate = (search.date || 'week').trim();
  const selectedStatus = (search.status || 'ALL').toUpperCase();
  const selectedLeagueSlug = (search.league || '').trim();
  const selectedChannelId = (search.channel || '').trim();
  const selectedCountry = (search.country || '').trim();

  // Reference dates
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const oneWeekLater = new Date(todayStart.getTime() + 8 * 24 * 60 * 60 * 1000);

  // Time window
  let timeStart = todayStart;
  let timeEnd = oneWeekLater;
  if (selectedDate === 'today') {
    timeStart = todayStart;
    timeEnd = todayEnd;
  } else if (selectedDate === 'tomorrow') {
    timeStart = tomorrowStart;
    timeEnd = tomorrowEnd;
  }

  // Construct match query
  const matchWhere: any = {
    kickoffAt: {
      gte: timeStart,
      lte: timeEnd,
    },
    channels: {
      some: {},
    },
  };

  if (selectedStatus === 'LIVE') {
    matchWhere.status = { in: ['LIVE', 'HALFTIME'] };
  } else if (selectedStatus === 'UPCOMING') {
    matchWhere.status = 'NOT_STARTED';
  } else if (selectedStatus === 'FINISHED') {
    matchWhere.status = 'FINISHED';
  }

  if (selectedLeagueSlug) {
    matchWhere.league = { slug: selectedLeagueSlug };
  }

  if (selectedChannelId) {
    matchWhere.channels = {
      some: {
        channelId: selectedChannelId,
      },
    };
  }

  if (selectedCountry) {
    matchWhere.channels = {
      some: {
        channel: {
          country: selectedCountry,
        },
      },
    };
  }

  // 1. Fetch broadcast matches with confirmed channels & commentators
  const broadcastMatches = await prisma.match
    .findMany({
      where: matchWhere,
      select: {
        id: true,
        kickoffAt: true,
        status: true,
        minute: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        league: { select: { id: true, name: true, slug: true, logoUrl: true } },
        channels: {
          select: {
            id: true,
            channel: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                country: true,
              },
            },
          },
        },
        commentators: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { kickoffAt: 'asc' },
      take: 60,
    })
    .catch(swallow('channels.broadcastMatches', []));

  // 2. Fetch all registered channels with match counts
  const channelsList = await prisma.channel
    .findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        country: true,
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    .catch(swallow('channels.channelsList', []));

  // 3. Fetch active leagues that have confirmed broadcasts
  const broadcastLeagues = await prisma.league
    .findMany({
      where: {
        matches: {
          some: {
            kickoffAt: { gte: todayStart },
            channels: { some: {} },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 12,
    })
    .catch(swallow('channels.broadcastLeagues', []));

  const countryFilters = [
    { code: 'QA', label: ar ? 'قطر (beIN)' : 'Qatar' },
    { code: 'SA', label: ar ? 'السعودية (SSC)' : 'Saudi Arabia' },
    { code: 'AE', label: ar ? 'الإمارات (أبوظبي)' : 'UAE' },
    { code: 'EG', label: ar ? 'مصر (ON Time)' : 'Egypt' },
  ];

  return (
    <main className={styles.page}>
      {/* Structured SEO Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BroadcastService',
            name: pick(locale, 'دليل القنوات الناقلة في يلا سبورت', 'Yalla Sport TV Guide'),
            broadcastDisplayName: 'Yalla Sport TV Guide',
            description: pick(
              locale,
              'جدول القنوات الرياضية الناقلة للمباريات والمواعيد الحية والمعلقين من المصادر الرسمية.',
              'Verified schedule of live match broadcast channels, commentators, and fixtures.'
            ),
          }),
        }}
      />

      <header className={styles.header}>
        <div className={styles.badge}>
          <Tv className="h-4 w-4" />
          <span>{ar ? 'دليل القنوات الناقلة المعتمد رسميًا' : 'Verified Sports Broadcast Service'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'دليل القنوات الناقلة ومواعيد البث المباشر' : 'Live Sports TV Guide & Broadcast Schedules'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تغطية رسمية وموثقة للقنوات الرياضية الناقلة، جداول البث، والمعلقين الصوتيين لكل مباراة دون اختلاق أي بيانات.'
            : 'Verified broadcast guide for live fixtures, official TV networks, and commentary teams.'}
        </p>

        {/* Professional Data Integrity Alert (Mandatory Acceptance Criterion) */}
        <div className={styles.integrityAlert}>
          <ShieldCheck className={styles.integrityIcon} />
          <div>
            <strong>{ar ? 'مبدأ الشفافية والمصداقية:' : 'Broadcast Integrity Notice:'}</strong>{' '}
            {ar
              ? 'تعتمد المنصة فقط على مصادر البث الرسمية المؤكدة. عدم إدراج قناة ناقلة لمباراة معينة لا يعني عدم وجود بث لها؛ بل يعكس حرصنا المهني على عدم اختلاق أي قناة أو تردد غير مؤكد.'
              : 'Only officially verified broadcast assignments are listed. The absence of a listed carrier does not necessarily mean no broadcast exists; it reflects our policy against publishing unconfirmed data.'}
          </div>
        </div>

        {/* Multi-Tier Filter Section */}
        <div className={styles.filtersSection}>
          {/* Date Filter */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>
              <Calendar className="inline h-3.5 w-3.5 text-orange-500 mr-1" />
              {ar ? 'التاريخ:' : 'Date:'}
            </span>
            <Link
              href={`/channels?date=today${selectedStatus !== 'ALL' ? `&status=${selectedStatus}` : ''}${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedDate === 'today' ? styles.chipActive : ''}`}
            >
              {ar ? 'مباريات اليوم' : 'Today'}
            </Link>
            <Link
              href={`/channels?date=tomorrow${selectedStatus !== 'ALL' ? `&status=${selectedStatus}` : ''}${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedDate === 'tomorrow' ? styles.chipActive : ''}`}
            >
              {ar ? 'مباريات الغد' : 'Tomorrow'}
            </Link>
            <Link
              href={`/channels?date=week${selectedStatus !== 'ALL' ? `&status=${selectedStatus}` : ''}${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedDate === 'week' ? styles.chipActive : ''}`}
            >
              {ar ? 'خلال الأسبوع' : 'This Week'}
            </Link>
          </div>

          {/* Match Status Filter */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>
              <Clock className="inline h-3.5 w-3.5 text-blue-400 mr-1" />
              {ar ? 'الحالة:' : 'Status:'}
            </span>
            <Link
              href={`/channels?date=${selectedDate}&status=ALL${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedStatus === 'ALL' ? styles.chipActive : ''}`}
            >
              {ar ? 'كافة المباريات' : 'All Matches'}
            </Link>
            <Link
              href={`/channels?date=${selectedDate}&status=LIVE${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedStatus === 'LIVE' ? styles.chipActive : ''}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse mr-1" />
              {ar ? 'مباشر الآن' : 'LIVE'}
            </Link>
            <Link
              href={`/channels?date=${selectedDate}&status=UPCOMING${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedStatus === 'UPCOMING' ? styles.chipActive : ''}`}
            >
              {ar ? 'المباريات القادمة' : 'Upcoming'}
            </Link>
            <Link
              href={`/channels?date=${selectedDate}&status=FINISHED${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${selectedStatus === 'FINISHED' ? styles.chipActive : ''}`}
            >
              {ar ? 'المنتهية' : 'Finished'}
            </Link>
          </div>

          {/* League Filter */}
          {broadcastLeagues.length > 0 && (
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>
                <Trophy className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
                {ar ? 'البطولة:' : 'League:'}
              </span>
              <Link
                href={`/channels?date=${selectedDate}&status=${selectedStatus}`}
                className={`${styles.chip} ${!selectedLeagueSlug ? styles.chipActive : ''}`}
              >
                {ar ? 'الكل' : 'All'}
              </Link>
              {broadcastLeagues.map((lg) => {
                const active = selectedLeagueSlug === lg.slug;
                return (
                  <Link
                    key={lg.id}
                    href={`/channels?date=${selectedDate}&status=${selectedStatus}&league=${lg.slug}${selectedChannelId ? `&channel=${selectedChannelId}` : ''}`}
                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  >
                    <span>{localizePlainName(locale, lg.name)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Country / Region Filter */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>
              <Globe className="inline h-3.5 w-3.5 text-emerald-400 mr-1" />
              {ar ? 'الدولة:' : 'Country:'}
            </span>
            <Link
              href={`/channels?date=${selectedDate}&status=${selectedStatus}${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
              className={`${styles.chip} ${!selectedCountry ? styles.chipActive : ''}`}
            >
              {ar ? 'كافة المناطق' : 'All Regions'}
            </Link>
            {countryFilters.map((c) => {
              const active = selectedCountry === c.code;
              return (
                <Link
                  key={c.code}
                  href={`/channels?date=${selectedDate}&status=${selectedStatus}&country=${c.code}${selectedLeagueSlug ? `&league=${selectedLeagueSlug}` : ''}`}
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* SECTION 1: BROADCAST MATCHES SCHEDULE */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Radio className="h-5 w-5 text-orange-500" />
            <span>{ar ? 'جدول المباريات المنقولة تلفزيونياً' : 'Confirmed Match Broadcasts'}</span>
          </h2>
          <span className={styles.countBadge}>
            {broadcastMatches.length} {ar ? 'مباراة مؤكدة' : 'fixtures'}
          </span>
        </div>

        {broadcastMatches.length === 0 ? (
          <div className={styles.emptyState}>
            <Tv className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
            <p>
              {ar
                ? 'لا توجد مباريات منقولة مؤكدة في هذا النطاق حالياً. يتم تحديث القنوات فور اعتمادها رسمياً.'
                : 'No confirmed broadcasts found for this filter. TV listings update continuously as carriers confirm schedules.'}
            </p>
            <Link href="/channels" className={styles.resetBtn}>
              <span>{ar ? 'عرض كافة القنوات والمباريات' : 'Reset Filters'}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className={styles.matchesGrid}>
            {broadcastMatches.map((match) => {
              const live = match.status === 'LIVE' || match.status === 'HALFTIME';
              const finished = match.status === 'FINISHED';
              const hasScore = match.homeScore != null && match.awayScore != null;
              const commentator = match.commentators[0]?.name;

              return (
                <article key={match.id} className={styles.matchCard}>
                  {/* Card Header: League & Kickoff */}
                  <div className={styles.matchTop}>
                    <Link href={`/league/${match.league.slug}`} className={styles.leagueLink}>
                      {match.league.logoUrl && (
                        <img
                          src={match.league.logoUrl}
                          alt={match.league.name}
                          className={styles.leagueLogo}
                        />
                      )}
                      <span className="truncate">{localizePlainName(locale, match.league.name)}</span>
                    </Link>

                    <div className={styles.kickoffBox}>
                      <Clock className="h-3 w-3" />
                      <ClientTime
                        value={match.kickoffAt}
                        locale={locale}
                        options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }}
                      />
                    </div>
                  </div>

                  {/* Clash: Home & Away Teams */}
                  <div className={styles.clashArea}>
                    <div className={styles.teamRow}>
                      <div className={styles.teamHead}>
                        {match.homeTeam.logoUrl ? (
                          <img
                            src={match.homeTeam.logoUrl}
                            alt={match.homeTeam.name}
                            className={styles.crest}
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                            {match.homeTeam.name.charAt(0)}
                          </div>
                        )}
                        <Link href={`/team/${match.homeTeam.slug}`} className={styles.teamLink}>
                          {localizeTeamName(locale, match.homeTeam.name)}
                        </Link>
                      </div>
                      {hasScore ? <span className={styles.scoreDigit}>{match.homeScore}</span> : null}
                    </div>

                    <div className={styles.teamRow}>
                      <div className={styles.teamHead}>
                        {match.awayTeam.logoUrl ? (
                          <img
                            src={match.awayTeam.logoUrl}
                            alt={match.awayTeam.name}
                            className={styles.crest}
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                            {match.awayTeam.name.charAt(0)}
                          </div>
                        )}
                        <Link href={`/team/${match.awayTeam.slug}`} className={styles.teamLink}>
                          {localizeTeamName(locale, match.awayTeam.name)}
                        </Link>
                      </div>
                      {hasScore ? <span className={styles.scoreDigit}>{match.awayScore}</span> : null}
                    </div>
                  </div>

                  {/* Broadcasting Channels & Commentator */}
                  <div className={styles.broadcastMeta}>
                    <div className={styles.channelBadgesRow}>
                      {match.channels.map(({ channel: ch }) => {
                        const slug = toChannelSlug(ch.name);
                        return (
                          <Link
                            key={ch.id}
                            href={`/channel/${slug}`}
                            className={styles.channelLink}
                            title={ar ? `عرض دليل وترددات ${ch.name}` : `View ${ch.name} profile & frequencies`}
                          >
                            <Tv className="h-3 w-3" />
                            <span>{ch.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {commentator && (
                      <div className={styles.commentatorRow}>
                        <Mic className="h-3 w-3 text-amber-400 shrink-0" />
                        <span>{ar ? 'المعلق:' : 'Commentator:'}</span>
                        <span className={styles.commentatorName}>{commentator}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Status & Match Center Link */}
                  <div className={styles.cardBottom}>
                    <div className={styles.statusIndicator}>
                      {live ? (
                        <span className={styles.statusLive}>
                          <span className={styles.liveDot} />
                          <span>{match.minute ? `${match.minute}′ مباشر` : (ar ? 'مباشر الآن' : 'LIVE')}</span>
                        </span>
                      ) : finished ? (
                        <span>{ar ? 'نهاية المباراة' : 'Full Time'}</span>
                      ) : (
                        <span className={styles.statusAvailable}>
                          ✓ {ar ? 'البث مؤكد' : 'Confirmed'}
                        </span>
                      )}
                    </div>

                    <Link href={`/match/${match.id}`} className={styles.matchCenterBtn}>
                      <span>{ar ? 'مركز المباراة' : 'Match Center'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: CHANNELS DIRECTORY */}
      {channelsList.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              <Tv className="h-5 w-5 text-blue-400" />
              <span>{ar ? 'دليل القنوات والشبكات الرياضية' : 'Sports TV Channels Directory'}</span>
            </h2>
            <span className={styles.countBadge}>
              {channelsList.length} {ar ? 'قناة' : 'channels'}
            </span>
          </div>

          <div className={styles.directoryGrid}>
            {channelsList.map((ch) => {
              const slug = toChannelSlug(ch.name);
              return (
                <Link
                  key={ch.id}
                  href={`/channel/${slug}`}
                  className={styles.channelDirectoryCard}
                >
                  <div className={styles.channelLogoWrap}>
                    {ch.logoUrl ? (
                      <img src={ch.logoUrl} alt={ch.name} />
                    ) : (
                      <Tv className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div className={styles.channelMeta}>
                    <h3 className={styles.channelName}>{ch.name}</h3>
                    <span className={styles.channelCountry}>
                      {ch.country ? (ar ? `دولة البث: ${ch.country}` : `Territory: ${ch.country}`) : (ar ? 'شبكة رياضية معتمدة' : 'Verified Sports Network')}
                    </span>
                    {ch._count.matches > 0 && (
                      <span className={styles.matchesBadge}>
                        {ch._count.matches} {ar ? 'مباراة منقولة' : 'broadcasts'}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
