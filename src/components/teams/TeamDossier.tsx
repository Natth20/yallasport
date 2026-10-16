'use client';

import React, { useMemo, useState } from 'react';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { FollowButton } from '@/components/common/FollowButton';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  FileText,
  Flame,
  Info,
  Layers,
  MapPin,
  Newspaper,
  Repeat,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  User,
  Users,
  Zap,
} from 'lucide-react';
import type {
  SquadGroupKey,
  TeamDossierData,
} from '@/lib/teams/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';
import board from '@/components/teams/team-salon.module.css';
import { EditorialNewsSixGrid } from '@/components/news/EditorialNewsSixGrid';

type SquadFilter = SquadGroupKey | 'ALL';
const SQUAD_ORDER: SquadGroupKey[] = ['GK', 'DF', 'MF', 'FW', 'OTHER'];

function squadLabel(key: SquadGroupKey, locale: string) {
  switch (key) {
    case 'GK':
      return pick(locale, 'حراس المرمى', 'Goalkeepers');
    case 'DF':
      return pick(locale, 'خط الدفاع', 'Defenders');
    case 'MF':
      return pick(locale, 'خط الوسط', 'Midfielders');
    case 'FW':
      return pick(locale, 'خط الهجوم', 'Attackers');
    default:
      return pick(locale, 'لاعبون آخرون', 'Other');
  }
}

