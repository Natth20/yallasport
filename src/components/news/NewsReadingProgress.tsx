'use client';

import { useEffect, useState } from 'react';

export function NewsReadingProgress({ targetId = 'news-report-prose' }: { targetId?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const target = document.getElementById(targetId);
      if (!target) {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
        return;
      }
      const rect = target.getBoundingClientRect();
      const total = target.offsetHeight - window.innerHeight * 0.35;
      const consumed = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1));
      setProgress(Math.min(100, Math.round((consumed / Math.max(total, 1)) * 100)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);

  return (
    <div className="news-read-progress" aria-hidden>
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
