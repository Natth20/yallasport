'use client';
import { swallow } from '@/lib/ops/caught';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Item {
  id: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: string;
  news: { id: string; title: string; excerpt: string | null; content: string; sourceLocale: string };
}

export function TranslationReview({ items }: { items: Item[] }) {
  const t = useTranslations('translations');
  const [rows, setRows] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, action: 'approve' | 'reject' | 'retranslate' | 'backfill') => {
    setBusy(id + action);
    const res = await fetch('/api/admin/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'backfill' ? { action } : { id, action })
    });
    const data = await res.json().catch(swallow("src/app/[locale]/admin/translations/TranslationReview.tsx:28", null, { persist: false })) as { error?: string } | null;
    if (!res.ok) {
      setBusy(null);
      window.alert(data?.error === 'provider_unconfigured' ? t('provider_off') : t('action_failed'));
      return;
    }
    if (action !== 'backfill') {
      setRows((current) => current.filter((row) => row.id !== id || action === 'retranslate'));
    }
    setBusy(null);
    if (action === 'backfill') window.location.reload();
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => void act('all', 'backfill')}
        className="rounded-xl bg-foreground px-4 py-2 text-xs font-black text-white"
      >
        {t('backfill')}
      </button>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        rows.map((item) => (
          <article key={item.id} className="grid gap-4 rounded-3xl border border-border p-5 dark:border-border lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase text-orange-500">{t('source')}</p>
              <h3 className="mt-2 font-black">{item.news.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.news.excerpt}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-orange-500">{t('target')} · {item.locale}</p>
              <h3 className="mt-2 font-black">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={busy !== null} onClick={() => void act(item.id, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">{t('approve')}</button>
                <button disabled={busy !== null} onClick={() => void act(item.id, 'reject')} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black text-white">{t('reject')}</button>
                <button disabled={busy !== null} onClick={() => void act(item.id, 'retranslate')} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-black">{t('retranslate')}</button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
