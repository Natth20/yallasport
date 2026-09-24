'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Users, Sparkles } from 'lucide-react';
import { CrestImage } from '@/components/common/CrestImage';
import type { PollKey } from '@/lib/polls/match-poll';

export type HomePollView = {
  id: string;
  matchId: string;
  question: string;
  category: string;
  options: Array<{
    key: PollKey;
    label: string;
    votes: number;
    logoUrl?: string | null;
  }>;
};

const VOTE_COOKIE = (id: string) => `ys_poll_${id}`;

function readVotedKey(pollId: string): PollKey | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${VOTE_COOKIE(pollId)}=`));
  const value = match?.split('=')[1];
  if (value === 'home' || value === 'draw' || value === 'away') return value;
  return null;
}

export function HomeFanPoll({ locale = 'ar', poll }: { locale?: string; poll: HomePollView | null }) {
  const isEn = locale !== 'ar';
  const [options, setOptions] = useState(poll?.options ?? []);
  const [voted, setVoted] = useState<PollKey | null>(() => (poll ? readVotedKey(poll.id) : null));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const totalVotes = useMemo(() => options.reduce((sum, opt) => sum + opt.votes, 0), [options]);

  if (!poll) return null;

  const handleVote = async (key: PollKey) => {
    if (voted || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/sports/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, option: key }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        options?: Record<PollKey, number>;
      };
      if (!res.ok || !data.success || !data.options) {
        if (data.error === 'already_voted') {
          document.cookie = `${VOTE_COOKIE(poll.id)}=${key}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          setVoted(key);
          return;
        }
        setError(isEn ? 'Vote could not be saved.' : 'تعذّر حفظ التصويت.');
        return;
      }
      document.cookie = `${VOTE_COOKIE(poll.id)}=${key}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      setVoted(key);
      setOptions((prev) =>
        prev.map((opt) => ({
          ...opt,
          votes: data.options?.[opt.key] ?? opt.votes,
        })),
      );
    } catch (error) {
      reportCaughtError("src/components/home/HomeFanPoll.tsx:74", error, { persist: false });
      setError(isEn ? 'Vote could not be saved.' : 'تعذّر حفظ التصويت.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/85 via-card/65 to-card/90 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-primary text-white shadow-md shadow-primary/30">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="rounded-full border border-primary/25 bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary">
              {poll.category}
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              {isEn ? 'Fan voice · this fixture' : 'صوت الجماهير · هذه المباراة'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span className="tabular-nums">
            {totalVotes.toLocaleString('en-US')} {isEn ? 'votes' : 'صوت'}
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm font-black leading-relaxed text-foreground">{poll.question}</p>

      <div className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = voted === opt.key;
          const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => void handleVote(opt.key)}
              disabled={Boolean(voted) || pending}
              className={`group relative w-full overflow-hidden rounded-2xl border p-3.5 text-start transition-all duration-300 ${
                isSelected
                  ? 'border-primary bg-primary/15 shadow-md shadow-primary/20'
                  : voted
                    ? 'border-white/10 bg-white/[0.02]'
                    : 'border-white/10 bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.06]'
              }`}
            >
              {voted ? (
                <div
                  className={`absolute inset-y-0 start-0 transition-all duration-1000 ease-out ${
                    isSelected ? 'bg-primary/25' : 'bg-white/10'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              ) : null}
              <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-bold">
                <span className="flex items-center gap-2.5 text-foreground">
                  {opt.logoUrl ? <CrestImage src={opt.logoUrl} alt="" size={20} className="h-5 w-5 object-contain" /> : null}
                  {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                  <span className="font-bold">{opt.label}</span>
                </span>
                {voted ? (
                  <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {percent}% ({opt.votes.toLocaleString('en-US')})
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {voted ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-center text-xs font-black text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isEn ? 'Vote saved on the server.' : 'صوتك محفوظ على السيرفر.'}</span>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-center text-xs font-bold text-red-400">{error}</p> : null}
    </div>
  );
}
