import React from 'react';
import { prisma } from '@/lib/prisma';
import { Shield, MapPin, MoreVertical, Plus } from 'lucide-react';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * TeamsAdminPage - Management of football clubs and national teams.
 */
export default async function TeamsAdminPage() {
  const locale = await getLocale();
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    take: 50,
    include: { venue: true }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة الأندية', 'Manage teams')}</h1>
        <button className="bg-orange-500 text-primary-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {pick(locale, 'إضافة فريق', 'Add team')}
        </button>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'النادي', 'Team')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'الملعب', 'Venue')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'التأسيس', 'Founded')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground text-left">{pick(locale, 'الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={team.logoUrl || '/placeholder.png'} className="w-10 h-10 object-contain" />
                    <span className="font-bold">{team.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {team.venue?.name || pick(locale, 'غير محدد', 'Not specified')}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <span className="text-sm text-muted-foreground font-bold">{team.founded || '---'}</span>
                </td>
                <td className="px-8 py-6 text-left">
                   <button className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
