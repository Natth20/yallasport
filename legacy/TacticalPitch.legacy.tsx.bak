'use client';

import React, { useState } from 'react';
import type { NormalizedLineup } from '@/lib/sports-data/types';
import { Shield, Users, Eye } from 'lucide-react';

interface TacticalPitchProps {
  homeTeamName: string;
  awayTeamName: string;
  homeLineup?: NormalizedLineup;
  awayLineup?: NormalizedLineup;
  locale?: string;
}

// Helpers to calculate coordinates based on formation like 4-3-3, 4-2-3-1, 3-5-2
function getCoordinatesForFormation(formation: string | undefined, isAway: boolean = false) {
  const parts = (formation || '4-3-3').split('-').map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
  const lines = [1, ...parts]; // 1 for GK
  const totalLines = lines.length;

  const positions: { x: number; y: number }[] = [];

  lines.forEach((countInLine, lineIndex) => {
    // Y position from bottom (GK) to top (Attack)
    const yPercent = ((lineIndex + 0.6) / (totalLines + 0.2)) * 100;
    const finalY = isAway ? 100 - yPercent : yPercent;

    for (let i = 0; i < countInLine; i++) {
      const xPercent = ((i + 1) / (countInLine + 1)) * 100;
      positions.push({ x: xPercent, y: finalY });
    }
  });

  return positions;
}

export function TacticalPitch({
  homeTeamName,
  awayTeamName,
  homeLineup,
  awayLineup,
  locale = 'ar',
}: TacticalPitchProps) {
  const isAr = locale === 'ar';
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  const activeLineup = selectedTeam === 'home' ? homeLineup : awayLineup;
  const activeTeamName = selectedTeam === 'home' ? homeTeamName : awayTeamName;
  const formation = activeLineup?.formation || '4-3-3';
  const players = activeLineup?.players || [];

  const coords = getCoordinatesForFormation(formation, false);

  return (
    <div className="space-y-4">
      {/* Team selector tabs */}
      <div className="flex items-center justify-between rounded-2xl bg-foreground/5 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            selectedTeam === 'home'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {homeTeamName} ({homeLineup?.formation || '4-3-3'})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            selectedTeam === 'away'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {awayTeamName} ({awayLineup?.formation || '4-3-3'})
        </button>
      </div>

      {/* The Football Pitch Graphic */}
      <div className="relative mx-auto aspect-[3/4] max-h-[580px] w-full max-w-md overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 p-4 shadow-2xl">
        {/* Pitch Turf Pattern Lines */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <div className="h-1/5 w-full bg-black/20" />
          <div className="h-1/5 w-full bg-white/10" />
          <div className="h-1/5 w-full bg-black/20" />
          <div className="h-1/5 w-full bg-white/10" />
          <div className="h-1/5 w-full bg-black/20" />
        </div>

        {/* Outer Boundary & Center Line */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/25">
          {/* Halfway line */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-white/25" />
          {/* Center Circle */}
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />

          {/* Top Penalty Box */}
          <div className="absolute left-1/2 top-0 h-20 w-44 -translate-x-1/2 border-b border-l border-r border-white/25">
            {/* Goal Area */}
            <div className="absolute left-1/2 top-0 h-9 w-20 -translate-x-1/2 border-b border-l border-r border-white/25" />
          </div>

          {/* Bottom Penalty Box */}
          <div className="absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 border-l border-r border-t border-white/25">
            {/* Goal Area */}
            <div className="absolute bottom-0 left-1/2 h-9 w-20 -translate-x-1/2 border-l border-r border-t border-white/25" />
          </div>
        </div>

        {/* Formation & Status Badge */}
        <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-xl bg-black/50 px-3 py-1.5 text-[10px] font-black text-emerald-300 backdrop-blur-md">
          <Shield className="h-3 w-3" />
          <span>{activeTeamName}</span>
          <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-white">
            {formation}
          </span>
        </div>

        {/* Interactive Player Tokens */}
        <div className="relative h-full w-full">
          {players.length > 0 ? (
            players.slice(0, 11).map((player, idx) => {
              const pos = coords[idx] || { x: 50, y: 50 };
              const isGk = idx === 0 || player.position === 'GK';

              return (
                <div
                  key={player.id || `${player.name}-${idx}`}
                  style={{
                    left: `${pos.x}%`,
                    bottom: `${pos.y}%`,
                    transform: 'translate(-50%, 50%)',
                  }}
                  className="group absolute z-20 flex flex-col items-center transition-transform hover:scale-125"
                >
                  {/* Player Token */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black shadow-lg transition-all ${
                      isGk
                        ? 'border-amber-400 bg-amber-500 text-black shadow-amber-500/40'
                        : selectedTeam === 'home'
                        ? 'border-primary bg-primary/90 text-white shadow-primary/40'
                        : 'border-sky-400 bg-sky-600 text-white shadow-sky-500/40'
                    }`}
                  >
                    {player.number ?? idx + 1}
                  </div>

                  {/* Player Name Pill */}
                  <span className="mt-1 max-w-[80px] truncate rounded-md bg-black/75 px-1.5 py-0.5 text-center text-[9px] font-bold text-white backdrop-blur-sm group-hover:bg-primary">
                    {player.name}
                  </span>
                </div>
              );
            })
          ) : (
            // Placeholder tokens if lineup is not announced yet
            coords.slice(0, 11).map((pos, idx) => (
              <div
                key={idx}
                style={{
                  left: `${pos.x}%`,
                  bottom: `${pos.y}%`,
                  transform: 'translate(-50%, 50%)',
                }}
                className="absolute z-20 flex flex-col items-center opacity-40"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/20 text-[10px] font-bold text-white">
                  {idx + 1}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
