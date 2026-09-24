'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Share2 } from 'lucide-react';
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
      const panelWidth = panelRef.current?.offsetWidth ?? 192;
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
    window.setTimeout(() => setCopied(false), 1800);
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
      reportCaughtError("src/components/news/NewsShareMenu.tsx:118", error, { persist: false });
      // cancelled or unsupported — fall through to copy
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

  const panel =
    open && mounted && coords
      ? createPortal(
        <div
          id={menuId}
          ref={panelRef}
          className="news-share-panel"
          role="menu"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            right: 'auto',
            insetInlineStart: 'auto',
          }}
        >
          <button type="button" role="menuitem" onClick={openWhatsApp}>
            WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={openX}>
            X
          </button>
          <button type="button" role="menuitem" onClick={() => void copy()}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied
              ? pick(locale, 'تم النسخ', 'Copied')
              : pick(locale, 'نسخ الرابط', 'Copy link')}
          </button>
          <button type="button" role="menuitem" onClick={() => void nativeShare()}>
            {pick(locale, 'مشاركة الجهاز', 'Device share')}
          </button>
        </div>,
        document.body
      )
      : null;

  return (
    <div className="news-share-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="news-share-btn"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Share2 className="h-3.5 w-3.5" />
        {pick(locale, 'مشاركة', 'Share')}
      </button>
      {panel}
    </div>
  );
}
