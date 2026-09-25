'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { pick } from '@/i18n/pick';
import { ensurePushSubscription } from '@/components/pwa/ensure-push';

export function EnablePush() {
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'on' | 'denied' | 'busy'>('idle');

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') setStatus('on');
    if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  const enable = async () => {
    setStatus('busy');
    try {
      await ensurePushSubscription();
      setStatus('on');
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle');
    }
  };

  return (
    <div className="mb-6 rounded-3xl border border-primary/25 bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0b0b0b]">
          <img src="/icons/icon-192.png" alt="" width={48} height={48} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">
            {pick(locale, 'إشعارات الجوال بشعار يلا سبورت', 'Phone alerts with the Yalla Sport logo')}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {status === 'on'
              ? pick(locale, 'مفعّلة. هدف، بداية مباراة، أو خبر عاجل يظهر على الشاشة.', 'On. Goals, kickoff, and breaking news land on your lock screen.')
              : status === 'denied'
                ? pick(locale, 'المتصفح منع الإشعارات. اسمح بها من إعدادات الموقع.', 'The browser blocked alerts. Allow them in site settings.')
                : pick(locale, 'سجّل الدخول واضغط تفعيل. تابع فريقاً أو فعّل تذكير مباراة.', 'Sign in, tap enable, then follow a team or set a match reminder.')}
          </p>
          {status !== 'on' && status !== 'denied' ? (
            <Button className="mt-3" size="sm" variant="accent" onClick={() => void enable()} disabled={status === 'busy'}>
              {status === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {pick(locale, 'تفعيل إشعارات الجوال', 'Enable phone alerts')}
            </Button>
          ) : status === 'on' ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <BellRing className="h-3.5 w-3.5" />
              {pick(locale, 'الجوال يستقبل التنبيهات', 'This phone will receive alerts')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
