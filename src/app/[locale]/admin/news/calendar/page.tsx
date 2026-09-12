import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * EditorialCalendar - Visualizes scheduled news publishing.
 */
export default async function EditorialCalendarPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session) redirect('/api/auth/signin');

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });

  const scheduledNews = await prisma.news.findMany({
    where: {
      publishAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      id: true,
      title: true,
      publishAt: true,
      status: true
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-foreground dark:text-foreground flex items-center gap-4">
          <CalendarIcon className="w-8 h-8 text-orange-500" />
          {pick(locale, 'التقويم التحريري', 'Editorial calendar')}
        </h2>
        <div className="flex items-center gap-4 bg-card dark:bg-muted p-2 rounded-2xl shadow-sm">
           <button className="p-2 hover:bg-muted dark:hover:bg-slate-700 rounded-xl"><ChevronRight className="w-5 h-5" /></button>
           <span className="font-black text-sm px-4">{format(now, 'MMMM yyyy', { locale: locale === 'ar' ? ar : enUS })}</span>
           <button className="p-2 hover:bg-muted dark:hover:bg-slate-700 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {(locale === 'ar' ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(day => (
          <div key={day} className="text-center py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">{day}</div>
        ))}
        
        {days.map(day => {
          const dayNews = scheduledNews.filter(n => n.publishAt && isSameDay(n.publishAt, day));
          return (
            <div key={day.toString()} className="min-h-[150px] bg-card dark:bg-background rounded-[2rem] border border-border dark:border-border p-4 hover:shadow-xl transition-all group">
              <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl mb-3 ${isSameDay(day, now) ? 'bg-orange-500 text-primary-foreground shadow-lg shadow-orange-500/20' : 'text-muted-foreground group-hover:bg-muted dark:group-hover:bg-slate-800'}`}>
                {format(day, 'd')}
              </span>
              <div className="space-y-2">
                {dayNews.map(n => (
                  <div key={n.id} className="text-[10px] font-bold p-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-lg truncate border border-orange-100 dark:border-orange-900/30">
                    {n.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
