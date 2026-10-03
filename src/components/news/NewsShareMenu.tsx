'use client';

import { reportCaughtError } from '@/lib/ops/caught';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Share2, Smartphone } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';
import { copyText } from '@/lib/clipboard';

function currentUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

export function NewsShareMenu({ title }: { title: string }) {
  const locale = useLocale();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const panelWidth = panelRef.current?.offsetWidth ?? 210;
      const gutter = 12;
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      let left = rtl ? rect.right - panelWidth : rect.left;
      left = Math.min(Math.max(gutter, left), window.innerWidth - panelWidth - gutter);
      const top = Math.min(rect.bottom + 8, window.innerHeight - 8);
      setCoords({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sharePayload = () => {
    const url = currentUrl();
    return {
      url,
      encodedUrl: encodeURIComponent(url),
      encodedTitle: encodeURIComponent(title),
    };
  };

  const copy = async () => {
    const { url } = sharePayload();
    if (!url) return;
    const ok = await copyText(url);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  const nativeShare = async () => {
    const { url } = sharePayload();
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title, url, text: title });
        setOpen(false);
        return;
      }
    } catch (error) {
      reportCaughtError('src/components/news/NewsShareMenu.tsx:118', error, { persist: false });
    }
    await copy();
  };

  const openWhatsApp = () => {
    const { encodedUrl, encodedTitle } = sharePayload();
    window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const openX = () => {
    const { encodedUrl, encodedTitle } = sharePayload();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const openTelegram = () => {
    const { encodedUrl, encodedTitle } = sharePayload();
    window.open(
      `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const panel =
    open && mounted && coords
      ? createPortal(
          <div
            id={menuId}
            ref={panelRef}
            className="z-50 min-w-[13rem] overflow-hidden rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            role="menu"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={openWhatsApp}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                W
              </span>
              <span>واتساب (WhatsApp)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={openX}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-sky-500/10 hover:text-sky-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                X
              </span>
              <span>منصة إكس (X)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={openTelegram}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                T
              </span>
              <span>تيليجرام (Telegram)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => void copy()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-foreground/80">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </span>
              <span>{copied ? pick(locale, 'تم النسخ!', 'Copied!') : pick(locale, 'نسخ الرابط', 'Copy link')}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => void nativeShare()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" />
              </span>
              <span>{pick(locale, 'مشاركة الجهاز', 'Device share')}</span>
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
          open
            ? 'border border-primary/40 bg-primary/15 text-primary'
            : 'border border-border/80 bg-card/80 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary'
        }`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>{pick(locale, 'مشاركة', 'Share')}</span>
      </button>
      {panel}
    </div>
  );
}
