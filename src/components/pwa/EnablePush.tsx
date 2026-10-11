'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, CheckCircle2, Loader2, Send, ShieldAlert } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { pick } from '@/i18n/pick';
import { ensurePushSubscription } from '@/components/pwa/ensure-push';

export function EnablePush() {
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'on' | 'denied' | 'busy'>('idle');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') setStatus('on');
    if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  const enable = async () => {
    setStatus('busy');
    setTestResult(null);
    try {
      await ensurePushSubscription();
      setStatus('on');

      // Auto-send welcome notification
      fetch('/api/user/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pick(locale, 'يلا سبورت | تم التفعيل بنجاح ✅', 'Yalla Sport | Enabled Successfully ✅'),
          body: pick(locale, 'أهلاً بك! ستصلك التنبيهات والأهداف والأخبار المباشرة هنا.', 'Welcome! You will receive live alerts, goals, and news here.'),
          url: '/ar/matches',
        }),
      }).catch(console.error);
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle');
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // First ensure subscription is fresh
      await ensurePushSubscription().catch(() => undefined);

      const res = await fetch('/api/user/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pick(locale, 'يلا سبورت | أرسنال - ليدز يونايتد ⚽', 'Yalla Sport | Arsenal - Leeds United ⚽'),
          body: pick(locale, 'انتهت المباراة (2 - 1) • أرسنال يتأهل!', 'Match ended (2 - 1) • Arsenal advances!'),
          url: '/ar/matches',
        }),
      });

      if (res.ok) {
        setTestResult(pick(locale, 'تم إرسال إشعار تجريبي لهاتفك بنجاح! تفقد شاشة القفل 🔔', 'Test push sent successfully! Check lock screen 🔔'));
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult(data.error || pick(locale, 'تعذر إرسال الإشعار، تأكد من تسجيل الدخول', 'Could not send test push'));
      }
    } catch {
      setTestResult(pick(locale, 'حدث خطأ أثناء إرسال الإشعار التجريبي', 'Error sending test push'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mb-6 rounded-3xl border border-primary/25 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0b0b0b] border border-white/10 shadow-md">
          <img src="/icons/icon-192.png" alt="Yalla Sport" width={44} height={44} className="object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black">
              {pick(locale, 'إشعارات الجوال المباشرة (مثل 365Scores و FilGoal)', 'Live Phone Alerts (like 365Scores & FilGoal)')}
            </p>
            {status === 'on' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />
                {pick(locale, 'مفعّل', 'Active')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-semibold text-muted-foreground leading-relaxed">
            {status === 'on'
              ? pick(
                  locale,
                  'التنبيهات مفعّلة على هذا الجهاز! ستصلك أهداف المباريات، بداية ونهاية اللقاءات، والتشكيلات والأخبار العاجلة مباشرة على شاشة القفل.',
                  'Push alerts are active! Kickoffs, goals, final scores, lineups, and breaking news will appear on your lock screen.'
                )
              : status === 'denied'
                ? pick(locale, 'المتصفح حظر الإشعارات. يرجى الضغط على علامة القفل بجانب الرابط والسماح بالإشعارات.', 'Notifications blocked in browser. Tap the padlock icon to allow.')
                : pick(locale, 'اضغط تفعيل لاستقبال أهداف وتشكيلات وأخبار فرقك ومبارياتك المفضلة فوراً بصوت واهتزاز.', 'Tap enable to receive instant alerts, line-ups, and breaking news.')}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            {status !== 'on' && status !== 'denied' ? (
              <Button size="sm" variant="accent" onClick={() => void enable()} disabled={status === 'busy'} className="font-bold">
                {status === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {pick(locale, 'تفعيل إشعارات الجوال', 'Enable phone alerts')}
              </Button>
            ) : status === 'on' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void sendTestNotification()}
                  disabled={testing}
                  className="font-bold text-xs"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {pick(locale, 'إرسال إشعار تجريبي للتأكد 📲', 'Send test notification 📲')}
                </Button>
              </>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <ShieldAlert className="h-4 w-4" />
                {pick(locale, 'الإشعارات محظورة من إعدادات المتصفح', 'Notifications blocked in browser settings')}
              </p>
            )}
          </div>

          {testResult ? (
            <p className="mt-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {testResult}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
