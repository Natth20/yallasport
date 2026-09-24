'use client';

import { useState } from 'react';

interface LinkRow {
  id: string;
  newsId: string;
  entityType: string;
  entityId: string;
  suggested: boolean;
  confirmed: boolean;
  news: { title: string };
}

export function NewsLinksReview({ items }: { items: LinkRow[] }) {
  const [rows, setRows] = useState(items);

  const toggle = async (row: LinkRow, confirmed: boolean) => {
    await fetch('/api/admin/news-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsId: row.newsId,
        entityType: row.entityType,
        entityId: row.entityId,
        confirmed
      })
    });
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, confirmed } : item))
    );
  };

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3 rounded-3xl border border-border p-5 dark:border-border">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-bold">{row.news.title}</p>
            <p className="text-xs text-muted-foreground">{row.entityType} · {row.entityId}</p>
          </div>
          <button
            type="button"
            onClick={() => void toggle(row, !row.confirmed)}
            className={`rounded-lg px-3 py-1.5 text-xs font-black ${row.confirmed ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}
          >
            {row.confirmed ? 'OK' : '+'}
          </button>
        </div>
      ))}
    </div>
  );
}
