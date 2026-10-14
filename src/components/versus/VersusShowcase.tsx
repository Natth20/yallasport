'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { CrestImage } from '@/components/common/CrestImage';
import { pick } from '@/i18n/pick';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import {
  ComparisonGroupCard,
  type ComparisonCategory,
} from '@/components/common/ComparisonIndicators';
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  Award,
  Calendar,
  Flame,
  Globe,
  Layers,
  MapPin,
  Newspaper,
  RotateCcw,
  Scale,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import type { VersusTeamOption } from './versus';
import { VersusPair } from './VersusPair';
import { QuickDerbyBar, type DerbyLink } from './QuickDerbyBar';

export interface TeamComparisonData {
  standA: any | null;
  standB: any | null;
  h2hGoalsA: number;
  h2hGoalsB: number;
  formA: { pts: number; gf: number; ga: number; clean: number; w: number; d: number; l: number; played: number };
  formB: { pts: number; gf: number; ga: number; clean: number; w: number; d: number; l: number; played: number };
  leftGoals: { matches: number; goals: number };
  rightGoals: { matches: number; goals: number };
  leftSquad: number;
  rightSquad: number;
  recA: { won: number; drawn: number; lost: number; skipped: number; played: number };
  recB: { won: number; drawn: number; lost: number; skipped: number; played: number };
  h2hRecent: Array<{
    id: string | number;
    kickoffAt: Date | string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { id: string; name: string; slug: string; logoUrl: string | null };
    awayTeam: { id: string; name: string; slug: string; logoUrl: string | null };
    league: { name: string };
  }>;
  leftFull: any | null;
  rightFull: any | null;
  leftLast: any | null;
  rightLast: any | null;
  leftFive: any[];
  rightFive: any[];
  shared: Array<{ name: string; slug: string }>;
}

