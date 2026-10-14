'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Eye,
  FileText,
  Flame,
  Globe,
  Info,
  Layers,
  MapPin,
  Newspaper,
  Repeat,
  Shield,
  Shirt,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { formatSportFigure } from '@/lib/format/sport-figure';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { PlayerDossierData, PlayerSeasonBlock } from '@/lib/players/load-dossier';
import board from '@/components/teams/team-salon.module.css';
import { EditorialNewsSixGrid } from '@/components/news/EditorialNewsSixGrid';

type PlayerTab = 'overview' | 'stats' | 'matches' | 'career' | 'news';

function calculateAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 120 ? age : null;
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

export function PlayerDossier({
  locale,
  dossier,
}: {
  locale: string;
  dossier: PlayerDossierData;
}) {
  const {
    player,
    currentClub,
    onLoanFrom,
    confirmedFreeAgent,
    seasonBlocks,
    seasonTotals,
    rates,
    profileBars,
    trophies,
    sidelined,
    transfers,
    news,
    teammates,
    clubFixtures,
    timeline,
    clubHistory,
    apiClubs,
  } = dossier;

  const [activeTab, setActiveTab] = useState<PlayerTab>('overview');

  const commonName = localizePlainName(locale, player.name);
  const fullName = useMemo(() => {
    const parts = [player.firstName, player.lastName].filter(Boolean);
    if (parts.length > 0) {
      return localizePlainName(locale, parts.join(' '));
    }
    return commonName;
  }, [player.firstName, player.lastName, commonName, locale]);

  const portrait = apiSportsPlayerPhoto(player.externalId, player.photoUrl);
  const shirt = currentClub?.shirtNumber ?? seasonBlocks.find((block) => block.games.number != null)?.games.number;
  const clubName = currentClub ? localizePlainName(locale, currentClub.name) : null;
  const nationality = player.nationality ? localizePlainName(locale, player.nationality) : null;
  const birthCountry = player.birthCountry ? localizePlainName(locale, player.birthCountry) : null;
  const position = player.position ? localizePlainName(locale, player.position) : null;

  // Auto-calculated age from birthdate
  const computedAge = useMemo(() => {
    return calculateAge(player.birthDate) ?? player.age;
  }, [player.birthDate, player.age]);

  // Secondary / Alternative positions
  const altPositions = useMemo(() => {
    const positions = new Set<string>();
    seasonBlocks.forEach((b) => {
      if (b.games.position && b.games.position !== player.position) {
        positions.add(localizePlainName(locale, b.games.position));
      }
    });
    return Array.from(positions);
  }, [seasonBlocks, player.position, locale]);

  // Contract & Joined dates
  const contractInfo = useMemo(() => {
    const currentStint = clubHistory.find(
      (c) => c.slug === currentClub?.slug || c.name.toLowerCase() === currentClub?.name.toLowerCase()
    );
    const latestTransfer = transfers.find(
      (t) => t.toTeam && currentClub?.name && t.toTeam.toLowerCase().includes(currentClub.name.toLowerCase())
    );
    const joinedDate = currentStint?.from || latestTransfer?.date || null;
    const contractEnd = currentStint?.to || null;
    return { joinedDate, contractEnd };
  }, [clubHistory, transfers, currentClub]);

  const tabs: Array<{ id: PlayerTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; count?: number }> = [
    { id: 'overview', label: pick(locale, 'نظرة عامة والمواصفات', 'Overview & Specs'), icon: User },
    { id: 'stats', label: pick(locale, 'الإحصائيات المتقدمة', 'Advanced Stats'), icon: Activity },
    { id: 'matches', label: pick(locale, 'سجل المباريات والأداء', 'Matches & Impact'), icon: Calendar, count: timeline.length },
    { id: 'career', label: pick(locale, 'المسيرة والألقاب', 'Career & Honours'), icon: Trophy, count: trophies.length },
    { id: 'news', label: pick(locale, 'الأخبار والتقارير', 'News & Reports'), icon: Newspaper, count: news.length },
  ];

  return (
    <div className={board.teamPage}>
      {/* =========================================================================
          1. GOLDEN VIP PLAYER HERO BANNER
          ========================================================================= */}
      <section className={board.hero} aria-label={commonName}>
        <div className={board.heroAura} aria-hidden />
        <div className={board.heroGrid} aria-hidden />

        <div className={board.heroInner}>
          {/* Breadcrumb */}
          <div className={board.heroTop}>
            <div className={board.crumb}>
              <Link href="/">{pick(locale, 'الرئيسية', 'Home')}</Link>
              <span>/</span>
              {currentClub ? (
                <>
                  <Link href={`/team/${currentClub.slug}`}>{clubName}</Link>
                  <span>/</span>
                </>
              ) : null}
              <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{commonName}</span>
            </div>
          </div>

          {/* Hero Core: Cutout Portrait, Name, Badges */}
          <div className={board.heroStage}>
            {/* Player Avatar Wrap - Clean with no overlapping badge */}
            <div className={board.playerHeroAvatarWrap}>
              {portrait ? (
                <img src={portrait} alt={commonName} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
                  {commonName.charAt(0)}
                </div>
              )}
            </div>

            {/* Player Info Details */}
            <div className={board.heroCopy}>
              <p className={board.kicker}>
                {position ? `${position} · ` : ''}
                {nationality ? `${nationality} · ` : ''}
                {pick(locale, 'لاعب كرة قدم محترف', 'Professional Footballer')}
              </p>

              {/* Title with shirt number placed OUTSIDE the image right beside the name */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
                  {commonName}
                </h1>
                {shirt != null ? (
                  <span className="inline-flex items-center justify-center rounded-xl bg-orange-500/15 text-orange-500 px-3 py-1 text-base sm:text-lg font-black border border-orange-500/30 shadow-xs tabular-nums">
                    #{shirt}
                  </span>
                ) : null}
              </div>

              {fullName !== commonName ? (
                <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                  <span className="opacity-75">{pick(locale, 'الاسم الكامل:', 'Full name:')} </span>
                  <span className="text-foreground">{fullName}</span>
                </p>
              ) : null}

              {/* Badges Ribbon */}
              <div className={board.chips}>
                {currentClub ? (
                  <Link href={`/team/${currentClub.slug}`} className={board.chipLink}>
                    <LeagueCrest name={currentClub.name} logoUrl={currentClub.logoUrl} className="h-4 w-4" />
                    <span style={{ marginInlineStart: '0.35rem' }}>{clubName}</span>
                  </Link>
                ) : confirmedFreeAgent ? (
                  <span className={board.chip}>
                    {pick(locale, 'لاعب حر حالياً', 'Free Agent')}
                  </span>
                ) : null}

                {onLoanFrom ? (
                  <span className={board.chip}>
                    🔄 {pick(locale, 'معار من:', 'On loan from:')} {localizePlainName(locale, onLoanFrom.name)}
                  </span>
                ) : null}

                {player.injured === true ? (
                  <span className={board.chip} style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444', fontWeight: 900 }}>
                    🚨 {pick(locale, 'مصاب حالياً', 'Injured')}
                  </span>
                ) : player.injured === false ? (
                  <span className={board.chip} style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.35)', color: '#16a34a', fontWeight: 900 }}>
                    🟢 {pick(locale, 'جاهز للمشاركة', 'Match Fit')}
                  </span>
                ) : null}

                {computedAge != null ? (
                  <span className={board.chip}>
                    <Calendar size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {computedAge} {pick(locale, 'سنة', 'yrs')}
                  </span>
                ) : null}

                {seasonTotals?.rating ? (
                  <span className={board.chip} style={{ background: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.35)', color: '#eab308' }}>
                    ★ {pick(locale, 'التقييم الفني:', 'Rating:')} {formatSportFigure(seasonTotals.rating)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INTERACTIVE TABS BAR (تنظيم المعلومات في تبويبات واضحة)
          ========================================================================= */}
      <div style={{ maxWidth: '1320px', margin: '1.5rem auto 0', padding: '0 1rem' }}>
        <nav
          aria-label={pick(locale, 'أقسام ملف اللاعب', 'Player profile sections')}
          className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm scrollbar-none"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-black scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold tabular-nums ${
                      isActive ? 'bg-black/25 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* =========================================================================
          3. MASTER TABBED CONTENT PANELS
          ========================================================================= */}
      <main style={{ maxWidth: '1320px', margin: '1.5rem auto 0', padding: '0 1rem', display: 'grid', gap: '2rem' }}>

        {/* -----------------------------------------------------------------------
            TAB 1: OVERVIEW & COMPREHENSIVE SPECS (نظرة عامة والمواصفات)
            ----------------------------------------------------------------------- */}
        {activeTab === 'overview' ? (
          <>
            {/* Complete Specifications Card (المواصفات الشاملة - تظهر فقط الحقول التي تملك بيانات فعلية) */}
            <section className={board.glassCard}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <User size={18} className="text-orange-500" />
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {pick(locale, 'بطاقة الهوية والمواصفات الفنية', 'Player Specifications & Profile')}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                  {pick(locale, 'سجل موثق رسمياً', 'Officially Documented')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {/* 1. Full & Common Name */}
                <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    {pick(locale, 'الاسم الكامل والشائع', 'Full & Common Name')}
                  </span>
                  <strong className="mt-1 block text-sm font-extrabold text-foreground truncate" title={fullName}>
                    {fullName}
                  </strong>
                  {fullName !== commonName ? (
                    <span className="block text-[11px] text-orange-500 font-semibold truncate">
                      {pick(locale, 'يُعرف بـ:', 'Known as:')} {commonName}
                    </span>
                  ) : null}
                </div>

                {/* 2. Birthdate & Calculated Age (Only if available) */}
                {player.birthDate || computedAge != null ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'تاريخ الميلاد والعمر', 'Birthdate & Age')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground">
                      {player.birthDate ? (
                        <ClientTime
                          value={player.birthDate}
                          locale={locale}
                          options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                        />
                      ) : (
                        <span className="text-muted-foreground font-normal">{pick(locale, 'غير مسجل باليوم', 'Not specified')}</span>
                      )}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {computedAge != null
                        ? `${computedAge} ${pick(locale, 'سنة (محسوب تلقائياً)', 'years old')}`
                        : ''}
                    </span>
                  </div>
                ) : null}

                {/* 3. Height & Weight (Only if present) */}
                {player.height || player.weight ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'الطول والوزن', 'Height & Weight')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground">
                      {[player.height || null, player.weight || null].filter(Boolean).join(' · ')}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {pick(locale, 'المقاييس البدنية المعتمدة', 'Physical measurements')}
                    </span>
                  </div>
                ) : null}

                {/* 4. Sport Nationality (Only if present) */}
                {nationality ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'الجنسية الرياضية المعتمدة', 'Sport Nationality')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground flex items-center gap-1.5">
                      <Globe size={14} className="text-orange-500" />
                      <span>{nationality}</span>
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {pick(locale, 'التمثيل الدولي الرسمي', 'International registry')}
                    </span>
                  </div>
                ) : null}

                {/* 5. Documented Secondary Nationality / Birthplace (Only if distinct) */}
                {(birthCountry && birthCountry !== nationality) || player.birthPlace ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'بلد الميلاد / جنسية ثانية', 'Birth Country / Dual Nat.')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground">
                      {birthCountry && birthCountry !== nationality ? birthCountry : player.birthPlace}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {player.birthPlace ? `${pick(locale, 'مكان الولادة:', 'Birthplace:')} ${player.birthPlace}` : pick(locale, 'السجل المدني', 'Civil record')}
                    </span>
                  </div>
                ) : null}

                {/* 6. Primary Position (Only if present) */}
                {position ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'المركز الأساسي', 'Primary Position')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-orange-500 truncate">
                      {position}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {pick(locale, 'المركز الميداني المعتمد', 'Official playing position')}
                    </span>
                  </div>
                ) : null}

                {/* 7. Alternative Positions (Only if any exist) */}
                {altPositions.length > 0 ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'المراكز البديلة', 'Alternative Positions')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground truncate">
                      {altPositions.join(', ')}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {pick(locale, 'مراكز لعب إضافية موثقة', 'Documented secondary positions')}
                    </span>
                  </div>
                ) : null}

                {/* 8. Club, Shirt & Contract (Only if current club exists) */}
                {clubName ? (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {pick(locale, 'النادي الحالي والعقد', 'Club & Contract')}
                    </span>
                    <strong className="mt-1 block text-sm font-extrabold text-foreground truncate">
                      {clubName} {shirt != null ? `(#${shirt})` : ''}
                    </strong>
                    <span className="block text-[11px] text-muted-foreground font-medium">
                      {contractInfo.contractEnd ? (
                        <>
                          {pick(locale, 'ينتهي:', 'Expires:')}{' '}
                          <ClientTime
                            value={contractInfo.contractEnd}
                            locale={locale}
                            options={{ month: 'short', year: 'numeric' }}
                          />
                        </>
                      ) : (
                        pick(locale, 'عقد سارٍ مع النادي', 'Active contract')
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Quick Season Performance Overview Box */}
            <section className={board.glassCard}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'ملخص أرقام الموسم الحالي', 'Current Season Performance')}
                  </h3>
                </div>
                {seasonTotals?.rating ? (
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    ★ {pick(locale, 'معدل التقييم:', 'Avg Rating:')} {formatSportFigure(seasonTotals.rating)}
                  </span>
                ) : null}
              </div>

              {seasonTotals && ((seasonTotals.appearances ?? 0) > 0 || (seasonTotals.minutes ?? 0) > 0 || (seasonTotals.goals ?? 0) > 0) ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    <div className={board.statBox}>
                      <span className={board.statBoxTitle}>{pick(locale, 'مباريات الظهور', 'Appearances')}</span>
                      <strong className={board.statBoxValue}>{seasonTotals?.appearances ?? '–'}</strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle}>{pick(locale, 'تشكيلة أساسية', 'Starts')}</span>
                      <strong className={board.statBoxValue}>{seasonTotals?.lineups ?? '–'}</strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle} style={{ color: 'var(--ys-orange)' }}>
                        {pick(locale, 'الأهداف', 'Goals')}
                      </span>
                      <strong className={board.statBoxValue} style={{ color: 'var(--ys-orange)' }}>
                        {seasonTotals?.goals ?? 0}
                      </strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle} style={{ color: '#0284c7' }}>
                        {pick(locale, 'صناعة الأهداف', 'Assists')}
                      </span>
                      <strong className={board.statBoxValue} style={{ color: '#0284c7' }}>
                        {seasonTotals?.assists ?? 0}
                      </strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle}>{pick(locale, 'دقائق اللعب', 'Minutes')}</span>
                      <strong className={board.statBoxValue}>{seasonTotals?.minutes ?? 0}&prime;</strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle} style={{ color: '#eab308' }}>
                        {pick(locale, 'التقييم الفني', 'Rating')}
                      </span>
                      <strong className={board.statBoxValue} style={{ color: '#eab308' }}>
                        {seasonTotals?.rating ? formatSportFigure(seasonTotals.rating) : '–'}
                      </strong>
                    </div>

                    <div className={board.statBox}>
                      <span className={board.statBoxTitle}>{pick(locale, 'البطاقات', 'Cards')}</span>
                      <strong className={board.statBoxValue} style={{ fontSize: '1rem' }}>
                        🟨 {seasonTotals?.yellow ?? 0} · 🟥 {seasonTotals?.red ?? 0}
                      </strong>
                    </div>
                  </div>

                  {/* Rates strip */}
                  {rates && (rates.goalsPer90 != null || rates.shotAccuracy != null || rates.duelWinPct != null) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
                      {rates.goalsPer90 != null ? (
                        <div className="flex items-center justify-between rounded-xl bg-background/60 p-2.5 border border-border/40">
                          <span className="text-xs text-muted-foreground">{pick(locale, 'معدل الأهداف / 90 دقيقة', 'Goals / 90m')}</span>
                          <strong className="text-sm text-orange-500 font-extrabold">{rates.goalsPer90}</strong>
                        </div>
                      ) : null}

                      {rates.shotAccuracy != null ? (
                        <div className="flex items-center justify-between rounded-xl bg-background/60 p-2.5 border border-border/40">
                          <span className="text-xs text-muted-foreground">{pick(locale, 'دقة التسديد على المرمى', 'Shot Accuracy')}</span>
                          <strong className="text-sm font-extrabold">{rates.shotAccuracy}%</strong>
                        </div>
                      ) : null}

                      {rates.duelWinPct != null ? (
                        <div className="flex items-center justify-between rounded-xl bg-background/60 p-2.5 border border-border/40">
                          <span className="text-xs text-muted-foreground">{pick(locale, 'نسبة الفوز بالالتحامات', 'Duel Win Rate')}</span>
                          <strong className="text-sm font-extrabold">{rates.duelWinPct}%</strong>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-xl border border-border/50 bg-background/50 p-6 text-center text-muted-foreground">
                  <Activity size={22} className="mx-auto text-orange-500 mb-2 opacity-80" />
                  <h4 className="font-bold text-foreground text-xs sm:text-sm">
                    {pick(locale, 'إحصائيات الموسم الحالي قيد التوثيق والتحديث', 'Current Season Stats Being Updated')}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto">
                    {pick(
                      locale,
                      'لم يُسجل مزود البيانات الرياضي دقائق لعب أو مشاركات مؤكدة للاعب في الموسم الحالي بعد.',
                      'No verified appearances or minutes have been logged for this player in the current season yet.'
                    )}
                  </p>
                </div>
              )}
            </section>

            {/* Performance Bars & Skill Radar */}
            {profileBars && profileBars.length > 0 ? (
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <BarChart3 size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'تحليل مؤشرات الأداء والقدرات الفنية', 'Performance Metrics & Attributes')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {profileBars.map((bar) => {
                    const percentage = Math.min(100, Math.round((bar.value / Math.max(1, bar.max)) * 100));
                    return (
                      <div key={bar.key} className="rounded-xl bg-background/60 p-3 border border-border/40">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-foreground">
                            {locale === 'ar' ? bar.labelAr : bar.labelEn}
                          </span>
                          <span className="font-extrabold text-orange-500 tabular-nums">
                            {bar.value} {bar.suffix || ''}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Teammates Preview */}
            {teammates.length > 0 ? (
              <section className={board.glassCard}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-orange-500" />
                    <h3 className="text-base font-black text-foreground">
                      {pick(locale, 'زملاء الفريق في النادي الحالي', 'Current Club Teammates')}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{teammates.length} {pick(locale, 'لاعباً', 'Players')}</span>
                </div>

                <div className={board.squadGrid}>
                  {teammates.slice(0, 8).map((tm) => {
                    const shot = apiSportsPlayerPhoto(tm.slug.match(/(\d+)$/)?.[1], tm.photoUrl);
                    return (
                      <Link key={tm.slug} href={`/player/${tm.slug}`} className={board.playerCard}>
                        {tm.shirtNumber != null ? (
                          <span className={board.playerShirtBadge}>#{tm.shirtNumber}</span>
                        ) : null}
                        <div className={board.playerCardAvatar}>
                          {shot ? (
                            <img src={shot} alt={tm.name} loading="lazy" />
                          ) : (
                            <span className={board.playerCardAvatarFallback}>{tm.name.charAt(0)}</span>
                          )}
                        </div>
                        <strong className={board.playerName}>{localizePlainName(locale, tm.name)}</strong>
                        <span className={board.playerMeta}>{tm.position ? localizePlainName(locale, tm.position) : ''}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {/* -----------------------------------------------------------------------
            TAB 2: ADVANCED STATS & ANALYSIS (الإحصائيات المتقدمة وتحليل الأداء)
            ----------------------------------------------------------------------- */}
        {activeTab === 'stats' ? (
          <>
            {/* Advanced Metrics Breakdown: Goals, Assists, Shots, Passes, Duels, Dribbles */}
            <section className={board.glassCard}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <Target size={18} className="text-orange-500" />
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {pick(locale, 'الإحصائيات الهجومية وصناعة اللعب', 'Attacking & Playmaking Breakdown')}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {pick(locale, 'محدثة وفق سجل المباريات', 'Updated from match records')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'إجمالي الأهداف', 'Total Goals')}</span>
                  <strong className="mt-1 block text-lg font-black text-orange-500 tabular-nums">{seasonTotals?.goals ?? 0}</strong>
                </div>

                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'صناعة الأهداف', 'Assists')}</span>
                  <strong className="mt-1 block text-lg font-black text-sky-500 tabular-nums">{seasonTotals?.assists ?? 0}</strong>
                </div>

                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'إجمالي التسديدات', 'Total Shots')}</span>
                  <strong className="mt-1 block text-lg font-black text-foreground tabular-nums">{seasonTotals?.shots ?? '–'}</strong>
                </div>

                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'تسديدات على المرمى', 'Shots on Target')}</span>
                  <strong className="mt-1 block text-lg font-black text-foreground tabular-nums">{seasonTotals?.shotsOn ?? '–'}</strong>
                </div>

                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'التمريرات المفتاحية', 'Key Passes')}</span>
                  <strong className="mt-1 block text-lg font-black text-foreground tabular-nums">{seasonTotals?.keyPasses ?? '–'}</strong>
                </div>

                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'ركلات جزاء مسجلة', 'Penalties Scored')}</span>
                  <strong className="mt-1 block text-lg font-black text-foreground tabular-nums">{seasonTotals?.penaltiesScored ?? '–'}</strong>
                </div>
              </div>

              {/* xG Disclaimer Box adhering strictly to data guidelines */}
              <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3.5 flex items-start gap-3">
                <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground block font-bold">
                    {pick(locale, 'الأهداف المتوقعة (xG) وخرائط التسديد:', 'Expected Goals (xG) & Shot Maps:')}
                  </strong>
                  <span>
                    {pick(
                      locale,
                      'تُعرض الأهداف المتوقعة (xG) عند توفرها المباشر من مزود البيانات الرياضي. في حال عدم توفر نموذج xG لهذه المسابقة في المصدر، يُعرض السجل الفعلي للتسديدات والأهداف بدقة بدلاً من اختراع أو افتراض قيم غير مؤكدة.',
                      'xG metrics and shot maps are rendered when supplied by the live sports data feeds. Where xG models are unavailable for this competition, actual shots and goals are shown accurately rather than assuming values.'
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Defending & Duels Metrics */}
            <section className={board.glassCard}>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                <Shield size={18} className="text-orange-500" />
                <h3 className="text-base font-black text-foreground">
                  {pick(locale, 'الالتحامات والعمليات الدفاعية والمراوغة', 'Duels, Defending & Dribbling')}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'قطع الكرات (Tackles)', 'Tackles')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.tackles ?? '–'}</strong>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'اعتراضات (Interceptions)', 'Interceptions')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.interceptions ?? '–'}</strong>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'ثنائيات فائزة', 'Duels Won')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.duelsWon ?? '–'}</strong>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'مراوغات ناجحة', 'Successful Dribbles')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.dribbles ?? '–'}</strong>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'أخطاء مكتسبة', 'Fouls Drawn')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.foulsDrawn ?? '–'}</strong>
                </div>
                <div className="rounded-xl bg-background/70 p-3 border border-border/40 text-center">
                  <span className="block text-[11px] text-muted-foreground font-semibold">{pick(locale, 'أخطاء مرتكبة', 'Fouls Committed')}</span>
                  <strong className="mt-1 block text-base font-extrabold tabular-nums">{seasonTotals?.foulsCommitted ?? '–'}</strong>
                </div>
              </div>
            </section>

            {/* Per-Competition Table */}
            {seasonBlocks.length > 0 ? (
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <Layers size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'أرقام اللاعب حسب المسابقات والبطولات', 'Per-Competition Statistics')}
                  </h3>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden space-y-3">
                  {seasonBlocks.map((b, idx) => {
                    const ratingVal = formatSportFigure(b.games.rating);
                    return (
                      <div key={`${b.league.name}-${idx}`} className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2.5 border-b border-border/50 pb-2.5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background p-1 border border-border/60">
                              <LeagueCrest name={b.league.name} logoUrl={b.league.logoUrl} className="h-full w-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <strong className="block truncate text-xs font-bold text-foreground">
                                {localizePlainName(locale, b.league.name)}
                              </strong>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {localizePlainName(locale, b.team.name)}
                              </span>
                            </div>
                          </div>

                          {ratingVal ? (
                            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-black text-amber-500 border border-amber-500/20">
                              <span className="text-[10px] text-muted-foreground font-normal">{pick(locale, 'التقييم', 'Rating')}</span>
                              <span className="tabular-nums">{ratingVal}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                          <div className="rounded-xl bg-background/70 p-2 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground font-semibold">{pick(locale, 'ظهور', 'Apps')}</span>
                            <strong className="mt-0.5 block text-xs font-black text-foreground tabular-nums">{b.games.appearances ?? '–'}</strong>
                          </div>
                          <div className="rounded-xl bg-background/70 p-2 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground font-semibold">{pick(locale, 'أساسي', 'Starts')}</span>
                            <strong className="mt-0.5 block text-xs font-black text-foreground tabular-nums">{b.games.lineups ?? '–'}</strong>
                          </div>
                          <div className="rounded-xl bg-background/70 p-2 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground font-semibold">{pick(locale, 'دقائق', 'Mins')}</span>
                            <strong className="mt-0.5 block text-xs font-black text-foreground tabular-nums">{b.games.minutes ?? 0}&prime;</strong>
                          </div>
                          <div className="rounded-xl bg-orange-500/10 p-2 border border-orange-500/20">
                            <span className="block text-[10px] text-orange-500 font-bold">{pick(locale, 'أهداف', 'Goals')}</span>
                            <strong className="mt-0.5 block text-xs font-black text-orange-500 tabular-nums">{b.goals.total ?? 0}</strong>
                          </div>
                          <div className="rounded-xl bg-sky-500/10 p-2 border border-sky-500/20">
                            <span className="block text-[10px] text-sky-500 font-bold">{pick(locale, 'صناعة', 'Assists')}</span>
                            <strong className="mt-0.5 block text-xs font-black text-sky-500 tabular-nums">{b.goals.assists ?? 0}</strong>
                          </div>
                          <div className="rounded-xl bg-background/70 p-2 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground font-semibold">{pick(locale, 'بطاقات', 'Cards')}</span>
                            <span className="mt-0.5 block text-[11px] font-bold text-foreground tabular-nums">
                              🟨 {b.cards.yellow ?? 0}{b.cards.red ? ` 🟥 ${b.cards.red}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <div className={board.standingsTableWrapper}>
                    <table className={board.standingsTable}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'start' }}>{pick(locale, 'البطولة والنادي', 'Competition & Team')}</th>
                          <th>{pick(locale, 'ظهور', 'Apps')}</th>
                          <th>{pick(locale, 'أساسي', 'Starts')}</th>
                          <th>{pick(locale, 'دقائق', 'Mins')}</th>
                          <th style={{ color: 'var(--ys-orange)' }}>{pick(locale, 'أهداف', 'Goals')}</th>
                          <th style={{ color: '#0284c7' }}>{pick(locale, 'صناعة', 'Assists')}</th>
                          <th>{pick(locale, 'بطاقات', 'Cards')}</th>
                          <th style={{ color: '#eab308' }}>{pick(locale, 'التقييم', 'Rating')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seasonBlocks.map((b, idx) => (
                          <tr key={`${b.league.name}-${idx}`}>
                            <td style={{ textAlign: 'start', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <LeagueCrest name={b.league.name} logoUrl={b.league.logoUrl} className="h-5 w-5" />
                              <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem' }}>{localizePlainName(locale, b.league.name)}</strong>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{localizePlainName(locale, b.team.name)}</span>
                              </div>
                            </td>
                            <td>{b.games.appearances ?? '–'}</td>
                            <td>{b.games.lineups ?? '–'}</td>
                            <td>{b.games.minutes ?? 0}&prime;</td>
                            <td style={{ fontWeight: 900, color: 'var(--ys-orange)' }}>{b.goals.total ?? 0}</td>
                            <td style={{ fontWeight: 900, color: '#0284c7' }}>{b.goals.assists ?? 0}</td>
                            <td>🟨 {b.cards.yellow ?? 0} {b.cards.red ? `· 🟥 ${b.cards.red}` : ''}</td>
                            <td style={{ fontWeight: 800, color: '#eab308' }}>{formatSportFigure(b.games.rating) ?? '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <section className={board.glassCard}>
                <div className="p-8 text-center text-muted-foreground">
                  <Layers size={28} className="mx-auto text-orange-500 mb-2 opacity-80" />
                  <h4 className="font-bold text-foreground text-sm sm:text-base">
                    {pick(locale, 'سجل البطولات والمسابقات غير متاح حالياً', 'Competition Statistics Unavailable')}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    {pick(
                      locale,
                      'سيتم إدراج إحصائيات المسابقات وتفاصيل الأداء فور توفرها من المصدر الرسمي.',
                      'Competition stats will appear once updated by the official sports data feed.'
                    )}
                  </p>
                </div>
              </section>
            )}
          </>
        ) : null}

        {/* -----------------------------------------------------------------------
            TAB 3: MATCHES & TIMELINE (سجل المباريات والأداء مباراة بمباراة)
            ----------------------------------------------------------------------- */}
        {activeTab === 'matches' ? (
          <>
            {/* Timeline Match-by-match Events */}
            <section className={board.glassCard}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'أداء وتأثير اللاعب مباراة بمباراة', 'Match-by-Match Impact & Events')}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">{timeline.length} {pick(locale, 'أحداث مسجلة', 'Logged Events')}</span>
              </div>

              {timeline.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {timeline.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/match/${ev.match.id}`}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-background/60 hover:bg-card hover:border-orange-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">
                          {ev.type === 'GOAL' ? '⚽' : ev.type === 'PENALTY' ? '🎯' : ev.type === 'YELLOW_CARD' ? '🟨' : ev.type === 'RED_CARD' ? '🟥' : '⚡'}
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                            {ev.type === 'GOAL'
                              ? pick(locale, 'هدف مسجل', 'Goal')
                              : ev.type === 'PENALTY'
                              ? pick(locale, 'هدف من ركلة جزاء', 'Penalty Goal')
                              : ev.type === 'YELLOW_CARD'
                              ? pick(locale, 'بطاقة صفراء', 'Yellow Card')
                              : ev.type === 'RED_CARD'
                              ? pick(locale, 'بطاقة حمراء', 'Red Card')
                              : ev.type}
                          </strong>
                          <span className="block text-[11px] text-muted-foreground truncate">
                            {localizePlainName(locale, ev.match.homeTeam.name)} {ev.match.homeScore ?? 0} - {ev.match.awayScore ?? 0} {localizePlainName(locale, ev.match.awayTeam.name)}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0 ms-2">
                        <span className="block text-xs font-black text-orange-500 tabular-nums">
                          {ev.minute}&prime;
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          <ClientTime value={ev.match.kickoffAt} locale={locale} options={{ month: 'short', day: 'numeric' }} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-xs py-8">
                  {pick(locale, 'لا توجد أحداث مسجلة للاعب في قاعدة البيانات الحالية.', 'No match events recorded in the database.')}
                </p>
              )}
            </section>

            {/* Club Upcoming & Recent Fixtures */}
            {clubFixtures && (clubFixtures.upcoming?.length > 0 || clubFixtures.recent?.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubFixtures.upcoming?.length > 0 ? (
                  <section className={board.glassCard}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                      <Clock size={16} className="text-orange-500" />
                      <h4 className="text-sm font-bold text-foreground">
                        {pick(locale, 'مباريات نادي اللاعب القادمة', 'Upcoming Club Matches')}
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {clubFixtures.upcoming.slice(0, 4).map((m) => (
                        <Link
                          key={m.id}
                          href={`/match/${m.id}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-card hover:border-orange-500/40 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <LeagueCrest name={m.homeTeam.name} logoUrl={m.homeTeam.logoUrl} className="h-5 w-5 shrink-0" />
                            <span className="font-semibold truncate">{localizePlainName(locale, m.homeTeam.name)}</span>
                            <span className="font-bold text-orange-500 shrink-0">vs</span>
                            <LeagueCrest name={m.awayTeam.name} logoUrl={m.awayTeam.logoUrl} className="h-5 w-5 shrink-0" />
                            <span className="font-semibold truncate">{localizePlainName(locale, m.awayTeam.name)}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 ms-2">
                            <ClientTime value={m.kickoffAt} locale={locale} options={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {clubFixtures.recent?.length > 0 ? (
                  <section className={board.glassCard}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                      <Flame size={16} className="text-orange-500" />
                      <h4 className="text-sm font-bold text-foreground">
                        {pick(locale, 'نتائج مباريات نادي اللاعب الأخيرة', 'Recent Club Match Results')}
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {clubFixtures.recent.slice(0, 4).map((m) => (
                        <Link
                          key={m.id}
                          href={`/match/${m.id}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-card hover:border-orange-500/40 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold truncate">{localizePlainName(locale, m.homeTeam.name)}</span>
                            <span className="font-extrabold text-orange-500 bg-muted/80 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                              {m.homeScore ?? 0} - {m.awayScore ?? 0}
                            </span>
                            <span className="font-semibold truncate">{localizePlainName(locale, m.awayTeam.name)}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 ms-2">
                            {localizePlainName(locale, m.league.name)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {/* -----------------------------------------------------------------------
            TAB 4: CAREER, TRANSFERS & HONOURS (المسيرة والألقاب)
            ----------------------------------------------------------------------- */}
        {activeTab === 'career' ? (
          <>
            {/* Career Clubs History */}
            {apiClubs.length > 0 || clubHistory.length > 0 ? (
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <Compass size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'الأندية السابقة والمواسم', 'Career Clubs & Seasons')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {apiClubs.map((club, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/60">
                      <LeagueCrest name={club.team.name} logoUrl={club.team.logoUrl} className="h-8 w-8 shrink-0 object-contain" />
                      <div className="min-w-0">
                        <strong className="block text-xs sm:text-sm font-bold text-foreground truncate">
                          {localizePlainName(locale, club.team.name)}
                        </strong>
                        <span className="block text-[11px] text-muted-foreground">
                          {club.seasons.length > 0
                            ? club.seasons.join(' · ')
                            : pick(locale, 'مواسم مسجلة', 'Recorded')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transfer History */}
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <Repeat size={18} className="text-orange-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'سجل الانتقالات الموثقة', 'Transfers History')}
                  </h3>
                </div>

                {transfers.length > 0 ? (
                  <div className="space-y-3">
                    {transfers.map((t, idx) => (
                      <div key={t.id || idx} className={board.transferItem}>
                        <div>
                          <strong className="block text-xs sm:text-sm font-bold text-foreground">
                            {t.fromTeam ? `${localizePlainName(locale, t.fromTeam)} ${locale === 'ar' ? '←' : '→'} ` : ''}
                            {localizePlainName(locale, t.toTeam) || pick(locale, 'صفقة انتقال', 'Transfer')}
                          </strong>
                          <span className="text-[11px] text-muted-foreground">
                            {t.date ? (
                              <ClientTime value={t.date} locale={locale} options={{ day: 'numeric', month: 'short', year: 'numeric' }} />
                            ) : (
                              pick(locale, 'تاريخ غير محدد', 'Date unspecified')
                            )}
                          </span>
                        </div>

                        <span className="text-xs font-black text-orange-500">
                          {t.fee || pick(locale, 'انتقال رسمي', 'Transfer')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-xs py-8">
                    {pick(locale, 'سجل الانتقالات لم يتم تسجيله في قاعدة البيانات.', 'No recorded transfers.')}
                  </p>
                )}
              </section>

              {/* Trophies & Honours */}
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <Award size={18} className="text-amber-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'سجل الألقاب والبطولات الموثقة', 'Honours & Trophies Won')}
                  </h3>
                </div>

                {trophies.length > 0 ? (
                  <div className="space-y-2.5">
                    {trophies.map((tr, idx) => {
                      const isGold = tr.place?.toLowerCase().includes('winner') || tr.place === '1';
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/60"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{isGold ? '🥇' : '🏆'}</span>
                            <div>
                              <strong className="block text-xs sm:text-sm font-bold text-foreground">
                                {localizePlainName(locale, tr.league)}
                              </strong>
                              <span className="text-[11px] text-muted-foreground">
                                {[tr.season, tr.country ? localizePlainName(locale, tr.country) : null].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          </div>

                          {tr.place ? (
                            <span className={`text-xs font-black ${isGold ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {tr.place}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-xs py-8">
                    {pick(locale, 'سجل الألقاب والبطولات جاري تحديثه وتوثيقه.', 'Trophies record is being updated.')}
                  </p>
                )}
              </section>
            </div>

            {/* Medical Log */}
            {sidelined.length > 0 ? (
              <section className={board.glassCard}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/40">
                  <AlertCircle size={18} className="text-red-500" />
                  <h3 className="text-base font-black text-foreground">
                    {pick(locale, 'السجل الطبي وتاريخ الإصابات', 'Medical & Injury Record')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {sidelined.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                      <strong className="block text-xs font-bold text-red-500">{item.type}</strong>
                      <span className="text-[11px] text-muted-foreground">
                        {[item.start, item.end].filter(Boolean).join(' — ')}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {/* -----------------------------------------------------------------------
            TAB 5: NEWS & REPORTS (آخر الأخبار والتقارير المرتبطة باللاعب)
            ----------------------------------------------------------------------- */}
        {activeTab === 'news' ? (
          news.length > 0 ? (
            <EditorialNewsSixGrid
              locale={locale}
              news={news}
              title={pick(locale, `آخر الأخبار والتقارير عن ${commonName}`, `Latest News & Reports for ${commonName}`)}
              subtitle={pick(
                locale,
                `تغطية إخبارية حصرية وشاملة لكافة كواليس ومستجدات ${commonName} من المصادر المعتمدة`,
                `Exclusive news coverage and behind-the-scenes reporting for ${commonName}`
              )}
            />
          ) : (
            <section className={board.glassCard}>
              <p className="text-center text-muted-foreground text-xs py-10">
                {pick(locale, 'لا توجد أخبار مسجلة حالياً مرتبطة بهذا اللاعب.', 'No news currently logged for this player.')}
              </p>
            </section>
          )
        ) : null}

      </main>
    </div>
  );
}
