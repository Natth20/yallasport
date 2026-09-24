'use client';

import React, { useState, useEffect } from 'react';
import { Flame, ThumbsUp, Heart, Sparkles, Zap, MessageSquare } from 'lucide-react';

interface ReactionItem {
  id: string;
  emoji: string;
  label: string;
  count: number;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

const DEFAULT_REACTIONS = [
  { emoji: '🔥', label: 'حماس', base: 42 },
  { emoji: '⚽', label: 'هدف', base: 89 },
  { emoji: '👏', label: 'إبداع', base: 31 },
  { emoji: '⚡', label: 'ضغط', base: 24 },
  { emoji: '💔', label: 'حسرة', base: 18 },
];

export function LiveMatchReactions({
  matchId,
  locale = 'ar',
}: {
  matchId: string;
  locale?: string;
}) {
  const isAr = locale === 'ar';
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const storageKey = `ys_reactions_${matchId}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCounts(JSON.parse(stored));
      } else {
        const init: Record<string, number> = {};
        DEFAULT_REACTIONS.forEach((r) => {
          init[r.emoji] = r.base + Math.floor(Math.random() * 15);
        });
        setCounts(init);
      }
    } catch {
      // fallback
    }
  }, [storageKey]);

  const addReaction = (emoji: string) => {
    const updated = {
      ...counts,
      [emoji]: (counts[emoji] || 0) + 1,
    };
    setCounts(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    // Add floating animation
    const newBubble: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.floor(Math.random() * 80) + 10,
    };
    setFloating((prev) => [...prev.slice(-15), newBubble]);

    setTimeout(() => {
      setFloating((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
      {/* Floating animated reactions container */}
      <div className="pointer-events-none absolute inset-x-0 bottom-12 top-0 overflow-hidden">
        {floating.map((item) => (
          <span
            key={item.id}
            style={{ left: `${item.left}%` }}
            className="absolute bottom-0 animate-[floatUp_2s_ease-out_forwards] text-2xl opacity-90 transition-all select-none"
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            {isAr ? 'تفاعل الجماهير اللحظي (Live Fan Reactions)' : 'Live Fan Reactions'}
          </h4>
        </div>
        <span className="text-[11px] font-bold text-foreground/45">
          {isAr ? 'شارك حماسك مع المشجعين' : 'Cheer with fans'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {DEFAULT_REACTIONS.map((item) => {
          const currentCount = counts[item.emoji] ?? item.base;
          return (
            <button
              key={item.emoji}
              type="button"
              onClick={() => addReaction(item.emoji)}
              className="group relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:scale-105 hover:border-primary/50 hover:bg-primary/10 active:scale-95"
            >
              <span className="text-xl transition-transform group-hover:scale-125">
                {item.emoji}
              </span>
              <span className="text-xs font-black text-foreground/80 tabular-nums">
                {currentCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
