'use client';

import { Share2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';

export function NewsShareButton({ title }: { title: string }) {
  const locale = useLocale();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  return (
    <button type="button" onClick={() => void share()} className="news-share-btn">
      <Share2 className="h-3.5 w-3.5" />
      {pick(locale, 'مشاركة', 'Share')}
    </button>
  );
}
