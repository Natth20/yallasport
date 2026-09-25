'use client';

import React, { useMemo, useState } from 'react';
import { reportCaughtError } from '@/lib/ops/caught';
import { CheckCircle2, Flame, Users, Sparkles } from 'lucide-react';
import { CrestImage } from '@/components/common/CrestImage';
import type { PollKey } from '@/lib/polls/match-poll';
import styles from '@/components/sports/match-dossier.module.css';

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
    } catch (err) {
      reportCaughtError('HomeFanPoll.handleVote', err, { persist: false });
      setError(isEn ? 'Vote could not be saved.' : 'تعذّر حفظ التصويت.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.panelCard}>
      <div className={styles.pollBox}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ys-orange)]/15 text-[var(--ys-orange)]">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ys-orange)]">
                {poll.category}
              </span>
              <h3 className="text-xs font-black uppercase text-[var(--foreground)]">
                {isEn ? 'Fan Voice' : 'صوت الجماهير'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {totalVotes.toLocaleString(isEn ? 'en-US' : 'ar-EG')} {isEn ? 'votes' : 'صوت'}
            </span>
          </div>
        </div>

        <p className="text-xs font-black leading-relaxed text-[var(--foreground)]">{poll.question}</p>

        <div className={styles.pollOptions}>
          {options.map((opt) => {
            const isSelected = voted === opt.key;
            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => void handleVote(opt.key)}
                disabled={Boolean(voted) || pending}
                className={isSelected ? styles.pollOptionBtnActive : styles.pollOptionBtn}
              >
                {voted ? (
                  <div className={styles.pollFillBar} style={{ width: `${percent}%` }} />
                ) : null}
                <span className={styles.pollLabelContent}>
                  {opt.logoUrl ? (
                    <CrestImage src={opt.logoUrl} alt="" size={18} className="h-4 w-4 object-contain" />
                  ) : null}
                  {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--primary)]" /> : null}
                  <span>{opt.label}</span>
                </span>
                {voted ? (
                  <span className={styles.pollVotePercentage}>
                    {percent}%
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {voted ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center text-[11px] font-bold text-emerald-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isEn ? 'Vote recorded' : 'تم تسجيل صوتك'}</span>
          </div>
        ) : null}
        {error ? <p className="text-center text-[11px] font-bold text-rose-500">{error}</p> : null}
      </div>
    </div>
  );
}
