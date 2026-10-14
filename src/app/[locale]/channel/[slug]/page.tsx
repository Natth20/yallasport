import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  Clock,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Mic,
  Satellite,
  Globe,
  Trophy,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import {
  toChannelSlug,
  findChannelBySlugOrId,
  VERIFIED_CHANNEL_FREQUENCIES,
} from '@/lib/channels/catalog';
import styles from './channel.module.css';

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const channel = await findChannelBySlugOrId(slug);
  if (!channel) return { title: 'Channel Not Found' };

  return pageMetadata({
    locale,
    title: pick(
      locale,
      `تردد قناة ${channel.name} — جدول المباريات المنقولة والمعلقين`,
      `${channel.name} TV Frequencies & Broadcast Schedule`
    ),
    description: pick(
      locale,
      `دليل قناة ${channel.name} الرياضية في يلا سبورت: جدول المباريات المنقولة مباشرة، ترددات الأقمار الصناعية (نايل سات وعرب سات)، وقائمة المعلقين.`,
      `Official guide for ${channel.name}: upcoming match broadcasts, satellite frequencies, and live football coverage on Yalla Sport.`
    ),
    path: `/channel/${slug}`,
  });
}

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  const channel = await findChannelBySlugOrId(slug);
  if (!channel) {
    notFound();
  }

  const canonicalSlug = toChannelSlug(channel.name);
  const frequencies = VERIFIED_CHANNEL_FREQUENCIES[canonicalSlug] || [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Upcoming matches on this channel
  const upcomingMatches = await prisma.match
    .findMany({
      where: {
        kickoffAt: { gte: todayStart },
        channels: {
          some: {
            channelId: channel.id,
          },
        },
      },
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
        commentators: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { kickoffAt: 'asc' },
      take: 24,
    })
    .catch(swallow('channel.upcomingMatches', []));

  // 2. Recent finished matches on this channel
  const pastMatches = await prisma.match
    .findMany({
      where: {
        kickoffAt: { lt: todayStart },
        channels: {
          some: {
            channelId: channel.id,
          },
        },
      },
      select: {
        id: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        league: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { kickoffAt: 'desc' },
      take: 12,
    })
    .catch(swallow('channel.pastMatches', []));

  return (
    <main className={styles.page}>
      {/* Schema.org BroadcastChannel */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BroadcastChannel',
            name: channel.name,
            broadcastServiceTier: 'Free/Paid Tier',
            genre: 'Sports',
          }),
        }}
      />

      {/* Hero Card */}
      <section className={styles.channelHero}>
        <div className={styles.heroContent}>
          <div className={styles.channelLogo}>
            {channel.logoUrl ? (
              <img src={channel.logoUrl} alt={channel.name} />
            ) : (
              <Tv className="h-10 w-10 text-blue-400" />
            )}
          </div>

          <div className={styles.channelInfo}>
            <h1 className={styles.channelTitle}>{channel.name}</h1>
            <div className={styles.channelMetaRow}>
              <span className={styles.channelBadge}>
                <Radio className="h-3 w-3" />
                <span>{ar ? 'قناة رياضية معتمدة' : 'Official Sports Carrier'}</span>
              </span>
              {channel.country && (
                <span className={styles.countryBadge}>
                  <Globe className="h-3 w-3" />
                  <span>{ar ? `دولة المنشأ: ${channel.country}` : `Country: ${channel.country}`}</span>
                </span>
              )}
              <span className={styles.countryBadge}>
                <span>{upcomingMatches.length} {ar ? 'مباراة مجدولة' : 'upcoming broadcasts'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.navRow}>
          <Link href="/channels" className={styles.backLink}>
            {ar ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{ar ? 'العودة لكافة القنوات وجداول البث' : 'Back to TV Channels Directory'}</span>
          </Link>
        </div>
      </section>

      {/* SECTION 1: SATELLITE FREQUENCIES (VERIFIED DATA ONLY) */}
      <section className={styles.frequencySection}>
        <h2 className={styles.sectionTitle}>
          <Satellite className="h-5 w-5 text-blue-400" />
          <span>{ar ? `ترددات واستقبال قناة ${channel.name}` : `${channel.name} Satellite Frequencies`}</span>
        </h2>

        {frequencies.length > 0 ? (
          <div className={styles.freqTableWrapper}>
            <table className={styles.freqTable}>
              <thead>
                <tr>
                  <th>{ar ? 'القمر الصناعي' : 'Satellite'}</th>
                  <th>{ar ? 'التردد' : 'Frequency'}</th>
                  <th>{ar ? 'الاستقطاب' : 'Polarization'}</th>
                  <th>{ar ? 'معدل الترميز' : 'Symbol Rate'}</th>
                  <th>{ar ? 'معامل التصحيح' : 'FEC'}</th>
                  <th>{ar ? 'التشفير' : 'Access'}</th>
                </tr>
              </thead>
              <tbody>
                {frequencies.map((f, i) => (
                  <tr key={i}>
                    <td>{ar ? f.satelliteAr : f.satellite}</td>
                    <td><strong className="text-orange-500 font-mono">{f.frequency}</strong></td>
                    <td>{f.polarization === 'H' ? (ar ? 'أفقي (H)' : 'Horizontal') : (ar ? 'عمودي (V)' : 'Vertical')}</td>
                    <td className="font-mono">{f.symbolRate}</td>
                    <td className="font-mono">{f.fec}</td>
                    <td>{ar ? f.encryptionAr : f.encryption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
            <p>
              {ar
                ? 'ترددات البث الفضائي لهذه القناة قيد المراجعة والاعتماد من المصدر الرسمي لتجنب نشر ترددات قديمة أو غير دقيقة.'
                : 'Satellite parameters for this carrier are being updated from the official broadcast licensing registry.'}
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: UPCOMING MATCHES ON THIS CHANNEL */}
      <section className="mb-12">
        <h2 className={styles.sectionTitle}>
          <Calendar className="h-5 w-5 text-orange-500" />
          <span>{ar ? `المباريات القادمة المنقولة عبر ${channel.name}` : `Upcoming Live Broadcasts on ${channel.name}`}</span>
        </h2>

        {upcomingMatches.length === 0 ? (
          <div className={styles.emptyBox}>
            <Tv className="h-8 w-8 mx-auto opacity-40 mb-2" />
            <p>{ar ? 'لا توجد مباريات مجدولة للبث على هذه القناة في الأيام القادمة حالياً.' : 'No upcoming fixtures currently confirmed for this channel.'}</p>
            <Link href="/channels" className="text-xs text-orange-500 font-bold hover:underline mt-2 inline-block">
              {ar ? 'عرض كافة مباريات القنوات الأخرى' : 'Browse other channel schedules'}
            </Link>
          </div>
        ) : (
          <div className={styles.matchesGrid}>
            {upcomingMatches.map((match) => {
              const live = match.status === 'LIVE' || match.status === 'HALFTIME';
              const commentator = match.commentators[0]?.name;

              return (
                <article key={match.id} className={styles.matchCard}>
                  <div className={styles.matchTop}>
                    <Link href={`/league/${match.league.slug}`} className={styles.leagueLink}>
                      {match.league.logoUrl && (
                        <img src={match.league.logoUrl} alt="" className="h-4 w-4 object-contain" />
                      )}
                      <span>{localizePlainName(locale, match.league.name)}</span>
                    </Link>

                    <div className={styles.kickoffTime}>
                      <Clock className="h-3 w-3" />
                      <ClientTime
                        value={match.kickoffAt}
                        locale={locale}
                        options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className={styles.teamRow}>
                      <div className={styles.teamHead}>
                        {match.homeTeam.logoUrl && (
                          <img src={match.homeTeam.logoUrl} alt="" className={styles.crest} />
                        )}
                        <Link href={`/team/${match.homeTeam.slug}`} className={styles.teamTitle}>
                          {localizeTeamName(locale, match.homeTeam.name)}
                        </Link>
                      </div>
                      {match.homeScore != null && <span className={styles.scoreDigit}>{match.homeScore}</span>}
                    </div>

                    <div className={styles.teamRow}>
                      <div className={styles.teamHead}>
                        {match.awayTeam.logoUrl && (
                          <img src={match.awayTeam.logoUrl} alt="" className={styles.crest} />
                        )}
                        <Link href={`/team/${match.awayTeam.slug}`} className={styles.teamTitle}>
                          {localizeTeamName(locale, match.awayTeam.name)}
                        </Link>
                      </div>
                      {match.awayScore != null && <span className={styles.scoreDigit}>{match.awayScore}</span>}
                    </div>
                  </div>

                  <div className={styles.matchFooter}>
                    {commentator ? (
                      <div className={styles.commentatorTag}>
                        <Mic className="h-3 w-3 text-amber-400" />
                        <span>{ar ? 'المعلق:' : 'Commentary:'} <strong>{commentator}</strong></span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {live ? (ar ? 'مباشر الآن' : 'LIVE') : (ar ? 'البث مؤكد' : 'Confirmed')}
                      </span>
                    )}

                    <Link href={`/match/${match.id}`} className={styles.detailsBtn}>
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

      {/* SECTION 3: RECENT BROADCAST ARCHIVE */}
      {pastMatches.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <span>{ar ? `سجل المباريات المنقولة سابقاً على ${channel.name}` : `Recent Broadcast Archive on ${channel.name}`}</span>
          </h2>

          <div className={styles.matchesGrid}>
            {pastMatches.map((match) => (
              <article key={match.id} className={styles.matchCard}>
                <div className={styles.matchTop}>
                  <Link href={`/league/${match.league.slug}`} className={styles.leagueLink}>
                    <span>{localizePlainName(locale, match.league.name)}</span>
                  </Link>
                  <ClientTime value={match.kickoffAt} variant="day" className="text-xs text-muted-foreground" />
                </div>

                <div>
                  <div className={styles.teamRow}>
                    <span className={styles.teamTitle}>{localizeTeamName(locale, match.homeTeam.name)}</span>
                    <span className={styles.scoreDigit}>{match.homeScore ?? '-'}</span>
                  </div>
                  <div className={styles.teamRow}>
                    <span className={styles.teamTitle}>{localizeTeamName(locale, match.awayTeam.name)}</span>
                    <span className={styles.scoreDigit}>{match.awayScore ?? '-'}</span>
                  </div>
                </div>

                <div className={styles.matchFooter}>
                  <span className="text-[11px] font-bold text-muted-foreground">{ar ? 'نهاية المباراة' : 'FT'}</span>
                  <Link href={`/match/${match.id}`} className={styles.detailsBtn}>
                    <span>{ar ? 'التقرير والإحصائيات' : 'Recap'}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
