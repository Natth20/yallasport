'use client';

import React, { useState, useEffect } from 'react';
import { Tv, X, Maximize2 } from 'lucide-react';

interface FloatingStreamDockProps {
  title?: string;
  locale?: string;
  targetAnchorId?: string;
}

/** UI chrome only. Never plays a URL — playback stays on MatchStreamPlayer + licensed API. */
export function FloatingStreamDock({
  title = 'بث المباراة المباشر',
  locale = 'ar',
  targetAnchorId = 'main-stream-player',
}: FloatingStreamDockProps) {
  const [isDocked, setIsDocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isAr = locale === 'ar';

  useEffect(() => {
    const checkScroll = () => {
      if (dismissed) return;
      const anchor = document.getElementById(targetAnchorId);
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setIsDocked(rect.bottom < 50);
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [dismissed, targetAnchorId]);

  if (!isDocked || dismissed) return null;

  return (
    <div className="fixed bottom-5 end-5 z-50 flex w-72 flex-col overflow-hidden rounded-2xl border border-primary/30 bg-background/95 shadow-2xl shadow-black/80 backdrop-blur-xl sm:w-80">
      <div className="flex items-center justify-between border-b border-white/10 bg-primary/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500" />
          <span className="truncate text-xs font-black text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              document.getElementById(targetAnchorId)?.scrollIntoView({ behavior: 'smooth' });
            }}
            title={isAr ? 'العودة للمشغل الرئيسي' : 'Scroll to the main player'}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            title={isAr ? 'إغلاق' : 'Close'}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 bg-black">
        <Tv className="h-6 w-6 text-primary" />
        <span className="px-4 text-center text-[11px] font-bold text-foreground/70">
          {isAr ? 'البث من الأصل المرخّص فقط' : 'Playback only from the licensed asset'}
        </span>
      </div>
    </div>
  );
}
