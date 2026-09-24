'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Send } from 'lucide-react';

interface StoryShareCardProps {
  title: string;
  url?: string;
  locale?: string;
}

export function StoryShareCard({ title, url, locale = 'ar' }: StoryShareCardProps) {
  const [copied, setCopied] = useState(false);
  const isAr = locale === 'ar';

  const shareUrl = typeof window !== 'undefined' ? url || window.location.href : '';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`${title} عبر @YallaSport`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(title);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="my-6 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-black text-foreground">
            {isAr ? 'مشاركة الخبر مع الأصدقاء:' : 'Share this story:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-600/30"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>واتساب</span>
          </button>

          <button
            type="button"
            onClick={shareTwitter}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-400 transition-all hover:bg-sky-500/30"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X (تويتر)</span>
          </button>

          <button
            type="button"
            onClick={shareTelegram}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/30"
          >
            <Send className="h-3.5 w-3.5" />
            <span>تيليجرام</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-foreground/80 transition-all hover:bg-white/10"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
