'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { swallow } from '@/lib/ops/caught';
import {Sparkles} from 'lucide-react';
import styles from '@/components/sports/match-dossier.module.css';

const REACTIONS = [
  { emoji: '🔥', ar: 'حماس', en: 'Fire' },
  { emoji: '⚽', ar: 'هدف', en: 'Goal' },
  { emoji: '👏', ar: 'إبداع', en: 'Clap' },
  { emoji: '⚡', ar: 'ضغط', en: 'Press' },
  { emoji: '💔', ar: 'حسرة', en: 'Hurt' },
] as const;

export interface LiveMatchReactionsProps {
  matchId: string;
  locale?: string;
}

export function LiveMatchReactions({ matchId, locale = 'ar' }: LiveMatchReactionsProps) {
  const isAr = locale === 'ar';
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sports/reactions?matchId=${encodeURIComponent(matchId)}`);
      const data = (await res.json().catch(swallow('LiveMatchReactions.load', null, { persist: false }))) as {
        counts?: Record<string, number>;
      } | null;
      if (data?.counts) setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addReaction = async (emoji: string) => {
    if (pending) return;
    setPending(emoji);
    // Optimistic update
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));

    try {
      const res = await fetch('/api/sports/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, emoji }),
      });
      const data = (await res.json().catch(swallow('LiveMatchReactions.add', null, { persist: false }))) as {
        ok?: boolean;
        count?: number;
      } | null;
      if (res.ok && data?.ok && typeof data.count === 'number') {
        setCounts((prev) => ({ ...prev, [emoji]: data.count as number }));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={styles.panelCard}>
      <div className={styles.reactionsBox}>
        <div className={styles.reactionsHeader}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--ys-orange)]" />
            <span className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
              {isAr ? 'تفاعل الجماهير الحي' : 'Live Crowd Reactions'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)]">
            {isAr ? 'مباشر للجميع' : 'Live for all'}
          </span>
        </div>

        {loading ? (
          <div className="flex gap-2 py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-16 animate-pulse rounded-full bg-[var(--muted)]/40" />
            ))}
          </div>
        ) : (
          <div className={styles.reactionsGrid}>
            {REACTIONS.map((item) => {
              const count = counts[item.emoji] ?? 0;
              const isSelected = pending === item.emoji;
              return (
                <button
                  key={item.emoji}
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => void addReaction(item.emoji)}
                  className={`${styles.reactionBtn} ${isSelected ? 'scale-110 border-[var(--primary)]' : ''}`}
                  title={isAr ? item.ar : item.en}
                >
                  <span className={styles.reactionEmoji}>{item.emoji}</span>
                  <span className={styles.reactionCount}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
