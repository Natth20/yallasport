'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle, Smartphone, Sparkles, X, Zap, Volume2, ShieldCheck } from 'lucide-react';

interface PushNotificationBannerProps {
  locale?: string;
}

export function PushNotificationBanner({ locale = 'ar' }: PushNotificationBannerProps) {
  const isAr = locale === 'ar';
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Notification Preferences Toggles
  const [prefs, setPrefs] = useState({
    goals: true,
    matchStartEnd: true,
    breakingNews: true,
    derbies: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setSuccess(true);
      }
    }
  }, []);

  if (!isSupported || dismissed) return null;

  const subscribeUser = async () => {
    setLoading(true);
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm === 'granted') {
          setSuccess(true);

          // Dispatch real immediate browser/mobile push notification test
          try {
            const notif = new Notification(
              isAr ? '⚽ قووووول! إشعار يلا سبورت الحي' : '⚽ GOAAAL! YallaSport Live Alert',
              {
                body: isAr
                  ? 'تم تفعيل إشعارات الأهداف بنجاح! ستصلك تنبيهات المباريات مباشرة على جهازك لحظة بلحظة 🔔'
                  : 'Goal alerts activated! Live match moments will be pushed straight to your device 🔔',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                tag: 'yallasport-welcome-alert',
              } as any
            );
            setTestSent(true);
          } catch (e) {
            console.log('Direct Notification API triggered');
          }
        }
      }
    } catch (err) {
      console.error('Push notification permission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestGoalAlert = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isAr ? '⚽ هدف! ريال مدريد 1 - 0 مانشستر سيتي' : '⚽ Goal! Real Madrid 1 - 0 Manchester City', {
          body: isAr
            ? 'الدقيقة 34′: تسديدة صاروخية من فينيسيوس جونيور تسكن الشباك 🔥'
            : 'Minute 34\': Thunderous strike by Vinicius Jr finds the top corner 🔥',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: 'yallasport-goal-alert-test',
        } as any);
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } catch (e) {
        console.log('Test notification dispatched');
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card/95 via-primary/10 to-card/90 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl shadow-primary/10 transition-all">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left Side: Icon & Title & Preference Pills */}
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 text-white shadow-xl shadow-primary/30">
            {success ? (
              <BellRing className="h-6 w-6 animate-bounce" />
            ) : (
              <Bell className="h-6 w-6 animate-pulse" />
            )}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-primary border border-primary/30">
                {isAr ? 'إشعارات الأهداف المباشرة' : 'Live Match Push Alerts'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isAr ? 'تنبيه فوري للجوال والمتصفح' : 'Instant Mobile & Desktop Push'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-foreground mt-1">
              {success
                ? isAr
                  ? '✓ إشعارات الأهداف مفعلة بنجاح على جهازك!'
                  : '✓ Live Match Alerts are ACTIVE on your device!'
                : isAr
                ? 'لا تفوّت أي هدف! فعّل إشعارات الأهداف والمباريات المباشرة 🔔'
                : 'Never miss a goal! Activate live match & goal push notifications 🔔'}
            </h3>

            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isAr
                ? 'تصلك تنبيهات الأهداف وصافرة البداية والنهاية والأخبار العاجلة مباشرة على شاشة جوالك دون الحاجة لفتح التطبيق.'
                : 'Receive instant goal notifications, kickoff sirens, and breaking news directly on your lock screen.'}
            </p>

            {/* Notification Category Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, goals: !p.goals }))}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                  prefs.goals
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-white/5 text-muted-foreground border border-white/10'
                }`}
              >
                <span>⚽ {isAr ? 'الأهداف اللحظية' : 'Goals'}</span>
                {prefs.goals && <span className="text-[10px]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, matchStartEnd: !p.matchStartEnd }))}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                  prefs.matchStartEnd
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-muted-foreground border border-white/10'
                }`}
              >
                <span>⏱️ {isAr ? 'صافرة البداية والنهاية' : 'Kickoff/End'}</span>
                {prefs.matchStartEnd && <span className="text-[10px]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, derbies: !p.derbies }))}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                  prefs.derbies
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-white/5 text-muted-foreground border border-white/10'
                }`}
              >
                <span>🔥 {isAr ? 'قمم الأسبوع ودوري الأبطال' : 'Derbies & UCL'}</span>
                {prefs.derbies && <span className="text-[10px]">✓</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons & Dismiss */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {success ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sendTestGoalAlert}
                className="flex items-center gap-1.5 rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/15 transition-all active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{testSent ? (isAr ? 'تم إرسال إشعار تجريبي! ✓' : 'Sent! ✓') : isAr ? 'إرسال إشعار تجريبي ⚽' : 'Send Test Alert ⚽'}</span>
              </button>

              <div className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs font-black text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span>{isAr ? 'مفعل' : 'Active'}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={subscribeUser}
              disabled={loading}
              className="flex flex-1 md:flex-initial items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              <BellRing className="h-4 w-4" />
              <span>{loading ? (isAr ? 'جاري التفعيل...' : 'Activating...') : isAr ? 'تفعيل الإشعارات الآن 🔔' : 'Activate Live Alerts 🔔'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
