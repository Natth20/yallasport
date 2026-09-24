'use client';

import { useEffect } from 'react';

export function NewsViewBeacon({ newsId }: { newsId: string }) {
  useEffect(() => {
    if (!newsId || typeof window === 'undefined') return;
    const key = `ys-view:${newsId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    void fetch('/api/news/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newsId }),
      keepalive: true,
    });
  }, [newsId]);

  return null;
}
