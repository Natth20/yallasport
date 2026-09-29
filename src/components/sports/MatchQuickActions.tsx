'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import { useState } from 'react';
import { Bell, BellOff, CalendarPlus, Check, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ensurePushSubscription } from '@/components/pwa/ensure-push';
import { pick } from '@/i18n/pick';
import dossier from './match-dossier.module.css';

interface MatchQuickActionsProps {
  matchId: string;
  title: string;
  kickoffAt: string;
  venue?: string;
  isLoggedIn: boolean;
  initialReminder: boolean;
  tone?: 'default' | 'stage';
}

const toCalendarDate = (value: Date) =>
  value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const escapeCalendarText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

export function MatchQuickActions({
  matchId,
  title,
  kickoffAt,
  venue,
  isLoggedIn,
  initialReminder,
  tone = 'default',
}: MatchQuickActionsProps) {
  const locale = useLocale();
  const t = useTranslations('sports');
  const router = useRouter();
  const [reminderActive, setReminderActive] = useState(initialReminder);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderError, setReminderError] = useState(false);
  const [pushHint, setPushHint] = useState<string | null>(null);
  const stage = tone === 'stage';

  const toggleReminder = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/match/${matchId}`)}`);
      return;
    }

    setReminderLoading(true);
    setReminderError(false);
    setPushHint(null);
    try {
      if (!reminderActive) {
        try {
          await ensurePushSubscription();
        } catch {
          setPushHint(
            pick(
              locale,
              'التذكير يُحفظ هنا. اسمح بالإشعارات من المتصفح حتى تصلك على الجوال.',
              'The reminder is saved here. Allow browser notifications to get it on your phone.',
            ),
          );
        }
      }

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
      reportCaughtError('src/components/sports/MatchQuickActions.tsx:98', error, { persist: false });
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

  const remindClass = stage
    ? `${dossier.stageAction}${reminderActive ? ` ${dossier.stageActionOn}` : ''}`
    : `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-bold transition-all disabled:opacity-60 ${reminderActive
      ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20'
      : 'bg-muted text-foreground hover:bg-orange-50 hover:text-orange-600 dark:bg-card/[0.04] dark:text-muted-foreground'
    }`;
  const calendarClass = stage
    ? dossier.stageAction
    : 'inline-flex h-9 items-center gap-2 rounded-lg bg-muted px-3 text-[10px] font-bold text-foreground transition-all hover:bg-slate-200 dark:bg-card/[0.04] dark:text-muted-foreground dark:hover:bg-muted';

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void toggleReminder()}
          disabled={reminderLoading}
          aria-pressed={reminderActive}
          className={remindClass}
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

        <button type="button" onClick={addToCalendar} className={calendarClass}>
          {calendarAdded ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <CalendarPlus className="h-3.5 w-3.5" />}
          {calendarAdded ? t('calendar_added') : t('add_calendar')}
        </button>
      </div>
      {pushHint ? (
        <span
          className={
            stage
              ? 'text-[10px] font-bold leading-snug text-white/75'
              : 'text-[10px] font-bold leading-snug text-muted-foreground'
          }
        >
          {pushHint}
        </span>
      ) : null}
    </div>
  );
}
