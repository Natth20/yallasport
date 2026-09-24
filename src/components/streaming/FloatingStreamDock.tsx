'use client';

import React, { useState, useEffect } from 'react';
import { Tv, X, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

interface FloatingStreamDockProps {
  title?: string;
  streamUrl?: string | null;
  iframeUrl?: string | null;
  locale?: string;
  targetAnchorId?: string;
}

export function FloatingStreamDock({
  title = 'بث المباراة المباشر',
  streamUrl,
  iframeUrl,
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
      // If the main player is scrolled out of view, show the floating dock
      if (rect.bottom < 50) {
        setIsDocked(true);
      } else {
        setIsDocked(false);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [dismissed, targetAnchorId]);

  if (!isDocked || dismissed) return null;

  return (
    <div className="fixed bottom-5 end-5 z-50 flex w-72 flex-col overflow-hidden rounded-2xl border border-primary/30 bg-background/95 shadow-2xl shadow-black/80 backdrop-blur-xl sm:w-80 animate-[slideUp_0.3s_ease-out]">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-primary/10 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span className="truncate text-xs font-black text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const anchor = document.getElementById(targetAnchorId);
              anchor?.scrollIntoView({ behavior: 'smooth' });
            }}
            title={isAr ? 'العودة للمشغل الرئيسي' : 'Scroll to main player'}
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

      {/* Embedded Stream Video or Visual Frame */}
      <div className="relative aspect-video w-full bg-black">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : streamUrl ? (
          <video
            src={streamUrl}
            autoPlay
            muted
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-card to-background p-4 text-center">
            <Tv className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-[11px] font-bold text-foreground/70">
              {isAr ? 'البث المباشر قيد التشغيل' : 'Live stream active'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
