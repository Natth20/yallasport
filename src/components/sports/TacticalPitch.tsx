'use client';

import React, { useState } from 'react';
import type { NormalizedLineup, NormalizedLineupPlayer } from '@/lib/sports-data/types';
import { Shield, User, Users } from 'lucide-react';
import { pick } from '@/i18n/pick';

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
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [activePlayer, setActivePlayer] = useState<NormalizedLineupPlayer | null>(null);

  const activeLineup = selectedTeam === 'home' ? homeLineup : awayLineup;
  const activeTeamName = selectedTeam === 'home' ? homeTeamName : awayTeamName;
  const formation = activeLineup?.formation || '4-3-3';
  const players = activeLineup?.players || [];
  const bench = activeLineup?.bench || [];
  const coach = activeLineup?.coach;

  const coords = getCoordinatesForFormation(formation, false);

  return (
    <div className="space-y-6">
      {/* Team selector tabs */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/40 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            setSelectedTeam('home');
            setActivePlayer(null);
          }}
          className={`flex-1 rounded-xl py-2.5 px-3 text-xs font-black transition-all ${
            selectedTeam === 'home'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          {homeTeamName} ({homeLineup?.formation || '4-3-3'})
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedTeam('away');
            setActivePlayer(null);
          }}
          className={`flex-1 rounded-xl py-2.5 px-3 text-xs font-black transition-all ${
            selectedTeam === 'away'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          {awayTeamName} ({awayLineup?.formation || '4-3-3'})
        </button>
      </div>

      {/* The Football Pitch Graphic */}
      <div className="relative mx-auto aspect-[3/4.2] max-h-[620px] w-full max-w-lg overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-[#062414] via-[#0b3820] to-[#062414] p-4 shadow-2xl">
        {/* Pitch Turf Pattern Lines */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="h-[14.28%] w-full bg-black/25" />
          <div className="h-[14.28%] w-full bg-white/10" />
          <div className="h-[14.28%] w-full bg-black/25" />
          <div className="h-[14.28%] w-full bg-white/10" />
          <div className="h-[14.28%] w-full bg-black/25" />
          <div className="h-[14.28%] w-full bg-white/10" />
          <div className="h-[14.28%] w-full bg-black/25" />
        </div>

        {/* Outer Boundary & Center Line */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/30">
          {/* Halfway line */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-white/30" />
          {/* Center Circle */}
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />

          {/* Top Penalty Box */}
          <div className="absolute left-1/2 top-0 h-20 w-44 -translate-x-1/2 border-b border-l border-r border-white/30">
            {/* Goal Area */}
            <div className="absolute left-1/2 top-0 h-8 w-20 -translate-x-1/2 border-b border-l border-r border-white/30" />
            {/* Penalty Spot */}
            <div className="absolute bottom-4 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/60" />
          </div>

          {/* Bottom Penalty Box */}
          <div className="absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 border-l border-r border-t border-white/30">
            {/* Goal Area */}
            <div className="absolute bottom-0 left-1/2 h-8 w-20 -translate-x-1/2 border-l border-r border-t border-white/30" />
            {/* Penalty Spot */}
            <div className="absolute top-4 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/60" />
          </div>
        </div>

        {/* Formation & Team Header Badge */}
        <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 text-[11px] font-black text-emerald-300 backdrop-blur-md border border-white/10 shadow-lg">
          <Shield className="h-3.5 w-3.5 text-orange-400" />
          <span>{activeTeamName}</span>
          <span className="rounded-md bg-emerald-500/30 px-1.5 py-0.5 text-[10px] text-white">
            {formation}
          </span>
        </div>

        {/* Interactive Player Tokens on the Pitch */}
        <div className="relative h-full w-full">
          {players.length > 0 ? (
            players.slice(0, 11).map((player, idx) => {
              const pos = coords[idx] || { x: 50, y: 50 };
              const isGk = idx === 0 || player.position === 'GK';
              const isSelected = activePlayer?.id === player.id;
              const photoUrl = (player as unknown as { photoUrl?: string }).photoUrl;

              return (
                <div
                  key={player.id || `${player.name}-${idx}`}
                  style={{
                    left: `${pos.x}%`,
                    bottom: `${pos.y}%`,
                    transform: 'translate(-50%, 50%)',
                  }}
                  onClick={() => setActivePlayer(player)}
                  className={`group absolute z-20 flex cursor-pointer flex-col items-center transition-all ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                >
                  {/* Player Avatar / Token */}
                  <div className="relative">
                    <div
                      className={`flex h-10 w-10 sm:h-11 sm:sm:w-11 items-center justify-center overflow-hidden rounded-full border-2 shadow-xl transition-all ${
                        isGk
                          ? 'border-amber-400 bg-gradient-to-tr from-amber-600 to-amber-400 text-black shadow-amber-500/50'
                          : selectedTeam === 'home'
                          ? 'border-orange-400 bg-gradient-to-tr from-orange-700 to-orange-500 text-white shadow-orange-500/50'
                          : 'border-sky-400 bg-gradient-to-tr from-sky-700 to-sky-500 text-white shadow-sky-500/50'
                      }`}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={player.name}
                          className="h-full w-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-sm font-black tabular-nums">
                          {player.number ?? idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Small number badge overlay */}
                    {photoUrl ? (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-[9px] font-black text-white ring-1 ring-white/30">
                        {player.number ?? idx + 1}
                      </span>
                    ) : null}
                  </div>

                  {/* Player Name Pill */}
                  <span className={`mt-1 max-w-[90px] truncate rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold backdrop-blur-md transition-colors shadow-md ${
                    isSelected
                      ? 'bg-orange-500 text-black font-black ring-1 ring-white'
                      : 'bg-black/80 text-white group-hover:bg-orange-500 group-hover:text-black'
                  }`}>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/20 text-xs font-bold text-white">
                  {idx + 1}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Player Details Pop / Drawer */}
      {activePlayer ? (
        <div className="flex items-center justify-between rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-black text-black">
              #{activePlayer.number ?? '—'}
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">{activePlayer.name}</h4>
              <p className="text-[11px] font-bold text-muted-foreground">
                {activePlayer.position || pick(locale, 'لاعب أساسي', 'Starting player')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePlayer(null)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Substitutes Bench & Coach Section */}
      {(bench.length > 0 || coach?.name) ? (
        <div className="rounded-3xl border border-border/70 bg-card/50 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <Users className="h-4 w-4 text-orange-500" />
              <span>{pick(locale, 'دكة البدلاء والمدرب', 'Substitutes & Coach')}</span>
            </div>
            {coach?.name ? (
              <span className="text-[11px] font-bold text-muted-foreground">
                {pick(locale, 'المدرب', 'Coach')}: <b className="text-foreground">{coach.name}</b>
              </span>
            ) : null}
          </div>

          {bench.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bench.map((sub, idx) => (
                <div
                  key={sub.id || `${sub.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 p-2 text-xs transition-colors hover:border-orange-500/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-[10px] font-black text-orange-500">
                      {sub.number ?? idx + 12}
                    </span>
                    <span className="truncate font-bold text-foreground">{sub.name}</span>
                  </div>
                  {sub.position ? (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {sub.position}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
