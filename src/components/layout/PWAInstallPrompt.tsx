// src/components/layout/PWAInstallPrompt.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const PWAInstallPrompt = () => {
  const t = useTranslations('ui');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShow(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-[95] md:hidden">
      <div className="bg-secondary text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/images/logo.png" alt="Yalla Sport" className="h-12 w-12 object-contain" />
          <div>
            <h4 className="font-black text-sm">{t('install_title')}</h4>
            <p className="text-[10px] text-white/60 font-bold">{t('install_text')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInstall}
            className="bg-orange-500 hover:bg-orange-600 text-primary-foreground text-[10px] font-black px-6 py-2.5 rounded-xl transition-all shadow-lg"
          >
            {t('install')}
          </button>
          <button onClick={() => setShow(false)} className="text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
