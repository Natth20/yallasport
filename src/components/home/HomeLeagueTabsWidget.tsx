'use client';

import React, { useState } from 'react';
import { Trophy, ChevronRight, TrendingUp, Shield } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export interface StandingsRow {
  rank: number;
  team: { id: string; name: string; slug?: string; logoUrl: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsDiff: number;
}

export interface LeagueTabData {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  logoUrl?: string;
  standings: StandingsRow[];
}

const SAMPLE_LEAGUES: LeagueTabData[] = [
  {
    id: 'epl',
    nameAr: 'الدوري الإنجليزي 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    nameEn: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    slug: 'premier-league-39',
    standings: [
      { rank: 1, team: { id: 'mc', name: 'مانشستر سيتي', logoUrl: 'https://media.api-sports.io/football/teams/50.png' }, played: 28, won: 20, drawn: 5, lost: 3, goalsDiff: 41, points: 65 },
      { rank: 2, team: { id: 'liv', name: 'ليفربول', logoUrl: 'https://media.api-sports.io/football/teams/40.png' }, played: 28, won: 19, drawn: 7, lost: 2, goalsDiff: 39, points: 64 },
      { rank: 3, team: { id: 'ars', name: 'أرسنال', logoUrl: 'https://media.api-sports.io/football/teams/42.png' }, played: 28, won: 19, drawn: 6, lost: 3, goalsDiff: 40, points: 63 },
      { rank: 4, team: { id: 'av', name: 'أستون فيلا', logoUrl: 'https://media.api-sports.io/football/teams/66.png' }, played: 28, won: 17, drawn: 4, lost: 7, goalsDiff: 18, points: 55 },
      { rank: 5, team: { id: 'tot', name: 'توتنهام', logoUrl: 'https://media.api-sports.io/football/teams/47.png' }, played: 27, won: 16, drawn: 5, lost: 6, goalsDiff: 16, points: 53 },
    ],
  },
  {
    id: 'laliga',
    nameAr: 'الدوري الإسباني 🇪🇸',
    nameEn: 'La Liga 🇪🇸',
    slug: 'la-liga-140',
    standings: [
      { rank: 1, team: { id: 'rm', name: 'ريال مدريد', logoUrl: 'https://media.api-sports.io/football/teams/541.png' }, played: 28, won: 21, drawn: 6, lost: 1, goalsDiff: 42, points: 69 },
      { rank: 2, team: { id: 'gir', name: 'جيرونا', logoUrl: 'https://media.api-sports.io/football/teams/547.png' }, played: 28, won: 19, drawn: 5, lost: 4, goalsDiff: 26, points: 62 },
      { rank: 3, team: { id: 'fcb', name: 'برشلونة', logoUrl: 'https://media.api-sports.io/football/teams/529.png' }, played: 28, won: 18, drawn: 7, lost: 3, goalsDiff: 23, points: 61 },
      { rank: 4, team: { id: 'atm', name: 'أتلتيكو مدريد', logoUrl: 'https://media.api-sports.io/football/teams/530.png' }, played: 28, won: 17, drawn: 4, lost: 7, goalsDiff: 23, points: 55 },
      { rank: 5, team: { id: 'ath', name: 'أتلتيك بيلباو', logoUrl: 'https://media.api-sports.io/football/teams/531.png' }, played: 28, won: 15, drawn: 8, lost: 5, goalsDiff: 22, points: 53 },
    ],
  },
  {
    id: 'spl',
    nameAr: 'دوري روشن السعودي 🇸🇦',
    nameEn: 'Saudi Pro League 🇸🇦',
    slug: 'saudi-pro-league-307',
    standings: [
      { rank: 1, team: { id: 'hil', name: 'الهلال', logoUrl: 'https://media.api-sports.io/football/teams/597.png' }, played: 24, won: 22, drawn: 2, lost: 0, goalsDiff: 60, points: 68 },
      { rank: 2, team: { id: 'nas', name: 'النصر', logoUrl: 'https://media.api-sports.io/football/teams/598.png' }, played: 24, won: 17, drawn: 2, lost: 5, goalsDiff: 32, points: 53 },
      { rank: 3, team: { id: 'ahl', name: 'الأهلي', logoUrl: 'https://media.api-sports.io/football/teams/599.png' }, played: 24, won: 14, drawn: 5, lost: 5, goalsDiff: 21, points: 47 },
      { rank: 4, team: { id: 'itt', name: 'الاتحاد', logoUrl: 'https://media.api-sports.io/football/teams/600.png' }, played: 24, won: 12, drawn: 4, lost: 8, goalsDiff: 11, points: 40 },
      { rank: 5, team: { id: 'taa', name: 'التعاون', logoUrl: 'https://media.api-sports.io/football/teams/601.png' }, played: 24, won: 11, drawn: 6, lost: 7, goalsDiff: 10, points: 39 },
    ],
  },
];

export function HomeLeagueTabsWidget({
  dbLeagues = [],
  locale = 'ar',
}: {
  dbLeagues?: any[];
  locale?: string;
}) {
  const [selectedLeague, setSelectedLeague] = useState<string>('epl');
  const isAr = locale === 'ar';

  const current = SAMPLE_LEAGUES.find((l) => l.id === selectedLeague) || SAMPLE_LEAGUES[0];

  return (
    <div className="rounded-3xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-foreground">
              {isAr ? 'ترتيب الدوريات الكبرى (Top Leagues Standings)' : 'Top Leagues Standings'}
            </h3>
            <p className="text-[11px] font-semibold text-foreground/50">
              {isAr ? 'صراع الصدارة والمقاعد المؤهلة لحظة بلحظة' : 'Live championship & European spot race'}
            </p>
          </div>
        </div>

        {/* League Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-foreground/5 p-1">
          {SAMPLE_LEAGUES.map((league) => (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelectedLeague(league.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                selectedLeague === league.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {isAr ? league.nameAr : league.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-black uppercase text-foreground/50">
              <th className="py-2.5 ps-3 text-start w-12">{isAr ? 'المركز' : 'Pos'}</th>
              <th className="py-2.5 text-start">{isAr ? 'النادي' : 'Club'}</th>
              <th className="py-2.5 text-center">{isAr ? 'لعب' : 'P'}</th>
              <th className="py-2.5 text-center">{isAr ? 'ف' : 'W'}</th>
              <th className="py-2.5 text-center">{isAr ? 'ت' : 'D'}</th>
              <th className="py-2.5 text-center">{isAr ? 'خ' : 'L'}</th>
              <th className="py-2.5 text-center">{isAr ? '+/-' : 'GD'}</th>
              <th className="py-2.5 pe-3 text-end font-bold text-primary">{isAr ? 'النقاط' : 'Pts'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {current.standings.map((row) => (
              <tr
                key={row.team.id}
                className="group transition-colors hover:bg-white/5"
              >
                <td className="py-2.5 ps-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                      row.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 font-black'
                        : row.rank <= 4
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-foreground/60'
                    }`}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    {row.team.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.team.logoUrl}
                        alt=""
                        className="h-5 w-5 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-foreground/10" />
                    )}
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {row.team.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center font-semibold text-foreground/70 tabular-nums">{row.played}</td>
                <td className="py-2.5 text-center font-semibold text-emerald-400 tabular-nums">{row.won}</td>
                <td className="py-2.5 text-center font-semibold text-foreground/50 tabular-nums">{row.drawn}</td>
                <td className="py-2.5 text-center font-semibold text-red-400 tabular-nums">{row.lost}</td>
                <td className="py-2.5 text-center font-bold text-foreground/80 tabular-nums">
                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                </td>
                <td className="py-2.5 pe-3 text-end font-black text-primary text-sm tabular-nums">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-foreground/50">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {isAr ? 'المتصدر' : 'Leader'}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            {isAr ? 'دوري أبطال أوروبا' : 'Champions League'}
          </span>
        </div>
        <Link
          href={`/league/${current.slug}`}
          className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
        >
          <span>{isAr ? 'عرض جدول الترتيب الكامل' : 'Full Standings Table'}</span>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