export function VersusShowcase({
  locale,
  left,
  right,
  scale,
  derbyItems,
  localByExt,
}: {
  locale: string;
  left: { id: string; name: string; slug: string; logoUrl: string | null };
  right: { id: string; name: string; slug: string; logoUrl: string | null };
  scale: TeamComparisonData;
  derbyItems: DerbyLink[];
  localByExt: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<'tape' | 'h2h' | 'form' | 'club'>('tape');
  const [showSearch, setShowSearch] = useState(false);
  const ar = locale === 'ar';

  const leftName = localizeTeamName(locale, left.name);
  const rightName = localizeTeamName(locale, right.name);

  // -------------------------------------------------------------------------
  // 1. BUILD UNIFIED COMPARISON CATEGORIES
  // -------------------------------------------------------------------------
  const teamCategories: ComparisonCategory[] = [
    // A. League Campaign (Current Season)
    ...(scale.standA || scale.standB
      ? [
          {
            id: 'league',
            title: ar ? 'أداء وترتيب الدوري للموسم الحالي' : 'Current Season League Campaign',
            periodBadge: scale.standA?.seasonId
              ? ar
                ? `${scale.standA.league.name} · موسم ${scale.standA.seasonId}`
                : `${scale.standA.league.name} · ${scale.standA.seasonId}`
              : undefined,
            icon: <Trophy size={16} />,
            metrics: [
              {
                key: 'rank',
                label: ar ? 'الترتيب في جدول الدوري' : 'League Rank',
                subLabel: ar ? 'المركز الأقل أفضل' : 'lower is better',
                better: 'low' as const,
                left: scale.standA?.rank ?? null,
                right: scale.standB?.rank ?? null,
              },
              {
                key: 'pts',
                label: ar ? 'رصيد النقاط' : 'Total Points',
                subLabel: ar ? 'نقطة' : 'pts',
                left: scale.standA?.points ?? null,
                right: scale.standB?.points ?? null,
              },
              {
                key: 'played',
                label: ar ? 'المباريات الملعوبة' : 'Matches Played',
                subLabel: ar ? 'مباراة' : 'matches',
                left: scale.standA?.played ?? null,
                right: scale.standB?.played ?? null,
              },
              {
                key: 'won',
                label: ar ? 'الانتصارات' : 'Wins',
                left: scale.standA?.won ?? null,
                right: scale.standB?.won ?? null,
              },
              {
                key: 'drawn',
                label: ar ? 'التعادلات' : 'Draws',
                left: scale.standA?.drawn ?? null,
                right: scale.standB?.drawn ?? null,
              },
              {
                key: 'lost',
                label: ar ? 'الهزائم' : 'Losses',
                subLabel: ar ? 'الأقل أفضل' : 'lower is better',
                better: 'low' as const,
                left: scale.standA?.lost ?? null,
                right: scale.standB?.lost ?? null,
              },
              {
                key: 'winRate',
                label: ar ? 'نسبة الفوز' : 'Win Rate',
                suffix: '%',
                left: scale.standA?.played ? Math.round((scale.standA.won / scale.standA.played) * 100) : null,
                right: scale.standB?.played ? Math.round((scale.standB.won / scale.standB.played) * 100) : null,
              },
            ],
          },
        ]
      : []),

    // B. Offensive and Defensive Record
    {
      id: 'output',
      title: ar ? 'الكفاءة الهجومية والدفاعية' : 'Offensive & Defensive Record',
      periodBadge: ar ? 'أرقام الدوري المعتمدة' : 'Official Season Stats',
      icon: <Flame size={16} />,
      metrics: [
        {
          key: 'goalsFor',
          label: ar ? 'الأهداف المسجلة' : 'Goals Scored',
          left: scale.standA?.goalsFor ?? scale.leftGoals.goals,
          right: scale.standB?.goalsFor ?? scale.rightGoals.goals,
        },
        {
          key: 'gpm',
          label: ar ? 'معدل التسجيل في المباراة' : 'Goals / Match',
          left: scale.standA?.played
            ? Number((scale.standA.goalsFor / scale.standA.played).toFixed(2))
            : scale.leftGoals.matches
            ? Number((scale.leftGoals.goals / scale.leftGoals.matches).toFixed(2))
            : null,
          right: scale.standB?.played
            ? Number((scale.standB.goalsFor / scale.standB.played).toFixed(2))
            : scale.rightGoals.matches
            ? Number((scale.rightGoals.goals / scale.rightGoals.matches).toFixed(2))
            : null,
        },
        {
          key: 'goalsAgainst',
          label: ar ? 'الأهداف المستقبلة' : 'Goals Conceded',
          subLabel: ar ? 'الأقل أفضل' : 'lower is better',
          better: 'low' as const,
          left: scale.standA?.goalsAgainst ?? null,
          right: scale.standB?.goalsAgainst ?? null,
        },
        {
          key: 'gaPerMatch',
          label: ar ? 'معدل الاستقبال في المباراة' : 'Conceded / Match',
          subLabel: ar ? 'الأقل أفضل' : 'lower is better',
          better: 'low' as const,
          left: scale.standA?.played ? Number((scale.standA.goalsAgainst / scale.standA.played).toFixed(2)) : null,
          right: scale.standB?.played ? Number((scale.standB.goalsAgainst / scale.standB.played).toFixed(2)) : null,
        },
        {
          key: 'goalDiff',
          label: ar ? 'فارق الأهداف' : 'Goal Difference',
          left: scale.standA ? scale.standA.goalsFor - scale.standA.goalsAgainst : null,
          right: scale.standB ? scale.standB.goalsFor - scale.standB.goalsAgainst : null,
        },
        {
          key: 'squad',
          label: ar ? 'قائمة اللاعبين المسجلين' : 'Registered Squad',
          subLabel: ar ? 'لاعب' : 'players',
          left: scale.leftSquad || null,
          right: scale.rightSquad || null,
        },
      ],
    },

    // C. Head to Head Record
    {
      id: 'h2h',
      title: ar ? 'سجل المواجهات المباشرة الموثقة' : 'Head-to-Head Record',
      periodBadge: ar
        ? `${scale.recA.played} مواجهات موثقة رسمياً`
        : `${scale.recA.played} Official Matches`,
      icon: <Swords size={16} />,
      metrics: [
        {
          key: 'h2hWins',
          label: ar ? 'الانتصارات المباشرة' : 'Direct Wins',
          left: scale.recA.won,
          right: scale.recB.won,
        },
        {
          key: 'h2hDraws',
          label: ar ? 'التعادلات في المواجهات' : 'H2H Draws',
          left: scale.recA.drawn,
          right: scale.recB.drawn,
        },
        {
          key: 'h2hGoals',
          label: ar ? 'أهداف المواجهات المباشرة' : 'H2H Goals Scored',
          left: scale.h2hGoalsA,
          right: scale.h2hGoalsB,
        },
        {
          key: 'h2hWinRate',
          label: ar ? 'نسبة الفوز في المواجهات' : 'H2H Win Rate %',
          suffix: '%',
          left: scale.recA.played > 0 ? Math.round((scale.recA.won / scale.recA.played) * 100) : null,
          right: scale.recA.played > 0 ? Math.round((scale.recB.won / scale.recA.played) * 100) : null,
        },
      ],
    },

    // D. Recent Form Guide
    {
      id: 'form',
      title: ar ? 'حالة الفريق في آخر 5 مباريات رسمية' : 'Form Guide (Last 5 Matches)',
      periodBadge: ar ? 'آخر 5 مباريات' : 'Last 5 Matches',
      icon: <TrendingUp size={16} />,
      metrics: [
        {
          key: 'formPts',
          label: ar ? 'النقاط المحصودة من 15' : 'Points from 15',
          subLabel: ar ? 'نقطة' : 'pts',
          left: scale.formA.pts,
          right: scale.formB.pts,
        },
        {
          key: 'formWins',
          label: ar ? 'الانتصارات في آخر 5' : 'Wins in Last 5',
          left: scale.formA.w,
          right: scale.formB.w,
        },
        {
          key: 'formGf',
          label: ar ? 'الأهداف المسجلة في آخر 5' : 'Goals in Last 5',
          left: scale.formA.gf,
          right: scale.formB.gf,
        },
        {
          key: 'formGa',
          label: ar ? 'الأهداف المستقبلة في آخر 5' : 'Conceded in Last 5',
          subLabel: ar ? 'الأقل أفضل' : 'lower is better',
          better: 'low' as const,
          left: scale.formA.ga,
          right: scale.formB.ga,
        },
        {
          key: 'formClean',
          label: ar ? 'الشباك النظيفة' : 'Clean Sheets',
          left: scale.formA.clean,
          right: scale.formB.clean,
        },
      ],
    },
  ];

  const asOption = (row: { id: string; slug: string; name: string; logoUrl: string | null }): VersusTeamOption => ({
    id: row.id,
    slug: row.slug,
    name: localizeTeamName(locale, row.name),
    logoUrl: row.logoUrl,
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ----------------- TOP DERBY BAR ----------------- */}
      <QuickDerbyBar items={derbyItems} locale={locale} />

      {/* ----------------- GRAND STADIUM ARENA SHOWCASE (FACE-OFF BANNER) ----------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/95 via-card/85 to-card/65 p-4 sm:p-7 backdrop-blur-2xl shadow-2xl">
        {/* Ambient Backlight Glows */}
        <div className="absolute -top-24 -start-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -end-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        {/* Duel Container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
          {/* ================= LEFT TEAM SPOTLIGHT (الفريق الأول) ================= */}
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-4 text-center sm:text-start w-full">
            <Link
              href={`/team/${left.slug}`}
              className="relative group flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border border-border/60 bg-muted/30 p-3.5 shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <CrestImage src={left.logoUrl} name={leftName} size={84} className="h-full w-full object-contain" />
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-foreground/10 group-hover:ring-emerald-500/40 transition-colors" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Link
                  href={`/team/${left.slug}`}
                  className="text-lg sm:text-2xl font-black text-foreground tracking-tight hover:text-emerald-500 transition-colors truncate max-w-full block"
                >
                  {leftName}
                </Link>
                {scale.standA?.rank ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-500 border border-emerald-500/20">
                    #{scale.standA.rank} {ar ? 'في الدوري' : 'in League'}
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {scale.leftFull?.venue?.name ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} className="text-emerald-500" />
                    <span>{scale.leftFull.venue.name}</span>
                  </span>
                ) : null}
                {scale.leftFull?.founded ? (
                  <span>· {ar ? `تأسس عام ${scale.leftFull.founded}` : `Est. ${scale.leftFull.founded}`}</span>
                ) : null}
              </p>

              {/* Head-to-Head Pill */}
              <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-foreground/90 border border-border/70 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>
                    {scale.recA.won} {ar ? 'فوز مباشر' : 'H2H Wins'}
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  ({scale.recA.drawn} {ar ? 'تعادل' : 'Draws'})
                </span>
              </div>
            </div>
          </div>

          {/* ================= CENTRAL VS EMBLEM ================= */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 py-2">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white font-black text-lg sm:text-xl shadow-xl shadow-orange-500/25 ring-2 ring-white/20 select-none">
              VS
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/compare?team1=${encodeURIComponent(right.slug)}&team2=${encodeURIComponent(left.slug)}`}
                className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-black text-muted-foreground border border-border/70 hover:border-orange-500 hover:text-orange-500 transition-all"
                title={ar ? 'تبديل موقع الفريقين' : 'Swap teams'}
              >
                <ArrowLeftRight size={12} />
                <span>{ar ? 'تبديل' : 'Swap'}</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-black text-muted-foreground border border-border/70 hover:border-orange-500 hover:text-orange-500 transition-all"
              >
                <span>{showSearch ? (ar ? 'إخفاء البحث' : 'Hide Search') : (ar ? 'تغيير الفرق' : 'Change Teams')}</span>
              </button>
            </div>
          </div>

          {/* ================= RIGHT TEAM SPOTLIGHT (الفريق الثاني) ================= */}
          <div className="flex flex-1 flex-col sm:flex-row-reverse items-center gap-4 text-center sm:text-end w-full">
            <Link
              href={`/team/${right.slug}`}
              className="relative group flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border border-border/60 bg-muted/30 p-3.5 shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <CrestImage src={right.logoUrl} name={rightName} size={84} className="h-full w-full object-contain" />
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-foreground/10 group-hover:ring-orange-500/40 transition-colors" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                {scale.standB?.rank ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-black text-orange-500 border border-orange-500/20">
                    #{scale.standB.rank} {ar ? 'في الدوري' : 'in League'}
                  </span>
                ) : null}
                <Link
                  href={`/team/${right.slug}`}
                  className="text-lg sm:text-2xl font-black text-foreground tracking-tight hover:text-orange-500 transition-colors truncate max-w-full block"
                >
                  {rightName}
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center justify-center sm:justify-end gap-2">
                {scale.rightFull?.founded ? (
                  <span>{ar ? `تأسس عام ${scale.rightFull.founded}` : `Est. ${scale.rightFull.founded}`} · </span>
                ) : null}
                {scale.rightFull?.venue?.name ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} className="text-orange-500" />
                    <span>{scale.rightFull.venue.name}</span>
                  </span>
                ) : null}
              </p>

              {/* Head-to-Head Pill */}
              <div className="mt-2.5 flex items-center justify-center sm:justify-end gap-2">
                <span className="text-[11px] text-muted-foreground font-semibold">
                  ({scale.recB.drawn} {ar ? 'تعادل' : 'Draws'})
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-foreground/90 border border-border/70 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>
                    {scale.recB.won} {ar ? 'فوز مباشر' : 'H2H Wins'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- COLLAPSIBLE TEAM PICKER FORM ----------------- */}
      {showSearch ? (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50">
            <h3 className="text-sm font-black text-foreground">
              {ar ? 'ابحث عن أندية أخرى للمقارنة' : 'Search other clubs to compare'}
            </h3>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-bold"
            >
              {ar ? 'إغلاق' : 'Close'}
            </button>
          </div>
          <VersusPair
            locale={locale}
            initialA={asOption(left)}
            initialB={asOption(right)}
          />
        </div>
      ) : null}

      {/* ----------------- EXECUTIVE TABS NAVIGATION ----------------- */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card/70 border border-border/60 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('tape')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'tape'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Scale size={16} />
          <span>{ar ? 'المقارنة الشاملة والأرقام' : 'Tale of the Tape'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('h2h')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'h2h'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Swords size={16} />
          <span>
            {ar ? 'أرشيف المواجهات المباشرة' : 'Head-to-Head Matches'} ({scale.h2hRecent.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'form'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <TrendingUp size={16} />
          <span>{ar ? 'سلسلة آخر 5 مباريات' : 'Recent Form'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('club')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'club'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <MapPin size={16} />
          <span>{ar ? 'المعقل والملعب والتاريخ' : 'Stadium & Ground'}</span>
        </button>
      </div>

      {/* ----------------- TAB 1: TALE OF THE TAPE (المقارنة الرقمية الشاملة) ----------------- */}
      {activeTab === 'tape' ? (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
          {teamCategories.map((cat) => (
            <ComparisonGroupCard
              key={cat.id}
              category={cat}
              leftLabel={leftName}
              rightLabel={rightName}
            />
          ))}
        </div>
      ) : null}

      {/* ----------------- TAB 2: HEAD TO HEAD ARCHIVE (أرشيف المواجهات) ----------------- */}
      {activeTab === 'h2h' ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="text-base font-black text-foreground">
                {ar ? 'أرشيف وتاريخ اللقاءات المباشرة' : 'Head-to-Head Clashes Archive'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `سجل آخر المواجهات الرسمية الموثقة بين ${leftName} و ${rightName}`
                  : `Historical encounters between ${leftName} and ${rightName}`}
              </p>
            </div>
            <span className="text-xs font-black text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
              {scale.h2hRecent.length} {ar ? 'مباريات' : 'Matches'}
            </span>
          </div>

          {scale.h2hRecent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {scale.h2hRecent.map((m) => {
                const homeName = localizeTeamName(locale, m.homeTeam.name);
                const awayName = localizeTeamName(locale, m.awayTeam.name);
                const hasScore = m.homeScore != null && m.awayScore != null;
                const matchLink = localByExt[String(m.id)] || localByExt[String((m as any).externalId)];

                const CardContent = (
                  <div className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md transition-all duration-200 hover:border-orange-500/50 hover:bg-card hover:shadow-lg">
                    {/* Header: League & Date */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border/40">
                      <span className="font-bold text-foreground/80">{m.league.name}</span>
                      <ClientTime
                        value={m.kickoffAt}
                        options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                        className="tabular-nums"
                      />
                    </div>

                    {/* Scoreboard Body */}
                    <div className="flex items-center justify-between gap-3 py-3">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {m.homeTeam.logoUrl ? (
                          <img src={m.homeTeam.logoUrl} alt="" className="h-6 w-6 object-contain shrink-0" />
                        ) : null}
                        <span className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                          {homeName}
                        </span>
                      </div>

                      {/* Score Result Pill */}
                      <div className="shrink-0 px-3 py-1 rounded-xl bg-muted/70 text-foreground font-black text-sm sm:text-base tabular-nums border border-border/50">
                        {hasScore ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-end">
                        <span className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                          {awayName}
                        </span>
                        {m.awayTeam.logoUrl ? (
                          <img src={m.awayTeam.logoUrl} alt="" className="h-6 w-6 object-contain shrink-0" />
                        ) : null}
                      </div>
                    </div>

                    {/* View Match CTA */}
                    {matchLink ? (
                      <div className="pt-2 border-t border-border/40 flex items-center justify-end text-[11px] font-bold text-orange-500 group-hover:text-orange-400">
                        <span>{ar ? 'تفاصيل المباراة' : 'Match Details'}</span>
                        <ArrowLeft size={11} className="rtl:rotate-0 ltr:rotate-180 ms-1" />
                      </div>
                    ) : null}
                  </div>
                );

                return matchLink ? (
                  <Link key={m.id} href={`/match/${matchLink}`} className="block text-inherit no-underline">
                    {CardContent}
                  </Link>
                ) : (
                  <div key={m.id}>{CardContent}</div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-8">
              {ar ? 'لا توجد مواجهات مباشرة مسجلة في الأرشيف.' : 'No recorded direct matches in the archive.'}
            </p>
          )}
        </div>
      ) : null}

      {/* ----------------- TAB 3: RECENT FORM (سلسلة النتائج الأخيرة) ----------------- */}
      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
          {/* Left Team Form */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 mb-4">
              {left.logoUrl ? <img src={left.logoUrl} alt="" className="h-6 w-6 object-contain" /> : null}
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {ar ? `آخر 5 مباريات لـ ${leftName}` : `${leftName} Last 5 Matches`}
              </h3>
            </div>

            {scale.leftFive && scale.leftFive.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {scale.leftFive.map((row) => {
                  const home = row.homeTeamId === left.id;
                  const scored = home ? row.homeScore : row.awayScore;
                  const conceded = home ? row.awayScore : row.homeScore;
                  const mark =
                    scored == null || conceded == null ? '—' : scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
                  const opp = home ? row.awayTeam?.name : row.homeTeam?.name;
                  return (
                    <Link
                      key={row.id}
                      href={`/match/${row.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                            mark === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : mark === 'D'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {mark}
                        </span>
                        <div>
                          <strong className="block text-xs font-black text-foreground">
                            {localizeTeamName(locale, opp || '')}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">{row.league?.name}</span>
                        </div>
                      </div>

                      <div className="text-xs font-black text-foreground tabular-nums">
                        {row.homeScore} - {row.awayScore}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                {ar ? 'لا توجد مباريات مسجلة.' : 'No matches logged.'}
              </p>
            )}
          </div>

          {/* Right Team Form */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 mb-4">
              {right.logoUrl ? <img src={right.logoUrl} alt="" className="h-6 w-6 object-contain" /> : null}
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {ar ? `آخر 5 مباريات لـ ${rightName}` : `${rightName} Last 5 Matches`}
              </h3>
            </div>

            {scale.rightFive && scale.rightFive.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {scale.rightFive.map((row) => {
                  const home = row.homeTeamId === right.id;
                  const scored = home ? row.homeScore : row.awayScore;
                  const conceded = home ? row.awayScore : row.homeScore;
                  const mark =
                    scored == null || conceded == null ? '—' : scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
                  const opp = home ? row.awayTeam?.name : row.homeTeam?.name;
                  return (
                    <Link
                      key={row.id}
                      href={`/match/${row.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                            mark === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : mark === 'D'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {mark}
                        </span>
                        <div>
                          <strong className="block text-xs font-black text-foreground">
                            {localizeTeamName(locale, opp || '')}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">{row.league?.name}</span>
                        </div>
                      </div>

                      <div className="text-xs font-black text-foreground tabular-nums">
                        {row.homeScore} - {row.awayScore}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                {ar ? 'لا توجد مباريات مسجلة.' : 'No matches logged.'}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* ----------------- TAB 4: STADIUM & HERITAGE (الملعب والمعقل والتاريخ) ----------------- */}
      {activeTab === 'club' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
          {/* Left Club Heritage */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <MapPin size={16} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-foreground">{leftName}</h3>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground font-semibold">{ar ? 'الملعب الرسمي' : 'Home Stadium'}</span>
                <strong className="text-foreground font-black">{scale.leftFull?.venue?.name || '—'}</strong>
              </div>

              {scale.leftFull?.venue?.capacity ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'السعة الجماهيرية' : 'Capacity'}</span>
                  <strong className="text-foreground font-black tabular-nums">
                    {scale.leftFull.venue.capacity.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')} {ar ? 'متفرج' : 'seats'}
                  </strong>
                </div>
              ) : null}

              {scale.leftFull?.founded ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'سنة التأسيس' : 'Founded'}</span>
                  <strong className="text-foreground font-black tabular-nums">{scale.leftFull.founded}</strong>
                </div>
              ) : null}

              {scale.leftFull?.coach ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'المدير الفني' : 'Head Coach'}</span>
                  <strong className="text-foreground font-black">
                    {localizePlainName(locale, scale.leftFull.coach.name)}
                  </strong>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Club Heritage */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <MapPin size={16} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-foreground">{rightName}</h3>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground font-semibold">{ar ? 'الملعب الرسمي' : 'Home Stadium'}</span>
                <strong className="text-foreground font-black">{scale.rightFull?.venue?.name || '—'}</strong>
              </div>

              {scale.rightFull?.venue?.capacity ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'السعة الجماهيرية' : 'Capacity'}</span>
                  <strong className="text-foreground font-black tabular-nums">
                    {scale.rightFull.venue.capacity.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')} {ar ? 'متفرج' : 'seats'}
                  </strong>
                </div>
              ) : null}

              {scale.rightFull?.founded ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'سنة التأسيس' : 'Founded'}</span>
                  <strong className="text-foreground font-black tabular-nums">{scale.rightFull.founded}</strong>
                </div>
              ) : null}

              {scale.rightFull?.coach ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground font-semibold">{ar ? 'المدير الفني' : 'Head Coach'}</span>
                  <strong className="text-foreground font-black">
                    {localizePlainName(locale, scale.rightFull.coach.name)}
                  </strong>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
