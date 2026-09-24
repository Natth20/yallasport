'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';

export function PwaInstallBanner({ locale = 'ar' }: { locale?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const isAr = locale === 'ar';

  useEffect(() => {
    // Check if user dismissed prompt previously
    const dismissed = localStorage.getItem('ys_pwa_dismissed');
    if (dismissed) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('ys_pwa_dismissed', 'true');
    } catch (error) {
      reportCaughtError("src/components/pwa/PwaInstallBanner.tsx:41", error, { persist: false });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-lg overflow-hidden rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl shadow-primary/20 backdrop-blur-xl sm:bottom-6 animate-[slideUp_0.4s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-black text-foreground">
                {isAr ? 'تثبيت تطبيق يلا سبورت' : 'Install YallaSport App'}
              </h4>
            </div>
            <p className="truncate text-[11px] font-semibold text-foreground/60">
              {isAr ? 'وصول أسرع بدون شريط المتصفح وإشعارات أهداف فورية' : 'Instant goal alerts & standalone app experience'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isAr ? 'تثبيت' : 'Install'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
