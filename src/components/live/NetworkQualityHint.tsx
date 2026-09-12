'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { networkAutoCopy } from '@/lib/streaming/network-cap';

export function NetworkQualityHint({ className }: { className?: string }) {
  const locale = useLocale();
  const [copy, setCopy] = useState(
    locale === 'ar'
      ? 'الجودة الافتراضية تلقائية حسب سرعة الاتصال. طبقات المصدر تظهر داخل المشغّل.'
      : 'Default quality is Auto from your connection. Source layers appear inside the player.'
  );

  useEffect(() => {
    setCopy(networkAutoCopy(locale));
  }, [locale]);

  return <p className={className}>{copy}</p>;
}
