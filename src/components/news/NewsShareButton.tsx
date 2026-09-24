'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import { Share2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';
import { copyText } from '@/lib/clipboard';

export function NewsShareButton({ title }: { title: string }) {
  const locale = useLocale();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (error) {
      reportCaughtError("src/components/news/NewsShareButton.tsx:17", error, { persist: false });
      // fall through to clipboard
    }
    await copyText(url);
  };

  return (
    <button type="button" onClick={() => void share()} className="news-share-btn">
      <Share2 className="h-3.5 w-3.5" />
      {pick(locale, 'مشاركة', 'Share')}
    </button>
  );
}
