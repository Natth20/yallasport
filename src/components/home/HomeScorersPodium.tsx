'use client';

import React from 'react';
import { Medal, Flame, Trophy, Award, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export interface ScorerPodiumItem {
  id: string;
  name: string;
  photoUrl?: string | null;
  teamName: string;
  teamLogo?: string | null;
  leagueName: string;
  goals: number;
  assists?: number;
  rank: number;
}

const TOP_SCORERS_SAMPLE: ScorerPodiumItem[] = [
  {
    id: '1',
    name: 'إيرلينغ هالاند',
    photoUrl: 'https://media.api-sports.io/football/players/1100.png',
    teamName: 'مانشستر سيتي',
    teamLogo: 'https://media.api-sports.io/football/teams/50.png',
    leagueName: 'الدوري الإنجليزي',
    goals: 27,
    assists: 5,
    rank: 1,
  },
  {
    id: '2',
    name: 'كيليان مبابي',
    photoUrl: 'https://media.api-sports.io/football/players/278.png',
    teamName: 'ريال مدريد',
    teamLogo: 'https://media.api-sports.io/football/teams/541.png',
    leagueName: 'الدوري الإسباني',
    goals: 25,
    assists: 7,
    rank: 2,
  },
  {
    id: '3',
    name: 'كريستيانو رونالدو',
    photoUrl: 'https://media.api-sports.io/football/players/874.png',
    teamName: 'النصر',
    teamLogo: 'https://media.api-sports.io/football/teams/598.png',
    leagueName: 'دوري روشن',
    goals: 29,
    assists: 11,
    rank: 3,
  },
  {
    id: '4',
    name: 'هاري كين',
    photoUrl: 'https://media.api-sports.io/football/players/184.png',
    teamName: 'بايرن ميونخ',
    teamLogo: 'https://media.api-sports.io/football/teams/157.png',
    leagueName: 'الدوري الألماني',
    goals: 32,
    assists: 8,
    rank: 4,
  },
];

export function HomeScorersPodium({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';

  return (
    <div className="rounded-3xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-foreground">
              {isAr ? 'سباق الحذاء الذهبي والهدافين' : 'Golden Boot Scorers Race'}
            </h3>
            <p className="text-[11px] font-semibold text-foreground/50">
              {isAr ? 'أكثر اللاعبين تسجيلاً للأهداف في الدوريات الكبرى' : 'Top scorers across major world leagues'}
            </p>
          </div>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOP_SCORERS_SAMPLE.map((scorer) => {
          return (
            <div
              key={scorer.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card/80 p-4 transition-all hover:border-amber-500/50 hover:bg-card hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex items-center justify-between gap-2 pb-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                    scorer.rank === 1
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : scorer.rank === 2
                      ? 'bg-slate-300 text-black'
                      : scorer.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-white/10 text-foreground'
                  }`}
                >
                  {scorer.rank}
                </span>
                <span className="text-[10px] font-bold text-foreground/45">{scorer.leagueName}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-card/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scorer.photoUrl || '/placeholder-player.svg'}
                    alt={scorer.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
                    {scorer.name}
                  </h4>
                  <p className="truncate text-xs font-semibold text-foreground/60">{scorer.teamName}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2">
                <span className="text-[11px] font-bold text-foreground/50">{isAr ? 'الأهداف المسجلة:' : 'Goals:'}</span>
                <strong className="text-base font-black text-amber-400 tabular-nums">
                  {scorer.goals} ⚽
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