function goalDiffLabel(diff: number) {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

function slugTailId(slug?: string | null) {
  return slug?.match(/(\d+)$/)?.[1] ?? null;
}

function playerShot(photoUrl?: string | null, slug?: string | null) {
  return apiSportsPlayerPhoto(slugTailId(slug), photoUrl);
}

function decodeHtmlEntities(value: unknown) {
  if (typeof value !== 'string') return value == null ? '' : String(value);
  return value
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function TeamDossier({
  locale,
  dossier,
  loggedIn,
  isFollowing,
}: {
  locale: string;
  now: string | Date;
  dossier: TeamDossierData;
  loggedIn: boolean;
  isFollowing: boolean;
}) {
  const {
    team,
    squad,
    squadCount,
    liveMatches,
    upcoming,
    recentResults,
    nextMatch,
    formTrail,
    standing,
    stats,
    homeStats,
    awayStats,
    competitions,
    scorers,
    assisters,
    discipline,
    transfers,
    news,
    tableWindow,
    seasonSlice,
    availableSeasons = [],
    selectedSeason,
    selectedLeagueSlug,
    sectionStatus,
  } = dossier;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSeasonChange = (season: string) => {
    const next = new URLSearchParams(searchParams?.toString() || '');
    if (season) next.set('season', season);
    else next.delete('season');
    const qs = next.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as any);
  };

  const handleLeagueChange = (leagueSlug: string) => {
    const next = new URLSearchParams(searchParams?.toString() || '');
    if (leagueSlug) next.set('league', leagueSlug);
    else next.delete('league');
    const qs = next.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as any);
  };

  const [squadFilter, setSquadFilter] = useState<SquadFilter>('ALL');
  const [transfersTab, setTransfersTab] = useState<'in' | 'out'>('in');

  const availableFormations = useMemo(() => {
    const list = (seasonSlice?.formations || []).map((f) => f.formation);
    if (!list.includes('4-3-3')) list.push('4-3-3');
    if (!list.includes('4-2-3-1')) list.push('4-2-3-1');
    if (!list.includes('4-4-2')) list.push('4-4-2');
    return list;
  }, [seasonSlice]);

  const [tacticalFormation, setTacticalFormation] = useState<string>(
    seasonSlice?.formations?.[0]?.formation || '4-3-3'
  );

  const startingXI = useMemo(() => {
    const parts = tacticalFormation
      .split('-')
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n) && n > 0);

    const defCount = parts[0] || 4;
    const midCount = parts[1] || 3;
    const fwdCount = parts.slice(2).reduce((a, b) => a + b, 0) || 3;

    const gk = (squad.GK || []).slice(0, 1);
    const df = (squad.DF || []).slice(0, defCount);
    const mf = (squad.MF || []).slice(0, midCount);
    const fw = (squad.FW || []).slice(0, fwdCount);

    return { gk, df, mf, fw };
  }, [tacticalFormation, squad]);

  const name = localizePlainName(locale, team.name);
  const country = team.country ? localizePlainName(locale, team.country) : null;
  const venue = team.venue
    ? {
      ...team.venue,
      name: decodeHtmlEntities(team.venue.name),
      city: team.venue.city ? decodeHtmlEntities(team.venue.city) : null,
      address: team.venue.address ? decodeHtmlEntities(team.venue.address) : null,
      surface: team.venue.surface ? decodeHtmlEntities(team.venue.surface) : null,
    }
    : null;

  // Flattened squad by position
  const squadChapters = SQUAD_ORDER.map((key) => ({ key, players: squad[key] || [] })).filter(
    (chapter) => chapter.players.length > 0,
  );

  const displayedSquad = useMemo(() => {
    if (squadFilter === 'ALL') return squadChapters.flatMap((c) => c.players);
    return squad[squadFilter] || [];
  }, [squadFilter, squad, squadChapters]);

  // Transfers in and out
  const transfersIn = useMemo(() => {
    return transfers.filter((t) => !t.toTeam || t.toTeam.toLowerCase().includes(team.name.toLowerCase()));
  }, [transfers, team.name]);

  const transfersOut = useMemo(() => {
    return transfers.filter((t) => t.fromTeam && t.fromTeam.toLowerCase().includes(team.name.toLowerCase()));
  }, [transfers, team.name]);

  const displayedTransfers = transfersTab === 'in' ? (transfersIn.length > 0 ? transfersIn : transfers) : transfersOut;

  // Top Performers
  const topScorer = scorers[0] || null;
  const topAssister = assisters[0] || null;

  const allSquadPlayers = useMemo(() => squadChapters.flatMap((c) => c.players), [squadChapters]);

  const resolvePlayerShot = (photoUrl?: string | null, slug?: string | null, rawName?: string | null) => {
    const direct = playerShot(photoUrl, slug);
    if (direct) return direct;
    if (rawName) {
      const clean = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = allSquadPlayers.find((entry) => {
        const pClean = entry.player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pClean.includes(clean) || clean.includes(pClean);
      });
      if (match) return playerShot(match.player.photoUrl, match.player.slug);
    }
    return null;
  };

  const resolvePlayerSlug = (slug?: string | null, rawName?: string | null) => {
    if (slug) return slug;
    if (rawName) {
      const clean = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = allSquadPlayers.find((entry) => {
        const pClean = entry.player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pClean.includes(clean) || clean.includes(pClean);
      });
      if (match) return match.player.slug;
    }
    return null;
  };

  // Live match
  const activeLiveMatch = liveMatches[0] || null;

  return (
    <div className={board.teamPage}>
      {/* =========================================================================
          1. MEGA ROYAL HERO STAGE
          ========================================================================= */}
      <section className={board.hero} aria-label={name}>
        <div className={board.heroAura} aria-hidden />
        <div className={board.heroGrid} aria-hidden />
        {venue?.imageUrl ? (
          <img src={venue.imageUrl} alt="" className={board.heroPhoto} aria-hidden />
        ) : null}

        <div className={board.heroInner}>
          {/* Breadcrumb & Live Strip */}
          <div className={board.heroTop}>
            <div className={board.crumb}>
              <Link href="/">{pick(locale, 'الرئيسية', 'Home')}</Link>
              <span>/</span>
              <Link href="/matches">{pick(locale, 'الأندية الرياضية', 'Football Clubs')}</Link>
              <span>/</span>
              <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {activeLiveMatch ? (
                <Link
                  href={`/match/${activeLiveMatch.id}`}
                  className={styles.liveBadge}
                  style={{ textDecoration: 'none' }}
                >
                  <span className={styles.liveDot} />
                  <span>{pick(locale, 'مباراة مباشرة الآن', 'Match Live Now')}</span>
                </Link>
              ) : null}

              <FollowButton
                entityId={team.id}
                entityType="TEAM"
                isLoggedIn={loggedIn}
                initialIsFollowing={isFollowing}
                variant="ghost"
              />
            </div>
          </div>

          {/* Hero Core */}
          <div className={board.heroStage}>
            {/* Club Crest Shield */}
            <div className={board.crestWrap}>
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={name} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
                  {name.charAt(0)}
                </div>
              )}

              {standing ? (
                <span className={board.rankBadge}>
                  #{standing.rank}
                </span>
              ) : null}
            </div>

            {/* Club Info Details */}
            <div className={board.heroCopy}>
              <p className={board.kicker}>
                {country ? `${country} · ` : ''}
                {team.code ? `${team.code} · ` : ''}
                {pick(locale, 'نادي رياضي رسمي', 'Official Football Club')}
              </p>

              <h1>{name}</h1>

              {/* Badges Ribbon */}
              <div className={board.chips}>
                {standing ? (
                  <span className={board.chip}>
                    <Trophy size={13} style={{ marginInlineEnd: '0.35rem', color: '#eab308' }} />
                    #{standing.rank} {localizePlainName(locale, standing.league.name)} · {standing.points} {pick(locale, 'نقطة', 'pts')}
                  </span>
                ) : null}

                {team.founded ? (
                  <span className={board.chip}>
                    <Calendar size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {pick(locale, `تأسس عام ${team.founded}`, `Est. ${team.founded}`)}
                  </span>
                ) : null}

                {venue?.name ? (
                  <span className={board.chip}>
                    <MapPin size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {venue.name} {venue.city ? `(${venue.city})` : ''}
                  </span>
                ) : null}

                {team.coach?.name ? (
                  <Link
                    href={team.coach.slug ? `/coach/${team.coach.slug}` : '#'}
                    className={board.chipLink}
                  >
                    <User size={13} style={{ marginInlineEnd: '0.35rem', color: 'var(--ys-orange)' }} />
                    {pick(locale, 'المدرب:', 'Coach:')} {localizePlainName(locale, team.coach.name)}
                  </Link>
                ) : null}

                {squadCount > 0 ? (
                  <span className={board.chip}>
                    <Users size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {squadCount} {pick(locale, 'لاعباً في القائمة', 'Squad Players')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MASTER CONTENT DASHBOARD (THEME-NATIVE & RESPONSIVE)
          ========================================================================= */}
      <main style={{ maxWidth: '1320px', margin: '2rem auto 0', padding: '0 1rem', display: 'grid', gap: '2rem' }}>

        {/* =========================================================================
            SEASON & COMPETITION CONTROL BAR
            ========================================================================= */}
        <section
          aria-label={pick(locale, 'تصفية الموسم والبطولة', 'Season & Competition Filter')}
          className={board.glassCard}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '1rem',
            border: '1px solid color-mix(in srgb, var(--ys-orange) 20%, var(--border))',
            background: 'color-mix(in srgb, var(--card) 85%, transparent)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
              <SlidersHorizontal size={15} />
              {pick(locale, 'تصفية البيانات:', 'Filter View:')}
            </span>

            {/* Season Selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 700 }}>
                {pick(locale, 'الموسم:', 'Season:')}
              </span>
              <select
                value={selectedSeason || ''}
                onChange={(e) => handleSeasonChange(e.target.value)}
                style={{
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableSeasons.map((s) => (
                  <option key={s} value={s}>
                    {s} - {parseInt(s, 10) + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Competitions Selector */}
            {competitions && competitions.length > 0 ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 700 }}>
                  {pick(locale, 'البطولة:', 'League:')}
                </span>
                <select
                  value={selectedLeagueSlug || ''}
                  onChange={(e) => handleLeagueChange(e.target.value)}
                  style={{
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '220px',
                  }}
                >
                  <option value="">{pick(locale, 'جميع البطولات', 'All Competitions')}</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {localizePlainName(locale, c.name)} ({c.matches})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Quick status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontWeight: 800,
              background: 'color-mix(in srgb, #22c55e 15%, transparent)',
              color: '#22c55e',
            }}>
              <CheckCircle2 size={12} />
              {pick(locale, 'بيانات معتمدة ومحدثة', 'Verified Data')}
            </span>
            {(selectedSeason || selectedLeagueSlug) ? (
              <button
                type="button"
                onClick={() => {
                  router.push(pathname as any);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  textDecoration: 'underline',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {pick(locale, 'إلغاء التصفية', 'Reset Filter')}
              </button>
            ) : null}
          </div>
        </section>

        {/* ----------------- ROW 1: NEXT MATCH & RECENT FORM SPOTLIGHT ----------------- */}
        <div id="fixtures" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', scrollMarginTop: '6rem' }}>
          {/* Next Match Card */}
          <div className={board.spotlightCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--ys-orange)', color: '#111', fontSize: '0.72rem', fontWeight: 900, padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                <Clock size={12} />
                {pick(locale, 'المباراة القادمة', 'Next Match')}
              </span>

              {nextMatch ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>
                  {localizePlainName(locale, nextMatch.league.name)}
                </span>
              ) : null}
            </div>

            {nextMatch ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <LeagueCrest name={nextMatch.homeTeam.name} logoUrl={nextMatch.homeTeam.logoUrl} className="h-14 w-14 object-contain" />
                    <strong style={{ fontSize: '0.9rem', fontWeight: 800 }}>{localizePlainName(locale, nextMatch.homeTeam.name)}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ys-orange)', background: 'color-mix(in srgb, var(--foreground) 6%, var(--card))', padding: '0.4rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                      {pick(locale, 'ضد', 'VS')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <LeagueCrest name={nextMatch.awayTeam.name} logoUrl={nextMatch.awayTeam.logoUrl} className="h-14 w-14 object-contain" />
                    <strong style={{ fontSize: '0.9rem', fontWeight: 800 }}>{localizePlainName(locale, nextMatch.awayTeam.name)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    <ClientTime value={nextMatch.kickoffAt} locale={locale} options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
                  </div>

                  <Link
                    href={`/match/${nextMatch.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ys-orange)', fontSize: '0.8rem', fontWeight: 900, textDecoration: 'none' }}
                  >
                    <span>{pick(locale, 'مركز المباراة', 'Match Center')}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', margin: '2rem 0' }}>
                {pick(locale, 'لا توجد مواعيد مباريات قادمة مجدولة حالياً.', 'No upcoming matches scheduled currently.')}
              </p>
            )}
          </div>

          {/* 5-Match Form Ribbon */}
          <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--foreground)' }}>
                📈 {pick(locale, 'شريط نتائج المباريات الأخيرة', 'Recent Form Guide')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                {pick(locale, 'آخر 5 مباريات', 'Last 5 Matches')}
              </span>
            </div>

            {formTrail.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem' }}>
                {formTrail.slice(0, 5).map((f, i) => (
                  <Link
                    key={`${f.matchId}-${i}`}
                    href={`/match/${f.matchId}`}
                    style={{
                      background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                      border: '1px solid var(--border)',
                      borderRadius: '0.85rem',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <LeagueCrest name={f.opponent.name} logoUrl={f.opponent.logoUrl} className="h-6 w-6" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                      {localizePlainName(locale, f.opponent.name)}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--foreground)' }}>
                      {f.homeScore} - {f.awayScore}
                    </span>
                    <span className={`${styles.formPill} ${f.letter === 'W' ? styles.formPillW : f.letter === 'L' ? styles.formPillL : styles.formPillD}`} style={{ margin: '0 auto' }}>
                      {f.letter === 'W' ? pick(locale, 'ف', 'W') : f.letter === 'D' ? pick(locale, 'ت', 'D') : pick(locale, 'خ', 'L')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                {pick(locale, 'سجل النتائج السابقة غير متوفر حالياً.', 'Recent form not available.')}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <span>🟢 {pick(locale, 'فوز', 'Win')}</span>
              <span>🟡 {pick(locale, 'تعادل', 'Draw')}</span>
              <span>🔴 {pick(locale, 'خسارة', 'Loss')}</span>
            </div>
          </div>
        </div>

        {/* ----------------- ROW 2: FULL SEASON KPIS & RECORD METERS ----------------- */}
        <div className={board.glassCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--ys-orange)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'إحصاءات وأرقام النادي لهذا الموسم', 'Season Performance Analytics')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'مباريات ملعوبة', 'Matches Played')}</span>
              <strong className={board.statBoxValue}>{stats.played}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: '#16a34a' }}>{pick(locale, 'الانتصارات', 'Wins')}</span>
              <strong className={board.statBoxValue} style={{ color: '#16a34a' }}>{stats.won}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: '#ca8a04' }}>{pick(locale, 'التعادلات', 'Draws')}</span>
              <strong className={board.statBoxValue} style={{ color: '#ca8a04' }}>{stats.drawn}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: '#dc2626' }}>{pick(locale, 'الهزائم', 'Losses')}</span>
              <strong className={board.statBoxValue} style={{ color: '#dc2626' }}>{stats.lost}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'أهداف له / عليه', 'GF : GA')}</span>
              <strong className={board.statBoxValue}>{stats.goalsFor} : {stats.goalsAgainst}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'فارق الأهداف', 'Goal Diff')}</span>
              <strong className={board.statBoxValue} style={{ color: stats.goalDiff > 0 ? '#16a34a' : stats.goalDiff < 0 ? '#dc2626' : 'inherit' }}>
                {goalDiffLabel(stats.goalDiff)}
              </strong>
            </div>

            {stats.winPct != null ? (
              <div className={board.statBox}>
                <span className={board.statBoxTitle} style={{ color: 'var(--ys-orange)' }}>{pick(locale, 'نسبة الفوز', 'Win Rate')}</span>
                <strong className={board.statBoxValue} style={{ color: 'var(--ys-orange)' }}>{stats.winPct}%</strong>
              </div>
            ) : null}
          </div>

          {/* Home vs Away Mini Split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>{pick(locale, 'سجل المباريات داخل الديار', 'Home Record')}</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{homeStats.won} {pick(locale, 'فوز', 'W')} · {homeStats.drawn} {pick(locale, 'تعادل', 'D')} · {homeStats.lost} {pick(locale, 'خسارة', 'L')}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>{pick(locale, 'سجل المباريات خارج الديار', 'Away Record')}</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{awayStats.won} {pick(locale, 'فوز', 'W')} · {awayStats.drawn} {pick(locale, 'تعادل', 'D')} · {awayStats.lost} {pick(locale, 'خسارة', 'L')}</strong>
            </div>
          </div>
        </div>

        {/* ----------------- ROW 3: TOP PERFORMERS & ACTIVE COMPETITIONS ----------------- */}
        {topScorer || topAssister || competitions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Top Scorer Card */}
            {topScorer ? (
              <div className={board.glassCard} style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                <div style={{ width: '4.75rem', height: '4.75rem', borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--ys-orange) 15%, var(--muted)), var(--card))', border: '2.5px solid color-mix(in srgb, var(--ys-orange) 45%, var(--border))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {resolvePlayerShot(topScorer.photoUrl, topScorer.slug, topScorer.name) ? (
                    <img src={resolvePlayerShot(topScorer.photoUrl, topScorer.slug, topScorer.name)!} alt={topScorer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
                      {topScorer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ys-orange)' }}>
                    {pick(locale, 'هداف النادي', 'Top Goalscorer')}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', fontWeight: 900, margin: '0.2rem 0' }}>
                    {resolvePlayerSlug(topScorer.slug, topScorer.name) ? (
                      <Link href={`/player/${resolvePlayerSlug(topScorer.slug, topScorer.name)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {localizePlainName(locale, topScorer.name)}
                      </Link>
                    ) : (
                      localizePlainName(locale, topScorer.name)
                    )}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                    {topScorer.goals} {pick(locale, 'أهداف مسجلة', 'Goals Scored')}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Top Assister Card */}
            {topAssister ? (
              <div className={board.glassCard} style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                <div style={{ width: '4.75rem', height: '4.75rem', borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%, color-mix(in srgb, #0284c7 15%, var(--muted)), var(--card))', border: '2.5px solid color-mix(in srgb, #0284c7 45%, var(--border))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {resolvePlayerShot(topAssister.photoUrl, topAssister.slug, topAssister.name) ? (
                    <img src={resolvePlayerShot(topAssister.photoUrl, topAssister.slug, topAssister.name)!} alt={topAssister.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: '#0284c7' }}>
                      {topAssister.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: '#0284c7' }}>
                    🎯 {pick(locale, 'صانع ألعاب الفريق', 'Top Playmaker')}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.05rem', fontWeight: 900, margin: '0.2rem 0' }}>
                    {resolvePlayerSlug(topAssister.slug, topAssister.name) ? (
                      <Link href={`/player/${resolvePlayerSlug(topAssister.slug, topAssister.name)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {localizePlainName(locale, topAssister.name)}
                      </Link>
                    ) : (
                      localizePlainName(locale, topAssister.name)
                    )}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                    {topAssister.assists} {pick(locale, 'تمريرات حاسمة', 'Assists Made')}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Active Tournaments */}
            {competitions.length > 0 ? (
              <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                  {pick(locale, 'البطولات المشارك بها', 'Competitions')}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {competitions.map((c) => (
                    <Link
                      key={c.id}
                      href={`/league/${c.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                        border: '1px solid var(--border)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <LeagueCrest name={c.name} logoUrl={c.logoUrl} className="h-4 w-4" />
                      <span>{localizePlainName(locale, c.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ----------------- ROW 4: 2D TACTICAL STARTING XI PITCH ----------------- */}
        <section id="squad" className={board.glassCard} style={{ scrollMarginTop: '6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                <Compass size={18} style={{ color: 'var(--ys-orange)' }} />
                {pick(locale, 'التشكيلة الأساسية ونظام اللعب التكتيكي', 'Tactical Formation & Starting Lineup')}
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                {pick(locale, 'توزيع اللاعبين الأساسيين على أرضية الملعب وفق الخطة التكتيكية الأكثر استخداماً.', 'Starting eleven tactical deployment on the pitch.')}
              </p>
            </div>

            {/* Formation Selector Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', marginInlineEnd: '0.35rem' }}>
                {pick(locale, 'الخطة التكتيكية:', 'System:')}
              </span>
              {availableFormations.map((fmt) => {
                const matchCount = seasonSlice?.formations?.find((f) => f.formation === fmt)?.played;
                const isSelected = tacticalFormation === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTacticalFormation(fmt)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: isSelected ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 4%, var(--card))',
                      color: isSelected ? '#111' : 'var(--foreground)',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>{fmt}</span>
                    {matchCount ? (
                      <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>({matchCount})</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* The Pitch */}
          <div className={board.pitchContainer}>
            <div className={board.pitchMarkings}>
              <div className={board.pitchPenaltyBoxTop}>
                <div className={board.pitchGoalBoxTop} />
              </div>
              <div className={board.pitchHalfwayLine} />
              <div className={board.pitchCenterCircle}>
                <div className={board.pitchCenterSpot} />
              </div>
              <div className={board.pitchPenaltyBoxBottom}>
                <div className={board.pitchGoalBoxBottom} />
              </div>
            </div>

            {/* 1. Goalkeeper */}
            {startingXI.gk.map((item) => {
              const shot = resolvePlayerShot(item.player.photoUrl, item.player.slug, item.player.name);
              return (
                <Link
                  key={item.id}
                  href={`/player/${item.player.slug}`}
                  className={board.pitchNode}
                  style={{ bottom: '8%', left: '50%' }}
                >
                  <div className={board.pitchNodeAvatar}>
                    {shot ? <img src={shot} alt={item.player.name} /> : <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{item.player.name.charAt(0)}</span>}
                    {item.shirtNumber != null ? <span className={board.pitchNodeShirt}>#{item.shirtNumber}</span> : null}
                  </div>
                  <span className={board.pitchNodeName}>{localizePlainName(locale, item.player.name)}</span>
                </Link>
              );
            })}

            {/* 2. Defenders */}
            {startingXI.df.map((item, idx) => {
              const count = startingXI.df.length;
              const leftPct = (100 / (count + 1)) * (idx + 1);
              const shot = resolvePlayerShot(item.player.photoUrl, item.player.slug, item.player.name);
              return (
                <Link
                  key={item.id}
                  href={`/player/${item.player.slug}`}
                  className={board.pitchNode}
                  style={{ bottom: '28%', left: `${leftPct}%` }}
                >
                  <div className={board.pitchNodeAvatar}>
                    {shot ? <img src={shot} alt={item.player.name} /> : <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{item.player.name.charAt(0)}</span>}
                    {item.shirtNumber != null ? <span className={board.pitchNodeShirt}>#{item.shirtNumber}</span> : null}
                  </div>
                  <span className={board.pitchNodeName}>{localizePlainName(locale, item.player.name)}</span>
                </Link>
              );
            })}

            {/* 3. Midfielders */}
            {startingXI.mf.map((item, idx) => {
              const count = startingXI.mf.length;
              const leftPct = (100 / (count + 1)) * (idx + 1);
              const shot = resolvePlayerShot(item.player.photoUrl, item.player.slug, item.player.name);
              return (
                <Link
                  key={item.id}
                  href={`/player/${item.player.slug}`}
                  className={board.pitchNode}
                  style={{ bottom: '49%', left: `${leftPct}%` }}
                >
                  <div className={board.pitchNodeAvatar}>
                    {shot ? <img src={shot} alt={item.player.name} /> : <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{item.player.name.charAt(0)}</span>}
                    {item.shirtNumber != null ? <span className={board.pitchNodeShirt}>#{item.shirtNumber}</span> : null}
                  </div>
                  <span className={board.pitchNodeName}>{localizePlainName(locale, item.player.name)}</span>
                </Link>
              );
            })}

            {/* 4. Attackers */}
            {startingXI.fw.map((item, idx) => {
              const count = startingXI.fw.length;
              const leftPct = (100 / (count + 1)) * (idx + 1);
              const shot = resolvePlayerShot(item.player.photoUrl, item.player.slug, item.player.name);
              return (
                <Link
                  key={item.id}
                  href={`/player/${item.player.slug}`}
                  className={board.pitchNode}
                  style={{ bottom: '70%', left: `${leftPct}%` }}
                >
                  <div className={board.pitchNodeAvatar}>
                    {shot ? <img src={shot} alt={item.player.name} /> : <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{item.player.name.charAt(0)}</span>}
                    {item.shirtNumber != null ? <span className={board.pitchNodeShirt}>#{item.shirtNumber}</span> : null}
                  </div>
                  <span className={board.pitchNodeName}>{localizePlainName(locale, item.player.name)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ----------------- ROW 5: SQUAD ROSTER WITH POSITIONAL TABS ----------------- */}
        <section className={board.glassCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                <Users size={18} style={{ color: 'var(--ys-orange)' }} />
                {pick(locale, 'قائمة لاعبي الفريق الرسمية', 'Official Squad Roster')}
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                {pick(locale, 'جميع لاعبي الفريق مع أرقام القمصان، المراكز، والجنسيات.', 'All registered club players with jersey numbers and nationalities.')}
              </p>
            </div>

            {/* Positional filter tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setSquadFilter('ALL')}
                className={`${styles.foyerTab} ${squadFilter === 'ALL' ? styles.isOn : ''}`}
                style={{ cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <span>{pick(locale, 'الكل', 'All')}</span>
                <span className={styles.foyerBadge}>{squadCount}</span>
              </button>

              {SQUAD_ORDER.filter((k) => squad[k]?.length > 0).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSquadFilter(k)}
                  className={`${styles.foyerTab} ${squadFilter === k ? styles.isOn : ''}`}
                  style={{ cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <span>{squadLabel(k, locale)}</span>
                  <span className={styles.foyerBadge}>{squad[k]?.length || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {displayedSquad.length > 0 ? (
            <div className={board.squadGrid}>
              {displayedSquad.map((entry) => {
                const shot = playerShot(entry.player.photoUrl, entry.player.slug);
                return (
                  <Link
                    key={entry.id}
                    href={`/player/${entry.player.slug}`}
                    className={board.playerCard}
                  >
                    {entry.shirtNumber != null ? (
                      <span className={board.playerShirtBadge}>
                        #{entry.shirtNumber}
                      </span>
                    ) : null}

                    <div className={board.playerCardAvatar}>
                      {shot ? (
                        <img src={shot} alt={entry.player.name} loading="lazy" />
                      ) : (
                        <span className={board.playerCardAvatarFallback}>
                          {entry.player.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <strong className={board.playerName}>
                      {localizePlainName(locale, entry.player.name)}
                    </strong>
                    <span className={board.playerMeta}>
                      {[
                        entry.player.position ? localizePlainName(locale, entry.player.position) : null,
                        entry.player.nationality ? localizePlainName(locale, entry.player.nationality) : null,
                        entry.player.age ? `${entry.player.age} ${pick(locale, 'سنة', 'y/o')}` : null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem 0', fontSize: '0.85rem' }}>
              {pick(locale, 'قائمة اللاعبين جاري تحديثها من مصدر البيانات.', 'Squad roster is being updated.')}
            </p>
          )}
        </section>

        {/* ----------------- ROW 5: LEAGUE STANDINGS TABLE ----------------- */}
        {standing && tableWindow.length > 0 ? (
          <section id="standings" className={board.glassCard} style={{ scrollMarginTop: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Trophy size={18} style={{ color: '#eab308' }} />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                    {localizePlainName(locale, standing.league.name)} — {pick(locale, 'جدول الترتيب', 'League Standings')}
                  </h3>
                </div>
              </div>

              <Link
                href={`/league/${standing.league.slug}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ys-orange)', fontSize: '0.8rem', fontWeight: 800, textDecoration: 'none' }}
              >
                <span>{pick(locale, 'جدول الدوري بالكامل', 'Full Table')}</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className={board.standingsTableWrapper}>
              <table className={board.standingsTable}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'start' }}>{pick(locale, 'الترتيب والنادي', 'Rank & Team')}</th>
                    <th>{pick(locale, 'لعب', 'P')}</th>
                    <th>
                      <span className="hidden sm:inline">{pick(locale, 'فاز', 'W')}</span>
                      <span className="sm:hidden">{pick(locale, 'ف', 'W')}</span>
                    </th>
                    <th>
                      <span className="hidden sm:inline">{pick(locale, 'تعادل', 'D')}</span>
                      <span className="sm:hidden">{pick(locale, 'ت', 'D')}</span>
                    </th>
                    <th>
                      <span className="hidden sm:inline">{pick(locale, 'خسر', 'L')}</span>
                      <span className="sm:hidden">{pick(locale, 'خ', 'L')}</span>
                    </th>
                    <th className={board.colGoalsDesktop}>{pick(locale, 'له:عليه', 'GF:GA')}</th>
                    <th>
                      <span className="hidden sm:inline">{pick(locale, 'فارق', 'GD')}</span>
                      <span className="sm:hidden">{pick(locale, '+/-', '+/-')}</span>
                    </th>
                    <th style={{ fontWeight: 900, color: 'var(--ys-orange)' }}>{pick(locale, 'نقاط', 'PTS')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableWindow.map((row) => {
                    const diff = row.goalsFor - row.goalsAgainst;
                    return (
                      <tr
                        key={row.team.id}
                        className={row.isUs ? board.standingRowUs : undefined}
                      >
                        <td style={{ textAlign: 'start' }}>
                          <div className={board.standingTeamCell}>
                            <span className={`${board.standingRank} ${row.isUs ? board.standingRankUs : ''}`}>#{row.rank}</span>
                            <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-5 w-5 shrink-0" />
                            <span className={board.standingTeamName}>{localizePlainName(locale, row.team.name)}</span>
                          </div>
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td className={board.colGoalsDesktop}>{row.goalsFor}:{row.goalsAgainst}</td>
                        <td className={diff > 0 ? board.diffPositive : diff < 0 ? board.diffNegative : board.diffZero}>
                          {goalDiffLabel(diff)}
                        </td>
                        <td>
                          <span className={board.pointsBadge}>
                            {row.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section id="standings" className={board.glassCard} style={{ padding: '2rem 1.5rem', textAlign: 'center', scrollMarginTop: '6rem' }}>
            <Trophy size={26} style={{ color: '#eab308', margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '0.35rem' }}>
              {pick(locale, 'جدول الترتيب والمنافسات', 'Official Standings & Competitions')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>
              {pick(locale, 'بيانات جدول الترتيب غير متوفرة لهذا الموسم أو البطولة المحددة حالياً.', 'Standings data is not currently recorded for the selected season or competition.')}
            </p>
          </section>
        )}

        {/* ----------------- ROW 6: TRANSFERS & CLUB INFO/VENUE ----------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Transfers Box */}
          <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Repeat size={18} style={{ color: 'var(--ys-orange)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                  {pick(locale, 'انتقالات وميركاتو النادي', 'Club Transfers & Mercato')}
                </h3>
              </div>
            </div>

            {displayedTransfers.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {displayedTransfers.slice(0, 5).map((t) => (
                  <div key={t.id} className={board.transferItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--muted)', flexShrink: 0 }}>
                        {playerShot(t.player.photoUrl, t.player.slug) ? (
                          <img src={playerShot(t.player.photoUrl, t.player.slug)!} alt={t.player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900, color: 'var(--foreground)' }}>
                            {t.player.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                          <Link href={`/player/${t.player.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {localizePlainName(locale, t.player.name)}
                          </Link>
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                          {t.fromTeam ? `${t.fromTeam} → ` : ''}{t.toTeam || ''}
                        </span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ys-orange)' }}>
                      {t.fee || pick(locale, 'انتقال', 'Transfer')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', margin: '1.5rem 0' }}>
                {pick(locale, 'سجل الانتقالات لم يتم تسجيله للموسم الحالي.', 'No recorded transfers for the current window.')}
              </p>
            )}
          </div>

          {/* Grand Stadium & Club Heritage Showcase */}
          {venue ? (
            <div className={board.stadiumCard}>
              <div className={board.stadiumBanner}>
                {venue.imageUrl ? (
                  <img src={venue.imageUrl} alt={venue.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--ys-orange) 20%, #1a3d24), #0b1a0f)' }} />
                )}
                <div className={board.stadiumBannerOverlay}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ys-orange)', letterSpacing: '0.12em' }}>
                    {pick(locale, 'الملعب الرسمي والمعقل التاريخي', 'Official Stadium & Ground')}
                  </span>
                  <h2 className={board.stadiumTitle}>{venue.name}</h2>
                  <p className={board.stadiumSubtitle}>
                    {[venue.city, country, venue.address].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className={board.stadiumStatsRow}>
                {venue.capacity ? (
                  <div className={board.stadiumStatBox}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'السعة الجماهيرية', 'Seating Capacity')}</span>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--foreground)' }}>{venue.capacity.toLocaleString()} {pick(locale, 'متفرج', 'seats')}</strong>
                  </div>
                ) : null}

                {venue.surface ? (
                  <div className={board.stadiumStatBox}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'نوعية الأرضية', 'Pitch Surface')}</span>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--foreground)' }}>
                      🌱 {venue.surface.toLowerCase().includes('hybrid') ? pick(locale, 'عشب طبيعي مهجن', venue.surface) : venue.surface.toLowerCase().includes('grass') ? pick(locale, 'عشب طبيعي', venue.surface) : venue.surface}
                    </strong>
                  </div>
                ) : null}

                {venue.city ? (
                  <div className={board.stadiumStatBox}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'المدينة والموقع', 'City & Location')}</span>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--foreground)' }}>📍 {localizePlainName(locale, venue.city)}</strong>
                  </div>
                ) : null}

                {team.founded ? (
                  <div className={board.stadiumStatBox}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'سنة التأسيس', 'Founded')}</span>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ys-orange)' }}>📅 {team.founded}</strong>
                  </div>
                ) : null}

                {team.coach ? (
                  <Link
                    href={team.coach.slug ? `/coach/${team.coach.slug}` : '#'}
                    className={board.stadiumStatBox}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--ys-orange)', fontWeight: 900 }}>👔 {pick(locale, 'المدير الفني', 'Head Coach')}</span>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{localizePlainName(locale, team.coach.name)}</span>
                      <ArrowUpRight size={14} style={{ color: 'var(--ys-orange)' }} />
                    </strong>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* News Section (3 on the right, 3 on the left - Luxury Editorial Studio) */}
        {news && news.length > 0 ? (
          <div id="news" style={{ scrollMarginTop: '6rem' }}>
            <EditorialNewsSixGrid
              locale={locale}
              news={news}
              title={pick(locale, 'أحدث الأخبار والتقارير', 'Latest News & Reports')}
              subtitle={pick(
                locale,
                `تغطية حصرية وشاملة لآخر مستجدات وكواليس ${team.name} من المصادر المعتمدة`,
                `Exclusive reporting and verified updates for ${team.name}`
              )}
            />
          </div>
        ) : (
          <div id="news" className={board.glassCard} style={{ padding: '2rem 1.5rem', textAlign: 'center', scrollMarginTop: '6rem' }}>
            <Newspaper size={26} style={{ color: 'var(--ys-orange)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '0.35rem' }}>
              {pick(locale, 'أخبار وتقارير النادي', 'Club News & Reports')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>
              {pick(locale, 'لا توجد أخبار مخصصة مسجلة للنادي حالياً من المصادر المعتمدة.', 'No verified news items currently linked to this club.')}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
