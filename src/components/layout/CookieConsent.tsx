// src/components/layout/CookieConsent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const CookieConsent = ({ analyticsEnabled = false }: { analyticsEnabled?: boolean }) => {
  const t = useTranslations('ui');
  const locale = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('yalla-cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('yalla-cookie-consent', 'accepted');
    window.dispatchEvent(new Event('ys-cookie-consent'));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:max-w-md md:left-auto">
      <div className="bg-card text-foreground p-6 rounded-3xl shadow-2xl border border-border backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl shrink-0">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-black mb-1">{t('cookies_title')}</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-4 font-bold">
              {t('cookies_text')}
              {analyticsEnabled
                ? locale === 'en'
                  ? ' Google Analytics loads only after you accept, and only if a real measurement ID is configured.'
                  : ' تحليلات غوغل تُحمَّل بعد الموافقة فقط، وفقط إذا وُجد معرّف قياس حقيقي.'
                : locale === 'en'
                  ? ' Google Analytics is not connected yet.'
                  : ' تحليلات غوغل غير موصولة بعد.'}
            </p>
            <Link href="/cookies" className="mb-4 block text-[10px] font-bold text-orange-400">
              {locale === 'en' ? 'Cookie ledger' : 'سجل ملفات الارتباط'}
            </Link>
            <div className="flex gap-3">
              <button 
                onClick={handleAccept}
                className="bg-orange-500 hover:bg-orange-600 text-primary-foreground text-xs font-black px-6 py-2 rounded-xl transition-all"
              >
                {t('accept')}
              </button>
              <button 
                onClick={() => setShow(false)}
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-black px-6 py-2 rounded-xl transition-all"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
