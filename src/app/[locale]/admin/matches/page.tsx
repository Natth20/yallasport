import React from 'react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { CheckCircle2, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { SyncMatchesButton } from './SyncMatchesButton';

/**
 * MatchesAdminPage - Management interface for scheduled and live matches.
 * Allows administrators to monitor sync status and manually update metadata.
 */
export default async function MatchesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const locale = await getLocale();
  const { league } = await searchParams;
  const leagueId = league && league.length > 4 ? league : undefined;
  const [matches, leagues] = await Promise.all([
    prisma.match.findMany({
      where: leagueId ? { leagueId } : undefined,
      orderBy: { kickoffAt: 'desc' },
      take: 20,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    }),
    prisma.league.findMany({
      orderBy: { name: 'asc' },
      take: 80,
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المباريات', 'Manage matches')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <SyncMatchesButton
            label={pick(locale, 'مزامنة الآن', 'Sync now')}
            busyLabel={pick(locale, 'جاري المزامنة…', 'Syncing…')}
          />
          <form className="flex gap-3" method="get">
            <select
              name="league"
              defaultValue={leagueId ?? ''}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold dark:bg-muted"
            >
              <option value="">{pick(locale, 'كل الدوريات', 'All leagues')}</option>
              {leagues.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-primary-foreground">
              {pick(locale, 'تصفية', 'Filter')}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              {['Match', 'League', 'Time', 'Status', 'Score', 'Actions'].map((label) => <th key={label} className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, ({ Match: 'المباراة', League: 'البطولة', Time: 'التوقيت', Status: 'الحالة', Score: 'النتيجة', Actions: 'الإجراءات' } as Record<string, string>)[label], label)}</th>)}
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
