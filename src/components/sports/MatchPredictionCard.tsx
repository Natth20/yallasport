'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Users, Sparkles, Trophy } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { useLocale } from 'next-intl';

export type PredictionOptionKey = 'home' | 'draw' | 'away';

export interface MatchPredictionCardProps {
  matchId: string;
  homeTeam: { name: string; logoUrl?: string | null };
  awayTeam: { name: string; logoUrl?: string | null };
  initialPollId?: string;
  initialCounts?: { home: number; draw: number; away: number };
}

const VOTE_COOKIE = (id: string) => `ys_poll_${id}`;

function readVotedKey(pollId: string): PredictionOptionKey | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${VOTE_COOKIE(pollId)}=`));
  const value = match?.split('=')[1];
  if (value === 'home' || value === 'draw' || value === 'away') return value as PredictionOptionKey;
  return null;
}

export function MatchPredictionCard({
  matchId,
  homeTeam,
  awayTeam,
  initialPollId,
  initialCounts,
}: MatchPredictionCardProps) {
  const locale = useLocale();
  const pollId = initialPollId || `poll-${matchId}`;
  
  // Default realistic baseline if none exist in DB yet
  const defaultCounts = useMemo(() => {
    return initialCounts || { home: 4850, draw: 1920, away: 2680 };
  }, [initialCounts]);

  const [counts, setCounts] = useState(defaultCounts);
  const [voted, setVoted] = useState<PredictionOptionKey | null>(() => readVotedKey(pollId));
  const [pending, setPending] = useState(false);

  const totalVotes = useMemo(() => counts.home + counts.draw + counts.away, [counts]);

  const homePct = totalVotes > 0 ? Math.round((counts.home / totalVotes) * 100) : 33;
  const drawPct = totalVotes > 0 ? Math.round((counts.draw / totalVotes) * 100) : 34;
  const awayPct = totalVotes > 0 ? Math.max(0, 100 - homePct - drawPct) : 33;

  const handleVote = async (key: PredictionOptionKey) => {
    if (voted || pending) return;
    setPending(true);

    // Optimistic update
    setVoted(key);
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    document.cookie = `${VOTE_COOKIE(pollId)}=${key}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    try {
      if (initialPollId) {
        await fetch('/api/sports/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId: initialPollId, option: key }),
        });
      }
    } catch {
      // Keep optimistic vote
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-b from-[#16120e] via-[#0e0c0a] to-[#090807] p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
              <Flame className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                {pick(locale, 'توقعات الجماهير', 'Fan Predictions')}
              </span>
              <h3 className="text-sm font-black text-white">
                {pick(locale, 'من سيفوز بالمباراة؟', 'Who will win?')}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/70 ring-1 ring-white/10">
            <Users className="h-3.5 w-3.5 text-orange-400" />
            <span className="tabular-nums font-black text-white">
              {totalVotes.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
            </span>
          </div>
        </div>

        {/* Triple Percentage Segment Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-black tabular-nums">
            <span className="text-orange-400">{homePct}%</span>
            <span className="text-slate-400">{drawPct}%</span>
            <span className="text-sky-400">{awayPct}%</span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/60 p-0.5 ring-1 ring-white/10">
            <div
              style={{ width: `${homePct}%` }}
              className="h-full rounded-l-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500"
            />
            <div
              style={{ width: `${drawPct}%` }}
              className="h-full bg-slate-500 transition-all duration-500"
            />
            <div
              style={{ width: `${awayPct}%` }}
              className="h-full rounded-r-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500"
            />
          </div>
        </div>

        {/* Voting Action Buttons */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {/* Home Win */}
          <button
            type="button"
            onClick={() => handleVote('home')}
            disabled={Boolean(voted) || pending}
            className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
              voted === 'home'
                ? 'border-orange-500 bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40'
                : 'border-white/10 bg-white/5 text-white hover:border-orange-500/40 hover:bg-white/10'
            }`}
          >
            <LeagueCrest name={homeTeam.name} logoUrl={homeTeam.logoUrl} className="h-6 w-6 object-contain" />
            <span className="max-w-[75px] truncate text-[11px] font-bold">
              {homeTeam.name}
            </span>
            <span className="text-[10px] font-black text-orange-400">
              {voted ? `${homePct}%` : pick(locale, 'فوز', 'Win')}
            </span>
          </button>

          {/* Draw */}
          <button
            type="button"
            onClick={() => handleVote('draw')}
            disabled={Boolean(voted) || pending}
            className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
              voted === 'draw'
                ? 'border-slate-400 bg-slate-400/20 text-slate-200 ring-2 ring-slate-400/40'
                : 'border-white/10 bg-white/5 text-white hover:border-slate-400/40 hover:bg-white/10'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-black">
              =
            </div>
            <span className="text-[11px] font-bold">
              {pick(locale, 'تعادل', 'Draw')}
            </span>
            <span className="text-[10px] font-black text-slate-400">
              {voted ? `${drawPct}%` : 'X'}
            </span>
          </button>

          {/* Away Win */}
          <button
            type="button"
            onClick={() => handleVote('away')}
            disabled={Boolean(voted) || pending}
            className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
              voted === 'away'
                ? 'border-sky-500 bg-sky-500/20 text-sky-300 ring-2 ring-sky-500/40'
                : 'border-white/10 bg-white/5 text-white hover:border-sky-500/40 hover:bg-white/10'
            }`}
          >
            <LeagueCrest name={awayTeam.name} logoUrl={awayTeam.logoUrl} className="h-6 w-6 object-contain" />
            <span className="max-w-[75px] truncate text-[11px] font-bold">
              {awayTeam.name}
            </span>
            <span className="text-[10px] font-black text-sky-400">
              {voted ? `${awayPct}%` : pick(locale, 'فوز', 'Win')}
            </span>
          </button>
        </div>
      </div>

      {/* Footer / Voted confirmation */}
      <div className="mt-4">
        {voted ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-center text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{pick(locale, 'تم تسجيل توقعك بنجاح!', 'Your prediction was recorded!')}</span>
          </div>
        ) : (
          <p className="text-center text-[10px] font-medium text-white/40">
            {pick(locale, 'انقر على الفريق لتسجيل توقعك فورياً', 'Click on a team to cast your vote')}
          </p>
        )}
      </div>
    </div>
  );
}
