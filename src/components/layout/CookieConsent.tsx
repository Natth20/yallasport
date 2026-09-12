// src/components/layout/CookieConsent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import {useTranslations} from 'next-intl';

export const CookieConsent = () => {
  const t = useTranslations('ui');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('yalla-cookie-consent');
    if (!consent) {
      setShow(true);
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('SW registered: ', registration);
        }).catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('yalla-cookie-consent', 'accepted');
    setShow(false);
    // Here you would trigger Google Analytics load
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:max-w-md md:left-auto">
      <div className="bg-background text-white p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl shrink-0">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-black mb-1">{t('cookies_title')}</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-4 font-bold">
              {t('cookies_text')}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleAccept}
                className="bg-orange-500 hover:bg-orange-600 text-primary-foreground text-xs font-black px-6 py-2 rounded-xl transition-all"
              >
                {t('accept')}
              </button>
              <button 
                onClick={() => setShow(false)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-black px-6 py-2 rounded-xl transition-all"
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
