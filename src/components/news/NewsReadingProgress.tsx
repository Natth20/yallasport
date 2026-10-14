'use client';

import { useEffect, useState } from 'react';

export function NewsReadingProgress({ targetId = 'news-report-prose' }: { targetId?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = document.getElementById(targetId);
          if (!target) {
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
          } else {
            const rect = target.getBoundingClientRect();
            const total = target.offsetHeight - window.innerHeight * 0.35;
            const consumed = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1));
            setProgress(Math.min(100, Math.round((consumed / Math.max(total, 1)) * 100)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);

  if (progress <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1.5 bg-black/10 dark:bg-white/5" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-all duration-150 ease-out shadow-sm shadow-orange-500/40"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default NewsReadingProgress;
