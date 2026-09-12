// src/app/compare-players/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Award, Target, Info } from 'lucide-react';

export default async function PlayerComparisonPage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}) {
  const { p1: slug1, p2: slug2 } = await searchParams;

  if (!slug1 || !slug2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black mb-4">مقارنة اللاعبين</h1>
        <p className="text-muted-foreground">يرجى اختيار لاعبين للمقارنة.</p>
      </div>
    );
  }

  const [player1, player2] = await Promise.all([
    prisma.player.findUnique({ where: { slug: slug1 }, include: { teams: { where: { to: null }, include: { team: true } } } }),
    prisma.player.findUnique({ where: { slug: slug2 }, include: { teams: { where: { to: null }, include: { team: true } } } }),
  ]);

  if (!player1 || !player2) notFound();

  // 1. Fetch Aggregate Stats for both players
  const [stats1, stats2] = await Promise.all([
    prisma.matchEvent.groupBy({
      by: ['type'],
      where: { playerId: player1.id },
      _count: { id: true }
    }),
    prisma.matchEvent.groupBy({
      by: ['type'],
      where: { playerId: player2.id },
      _count: { id: true }
    })
  ]);

  const getStat = (stats: any[], type: string) => stats.find(s => s.type === type)?._count.id || 0;

  const compareStats = [
    { label: 'الأهداف', s1: getStat(stats1, 'GOAL'), s2: getStat(stats2, 'GOAL') },
    { label: 'البطاقات الصفراء', s1: getStat(stats1, 'YELLOW_CARD'), s2: getStat(stats2, 'YELLOW_CARD') },
    { label: 'البطاقات الحمراء', s1: getStat(stats1, 'RED_CARD'), s2: getStat(stats2, 'RED_CARD') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-12 text-center">مقارنة اللاعبين: {player1.name} vs {player2.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Player 1 Card */}
        <div className="bg-card dark:bg-background p-8 rounded-3xl shadow-xl text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center border-4 border-orange-500">
             <span className="text-4xl font-black text-muted-foreground">{player1.name.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-black">{player1.name}</h2>
          <span className="text-orange-500 font-bold block mt-1">{player1.teams[0]?.team.name}</span>
          <span className="text-xs text-muted-foreground mt-2 block">{player1.position}</span>
        </div>

        {/* Comparison Stats Middle */}
        <div className="space-y-6">
          {compareStats.map((stat, i) => {
             const max = Math.max(stat.s1, stat.s2) || 1;
             return (
              <div key={i} className="bg-card dark:bg-background p-6 rounded-2xl shadow-sm border border-gray-50 dark:border-border">
                <h4 className="text-center text-xs font-black text-muted-foreground mb-4 uppercase tracking-widest">{stat.label}</h4>
                <div className="flex items-center gap-4">
                  <span className={`w-8 text-center font-black ${stat.s1 > stat.s2 ? 'text-orange-500' : ''}`}>{stat.s1}</span>
                  <div className="flex-1 flex gap-1 h-2">
                    <div className="bg-orange-500 rounded-full transition-all" style={{ width: `${(stat.s1 / max) * 50}%` }}></div>
                    <div className="bg-brand-green rounded-full transition-all" style={{ width: `${(stat.s2 / max) * 50}%` }}></div>
                  </div>
                  <span className={`w-8 text-center font-black ${stat.s2 > stat.s1 ? 'text-brand-green' : ''}`}>{stat.s2}</span>
                </div>
              </div>
             );
          })}
        </div>

        {/* Player 2 Card */}
        <div className="bg-card dark:bg-background p-8 rounded-3xl shadow-xl text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center border-4 border-brand-green">
             <span className="text-4xl font-black text-muted-foreground">{player2.name.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-black">{player2.name}</h2>
          <span className="text-brand-green font-bold block mt-1">{player2.teams[0]?.team.name}</span>
          <span className="text-xs text-muted-foreground mt-2 block">{player2.position}</span>
        </div>
      </div>
    </div>
  );
}
