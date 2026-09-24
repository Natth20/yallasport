'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import { useState } from 'react';
import { Bell, BellOff, CalendarPlus, Check, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import {useLocale, useTranslations} from 'next-intl';

interface MatchQuickActionsProps {
  matchId: string;
  title: string;
  kickoffAt: string;
  venue?: string;
  isLoggedIn: boolean;
  initialReminder: boolean;
}

const toCalendarDate = (value: Date) =>
  value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const escapeCalendarText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
};

export function MatchQuickActions({
  matchId,
  title,
  kickoffAt,
  venue,
  isLoggedIn,
  initialReminder,
}: MatchQuickActionsProps) {
  const locale = useLocale();
  const t = useTranslations('sports');
  const router = useRouter();
  const [reminderActive, setReminderActive] = useState(initialReminder);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderError, setReminderError] = useState(false);

  const ensurePushSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push is not supported');
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
    if (permission !== 'granted') throw new Error('Notification permission denied');

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const keyResponse = await fetch('/api/user/push/subscribe');
      if (!keyResponse.ok) throw new Error('Push is not configured');
      const { publicKey } = await keyResponse.json();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const response = await fetch('/api/user/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) throw new Error('Could not save push subscription');
  };

  const toggleReminder = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/match/${matchId}`)}`);
      return;
    }

    setReminderLoading(true);
    setReminderError(false);
    try {
      if (!reminderActive) await ensurePushSubscription();

      const response = await fetch('/api/user/match-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          action: reminderActive ? 'REMOVE' : 'ADD',
        }),
      });

      if (response.ok) setReminderActive((current) => !current);
      else throw new Error('Could not save reminder');
    } catch (error) {
      reportCaughtError("src/components/sports/MatchQuickActions.tsx:98", error, { persist: false });
      setReminderError(true);
    } finally {
      setReminderLoading(false);
    }
  };

  const addToCalendar = () => {
    const start = new Date(kickoffAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//Yalla Sport//Match Center//${locale.toUpperCase()}`,
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${matchId}@yallasport.com`,
      `DTSTAMP:${toCalendarDate(new Date())}`,
      `DTSTART:${toCalendarDate(start)}`,
      `DTEND:${toCalendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(title)}`,
      `DESCRIPTION:${escapeCalendarText(t('calendar_description'))}`,
      `LOCATION:${escapeCalendarText(venue || t('venue_tbd'))}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const file = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yalla-sport-${matchId}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setCalendarAdded(true);
    window.setTimeout(() => setCalendarAdded(false), 2500);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={toggleReminder}
        disabled={reminderLoading}
        aria-pressed={reminderActive}
        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-bold transition-all disabled:opacity-60 ${
          reminderActive
            ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20'
            : 'bg-muted text-foreground hover:bg-orange-50 hover:text-orange-600 dark:bg-card/[0.04] dark:text-muted-foreground'
        }`}
      >
        {reminderLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : reminderActive ? (
          <BellOff className="h-3.5 w-3.5" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        {reminderError ? t('reminder_failed') : reminderActive ? t('reminder_on') : t('remind_me')}
      </button>

      <button
        type="button"
        onClick={addToCalendar}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-muted px-3 text-[10px] font-bold text-foreground transition-all hover:bg-slate-200 dark:bg-card/[0.04] dark:text-muted-foreground dark:hover:bg-muted"
      >
        {calendarAdded ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <CalendarPlus className="h-3.5 w-3.5" />}
        {calendarAdded ? t('calendar_added') : t('add_calendar')}
      </button>
    </div>
  );
}
