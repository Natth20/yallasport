'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';

const ALERTS_STORAGE_KEY = 'ys_match_alerts';

export function getAlertMatchIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function MatchAlertBell({
  matchId,
  matchTitle,
  className = '',
  locale = 'ar',
}: {
  matchId: string;
  matchTitle?: string;
  className?: string;
  locale?: string;
}) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);
  const isAr = locale === 'ar';

  useEffect(() => {
    const alerts = getAlertMatchIds();
    setIsSubscribed(alerts.includes(matchId));
  }, [matchId]);

  const toggleAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Request browser notification permission if not yet granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    const current = getAlertMatchIds();
    const exists = current.includes(matchId);
    const updated = exists ? current.filter((id) => id !== matchId) : [...current, matchId];

    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      setIsSubscribed(!exists);

      if (!exists) {
        setJustEnabled(true);
        setTimeout(() => setJustEnabled(false), 2500);

        // Show welcome push notification if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(isAr ? 'تم تفعيل جرس تنبيهات المباراة 🔔' : 'Match Alerts Enabled 🔔', {
            body: isAr
              ? `سننبهك فوراً عند تسجيل أي هدف أو بطاقة في ${matchTitle || 'المباراة'}`
              : `You will be notified for goals and major events in ${matchTitle || 'this match'}`,
            icon: '/icon-192.png',
          });
        }
      }
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleAlert}
      title={
        isSubscribed
          ? isAr
            ? 'جرس التنبيهات مفعّل (انقر للإلغاء)'
            : 'Alerts Active (Click to cancel)'
          : isAr
          ? 'تفعيل تنبيهات الأهداف والبطاقات'
          : 'Enable Goal & Event Alerts'
      }
      className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
        isSubscribed
          ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20 hover:bg-primary/30'
          : 'text-foreground/40 hover:bg-foreground/5 hover:text-foreground/80'
      } ${className}`}
    >
      {justEnabled ? (
        <Check className="h-4 w-4 text-emerald-400 animate-bounce" />
      ) : isSubscribed ? (
        <BellRing className="h-4 w-4 fill-primary" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
    </button>
  );
}
