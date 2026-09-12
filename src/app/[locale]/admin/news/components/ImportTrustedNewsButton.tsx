'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';
import { Loader2, Rss } from 'lucide-react';

export function ImportTrustedNewsButton() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/news/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allTrusted: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(
          typeof payload.error === 'string'
            ? payload.error
            : pick(locale, 'فشل الاستيراد.', 'Import failed.')
        );
        return;
      }
      setMessage(
        typeof payload.message === 'string'
          ? payload.message
          : pick(locale, 'تم الاستيراد للمراجعة.', 'Imported for review.')
      );
      router.refresh();
    } catch {
      setMessage(pick(locale, 'تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rss className="h-4 w-4" />}
        {pick(locale, 'استيراد من مصادر موثوقة', 'Import from trusted sources')}
      </button>
      {message ? <p className="max-w-xs text-[11px] text-muted-foreground sm:text-end">{message}</p> : null}
    </div>
  );
}
