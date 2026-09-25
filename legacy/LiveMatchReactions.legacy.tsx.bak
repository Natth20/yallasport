'use client';
import { swallow } from '@/lib/ops/caught';

import React, { useCallback, useEffect, useState } from 'react';

const REACTIONS = [
  { emoji: '🔥', ar: 'حماس', en: 'Fire' },
  { emoji: '⚽', ar: 'هدف', en: 'Goal' },
  { emoji: '👏', ar: 'إبداع', en: 'Clap' },
  { emoji: '⚡', ar: 'ضغط', en: 'Press' },
  { emoji: '💔', ar: 'حسرة', en: 'Hurt' },
] as const;

export function LiveMatchReactions({
  matchId,
  locale = 'ar',
}: {
  matchId: string;
  locale?: string;
}) {
  const isAr = locale === 'ar';
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sports/reactions?matchId=${encodeURIComponent(matchId)}`);
    const data = (await res.json().catch(swallow("src/components/matches/LiveMatchReactions.tsx:26", null, { persist: false }))) as { counts?: Record<string, number> } | null;
    if (data?.counts) setCounts(data.counts);
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addReaction = async (emoji: string) => {
    if (pending) return;
    setPending(emoji);
    try {
      const res = await fetch('/api/sports/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, emoji }),
      });
      const data = (await res.json().catch(swallow("src/components/matches/LiveMatchReactions.tsx:43", null, { persist: false }))) as { ok?: boolean; count?: number } | null;
      if (res.ok && data?.ok && typeof data.count === 'number') {
        setCounts((prev) => ({ ...prev, [emoji]: data.count as number }));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {isAr ? 'تفاعل الجمهور · يُحفظ للجميع' : 'Crowd reactions · saved for everyone'}
      </p>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((item) => (
          <button
            key={item.emoji}
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void addReaction(item.emoji)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/40"
            title={isAr ? item.ar : item.en}
          >
            <span>{item.emoji}</span>
            <span className="tabular-nums text-muted-foreground">{counts[item.emoji] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
