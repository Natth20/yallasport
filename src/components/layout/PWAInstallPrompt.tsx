'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { pick } from '@/i18n/pick';
import styles from './pwa-install.module.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

export const PWAInstallPrompt = () => {
  const t = useTranslations('ui');
  const locale = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem('ys_pwa_hide') === '1') return;

    if (isIosSafari()) {
      setIosHint(true);
      setShow(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const hide = () => {
    setShow(false);
    try {
      sessionStorage.setItem('ys_pwa_hide', '1');
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') hide();
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.card}>
        <img
          className={styles.logo}
          src="/icons/icon-192.png"
          alt={pick(locale, 'شعار يلا سبورت', 'Yalla Sport logo')}
          width={48}
          height={48}
        />
        <div className={styles.copy}>
          <p className={styles.title}>{t('install_title')}</p>
          <p className={styles.text}>
            {iosHint
              ? pick(
                  locale,
                  'من سفاري: شارك ← إضافة إلى الشاشة الرئيسية. شعار YS يظهر على جوالك.',
                  'In Safari: Share → Add to Home Screen. The YS logo lands on your phone.',
                )
              : t('install_text')}
          </p>
        </div>
        <div className={styles.actions}>
          {!iosHint ? (
            <Button size="sm" variant="accent" onClick={() => void handleInstall()}>
              {t('install')}
            </Button>
          ) : null}
          <Button size="icon" variant="ghost" aria-label={pick(locale, 'إغلاق', 'Close')} onClick={hide}>
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
