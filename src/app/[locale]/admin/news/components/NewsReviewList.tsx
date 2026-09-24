'use client';
import { swallow, reportCaughtError } from '@/lib/ops/caught';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';

interface NewsItem {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  status: string;
  createdAt: Date | string;
}

export const NewsReviewList: React.FC<{ items: NewsItem[] }> = ({ items }) => {
  const locale = useLocale();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json().catch(swallow("src/app/[locale]/admin/news/components/NewsReviewList.tsx:33", ({}), { persist: false }));
      if (!response.ok) {
        setError(
          typeof payload.error === 'string'
            ? payload.error
            : pick(locale, 'تعذر تنفيذ الإجراء.', 'Could not complete the action.')
        );
        return;
      }
      router.refresh();
    } catch (error) {
      reportCaughtError("src/app/[locale]/admin/news/components/NewsReviewList.tsx:44", error, { persist: false });
      setError(pick(locale, 'تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground dark:border-border dark:bg-muted">
        {pick(locale, 'لا توجد أخبار بانتظار المراجعة.', 'No news awaiting review.')}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-md dark:bg-muted">
      {error ? (
        <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <table className="w-full text-right">
        <thead className="bg-muted text-xs font-black uppercase tracking-widest text-muted-foreground dark:bg-slate-700">
          <tr>
            <th className="px-6 py-4">{pick(locale, 'الخبر', 'Article')}</th>
            <th className="px-6 py-4">{pick(locale, 'المصدر', 'Source')}</th>
            <th className="px-6 py-4">{pick(locale, 'التاريخ', 'Date')}</th>
            <th className="px-6 py-4 text-center">{pick(locale, 'الإجراءات', 'Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-muted dark:hover:bg-slate-700/50">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="line-clamp-1 text-sm font-bold">{item.title}</span>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 text-[10px] text-blue-500"
                    >
                      {pick(locale, 'المقال الأصلي', 'Original article')} <ExternalLink className="h-2 w-2" />
                    </a>
                  ) : (
                    <span className="mt-1 text-[10px] text-red-500">
                      {pick(locale, 'بلا رابط مصدر', 'Missing source URL')}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  {item.sourceName || pick(locale, 'غير معروف', 'Unknown')}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void act(item.id, 'approve')}
                    title={pick(locale, 'اعتماد ونشر', 'Approve and publish')}
                    className="rounded bg-green-500 p-1.5 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                  >
                    {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void act(item.id, 'reject')}
                    title={pick(locale, 'رفض', 'Reject')}
                    className="rounded bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
