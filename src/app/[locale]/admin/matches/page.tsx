import React from 'react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { CheckCircle2, Clock } from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * MatchesAdminPage - Management interface for scheduled and live matches.
 * Allows administrators to monitor sync status and manually update metadata.
 */
export default async function MatchesAdminPage() {
  const locale = await getLocale();
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: 'desc' },
    take: 20,
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المباريات', 'Manage matches')}</h1>
        <div className="flex gap-3">
           <button className="bg-card dark:bg-muted px-6 py-3 rounded-2xl font-bold text-sm border border-border dark:border-border">{pick(locale, 'تصفية حسب الدوري', 'Filter by league')}</button>
           <button className="bg-orange-500 text-primary-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20">{pick(locale, 'مزامنة يدوية', 'Manual sync')}</button>
        </div>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              {['Match','League','Time','Status','Score','Actions'].map((label) => <th key={label} className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, ({Match:'المباراة',League:'البطولة',Time:'التوقيت',Status:'الحالة',Score:'النتيجة',Actions:'الإجراءات'} as Record<string,string>)[label], label)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3 font-bold">
                    <span className="w-24 text-left">{match.homeTeam.name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="w-24">{match.awayTeam.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <span className="text-sm font-medium bg-muted dark:bg-muted px-3 py-1 rounded-full text-muted-foreground">
                      {match.league.name}
                   </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black">{format(match.kickoffAt, 'p', { locale: locale === 'ar' ? ar : enUS })}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{format(match.kickoffAt, 'dd MMMM', { locale: locale === 'ar' ? ar : enUS })}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      {match.status === 'LIVE' ? (
                        <span className="flex items-center gap-2 text-red-500 font-black text-xs">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          {pick(locale, 'مباشر', 'Live')}
                        </span>
                      ) : match.status === 'FINISHED' ? (
                        <span className="text-green-500 font-black text-xs flex items-center gap-2">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                           {pick(locale, 'منتهية', 'Finished')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-black text-xs flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5" />
                           {pick(locale, 'قريباً', 'Upcoming')}
                        </span>
                      )}
                   </div>
                </td>
                <td className="px-8 py-6 font-black text-lg">
                   {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                </td>
                <td className="px-8 py-6 text-left">
                   <Link href={`/admin/matches/${match.id}`} className="text-orange-500 font-black text-xs hover:underline">{pick(locale, 'تعديل', 'Edit')}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
