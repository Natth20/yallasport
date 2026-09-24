'use client';

import React, { useState } from 'react';
import { Flame, Heart, Sparkles, Trophy, Zap } from 'lucide-react';

interface ReactionBubble {
  id: number;
  emoji: string;
  left: number; // percentage
}

export function LiveFanReactions({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';
  const [bubbles, setBubbles] = useState<ReactionBubble[]>([]);
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    '⚽': 1420,
    '🔥': 980,
    '👏': 650,
    '😱': 430,
    '🏆': 820,
  });

  const addReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 80) + 10;
    setBubbles((prev) => [...prev.slice(-15), { id, emoji, left }]);

    setCounts((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
  };

  const reactions = [
    { emoji: '⚽', label: 'هدف' },
    { emoji: '🔥', label: 'حماس' },
    { emoji: '👏', label: 'تشجيع' },
    { emoji: '😱', label: 'فرصة' },
    { emoji: '🏆', label: 'كأس' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-4 backdrop-blur-xl">
      {/* Floating Animated Bubbles Container */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            style={{
              left: `${bubble.left}%`,
              bottom: '10px',
            }}
            className="animate-float-up absolute select-none text-2xl"
          >
            {bubble.emoji}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-black text-foreground">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'صوت ومشاعر المدرجات (Live Fan Reactions)' : 'Live Fan Reactions'}</span>
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {isAr ? 'تفاعل مباشرة مع أحداث المباراة وشاهد نبض الجماهير' : 'Tap to react live with match viewers'}
          </p>
        </div>

        {/* Reaction Buttons */}
        <div className="flex items-center gap-1.5">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => addReaction(r.emoji)}
              className="group flex flex-col items-center gap-0.5 rounded-2xl border border-foreground/5 bg-foreground/5 px-2.5 py-1.5 transition-all hover:scale-115 hover:border-primary/40 hover:bg-primary/10 active:scale-90"
              title={r.label}
            >
              <span className="text-base transition-transform group-hover:scale-125">{r.emoji}</span>
              <span className="tabular-nums text-[9px] font-bold text-muted-foreground group-hover:text-primary">
                {counts[r.emoji]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
