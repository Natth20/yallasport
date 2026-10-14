'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Share2, Type, Bell, Check, Sparkles } from 'lucide-react';
import { pick } from '@/i18n/pick';
import { NewsAudioReader } from './NewsAudioReader';

export function NewsReaderToolbar({
  locale = 'ar',
  newsId,
  title,
  bodyHtml,
  readLabel,
  primaryEntity,
  isLoggedIn = false,
}: {
  locale?: string;
  newsId: string;
  title: string;
  bodyHtml: string;
  readLabel?: string | null;
  primaryEntity?: {
    type: string;
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
  isLoggedIn?: boolean;
}) {
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: sm, 1: base, 2: lg, 3: xl
  const fontSizes = [
    { label: 'A-', size: '1rem', line: '1.75' },
    { label: 'A', size: '1.125rem', line: '1.85' },
    { label: 'A+', size: '1.25rem', line: '1.95' },
    { label: 'A++', size: '1.4rem', line: '2.05' },
  ];

  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ys_fav_news_${newsId}`);
      if (saved) setIsSaved(true);

      if (primaryEntity) {
        const followState = localStorage.getItem(`ys_follow_${primaryEntity.type}_${primaryEntity.id}`);
        if (followState) setFollowing(true);
        const alertState = localStorage.getItem(`ys_alerts_${primaryEntity.type}_${primaryEntity.id}`);
        if (alertState) setAlertsEnabled(true);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [newsId, primaryEntity]);

  const changeFontSize = (delta: number) => {
    setFontSizeIndex((prev) => {
      const next = Math.max(0, Math.min(fontSizes.length - 1, prev + delta));
      const target = document.getElementById('news-report-prose');
      if (target) {
        target.style.fontSize = fontSizes[next].size;
        target.style.lineHeight = fontSizes[next].line;
      }
      return next;
    });
  };

  const toggleBookmark = () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        localStorage.setItem(`ys_fav_news_${newsId}`, '1');
      } else {
        localStorage.removeItem(`ys_fav_news_${newsId}`);
      }
    } catch {
      // LocalStorage unavailable
    }
  };

  const shareArticle = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  };

  const toggleFollow = () => {
    if (!primaryEntity) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        localStorage.setItem(`ys_follow_${primaryEntity.type}_${primaryEntity.id}`, '1');
      } else {
        localStorage.removeItem(`ys_follow_${primaryEntity.type}_${primaryEntity.id}`);
        setAlertsEnabled(false);
        localStorage.removeItem(`ys_alerts_${primaryEntity.type}_${primaryEntity.id}`);
      }
    } catch {
      // LocalStorage unavailable
    }
  };

  const toggleAlerts = () => {
    if (!following) {
      toggleFollow();
    }
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    if (primaryEntity) {
      try {
        if (next) {
          localStorage.setItem(`ys_alerts_${primaryEntity.type}_${primaryEntity.id}`, '1');
        } else {
          localStorage.removeItem(`ys_alerts_${primaryEntity.type}_${primaryEntity.id}`);
        }
      } catch {
        // LocalStorage unavailable
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 p-3 shadow-xs backdrop-blur-md">
      {/* Left controls: Audio & Font Size */}
      <div className="flex flex-wrap items-center gap-2">
        <NewsAudioReader text={bodyHtml} />

        <div className="flex items-center rounded-xl border border-border/70 bg-background/60 p-0.5">
          <button
            type="button"
            onClick={() => changeFontSize(-1)}
            disabled={fontSizeIndex === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
            title={pick(locale, 'تصغير الخط', 'Decrease font size')}
            aria-label={pick(locale, 'تصغير الخط', 'Decrease font size')}
          >
            A-
          </button>
          <span className="px-1.5 text-[10px] font-bold text-muted-foreground tabular-nums">
            {fontSizes[fontSizeIndex].label}
          </span>
          <button
            type="button"
            onClick={() => changeFontSize(1)}
            disabled={fontSizeIndex === fontSizes.length - 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
            title={pick(locale, 'تكبير الخط', 'Increase font size')}
            aria-label={pick(locale, 'تكبير الخط', 'Increase font size')}
          >
            A+
          </button>
        </div>

        {readLabel ? (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-muted/60 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-orange-500" />
            {readLabel}
          </span>
        ) : null}
      </div>

      {/* Right controls: Bookmark, Share, and Follow */}
      <div className="flex items-center gap-2">
        {primaryEntity ? (
          <div className="flex items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 p-1">
            <button
              type="button"
              onClick={toggleFollow}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                following
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
              }`}
            >
              {following
                ? pick(locale, `تتابع ${primaryEntity.name}`, `Following ${primaryEntity.name}`)
                : pick(locale, `تابع ${primaryEntity.name}`, `Follow ${primaryEntity.name}`)}
            </button>
            {following ? (
              <button
                type="button"
                onClick={toggleAlerts}
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                  alertsEnabled
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
                }`}
                title={alertsEnabled ? pick(locale, 'التنبيهات مفعلة', 'Alerts on') : pick(locale, 'تفعيل التنبيهات', 'Turn on alerts')}
              >
                <Bell className="h-3 w-3 fill-current" />
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleBookmark}
          className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-all ${
            isSaved
              ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
              : 'border-border/80 bg-background/60 text-muted-foreground hover:border-orange-500/40 hover:text-foreground'
          }`}
          title={isSaved ? pick(locale, 'تم الحفظ في المفضلة', 'Saved to bookmarks') : pick(locale, 'حفظ في المفضلة', 'Bookmark story')}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">
            {isSaved ? pick(locale, 'محفوظ', 'Saved') : pick(locale, 'حفظ', 'Save')}
          </span>
        </button>

        <button
          type="button"
          onClick={shareArticle}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-2.5 text-xs font-bold text-muted-foreground transition-all hover:border-orange-500/40 hover:text-foreground"
          title={pick(locale, 'مشاركة الخبر', 'Share story')}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">
            {copied ? pick(locale, 'تم النسخ', 'Copied') : pick(locale, 'مشاركة', 'Share')}
          </span>
        </button>
      </div>
    </div>
  );
}
