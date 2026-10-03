'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import type { PublicAdSlot } from '@/lib/ads/catalog';
import { adsensePublisherId, isAdsenseSlotId, isSafeAdHref, isSafeAdHtml } from '@/lib/ads/catalog';
import styles from './site-ad.module.css';

function markView(id: string) {
  const key = `ys-ad-view:${id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
  void fetch('/api/ads/view', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
    keepalive: true,
  });
}

function AdSenseUnit({ slotId, publisherId }: { slotId: string; publisherId: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <ins
        className={`adsbygoogle ${styles.adsense}`}
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}

export function AdCreative({
  slot,
  locale,
}: {
  slot: PublicAdSlot;
  locale: string;
}) {
  const ar = locale === 'ar';
  const publisher = adsensePublisherId();
  const href = slot.linkUrl && isSafeAdHref(slot.linkUrl) ? `/api/ads/go?id=${encodeURIComponent(slot.id)}` : null;

  useEffect(() => {
    markView(slot.id);
  }, [slot.id]);

  if (publisher && slot.adsenseSlot && isAdsenseSlotId(slot.adsenseSlot)) {
    return <AdSenseUnit slotId={slot.adsenseSlot.trim()} publisherId={publisher} />;
  }

  if (slot.html && isSafeAdHtml(slot.html)) {
    return <div className={styles.html} dangerouslySetInnerHTML={{ __html: slot.html }} />;
  }

  const image = slot.imageUrl && isSafeAdHref(slot.imageUrl) ? slot.imageUrl : null;
  const headline = slot.headline?.trim() || (ar ? 'مساحة إعلانية' : 'Advertisement');

  const inner = (
    <>
      {image ? <img src={image} alt="" className={styles.image} /> : null}
      <span className={styles.copy}>
        <em>{ar ? 'إعلان' : 'Ad'}</em>
        <strong>{headline}</strong>
      </span>
    </>
  );

  if (href) {
    return (
      <a className={styles.house} href={href} rel="noopener sponsored">
        {inner}
      </a>
    );
  }

  return <div className={styles.house}>{inner}</div>;
}
