// src/app/admin/tv-guide/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import { Tv, Link as LinkIcon, Plus } from 'lucide-react';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

export default async function AdminTVGuidePage() {
  const locale = await getLocale();
  const matches = await prisma.match.findMany({
    where: { status: 'NOT_STARTED' },
    include: { homeTeam: true, awayTeam: true, channels: { include: { channel: true } } },
    orderBy: { kickoffAt: 'asc' },
    take: 20
  });

  const channels = await prisma.channel.findMany();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-green dark:text-foreground">{pick(locale, 'إدارة القنوات الناقلة', 'Manage TV channels')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{pick(locale, 'ربط القنوات بالمباريات القادمة يدوياً.', 'Manually link channels to upcoming matches.')}</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" />
          {pick(locale, 'إضافة قناة جديدة', 'Add channel')}
        </button>
      </div>

      <div className="bg-card dark:bg-muted rounded-2xl shadow-md overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-slate-700 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border dark:border-border">
            <tr>
              <th className="px-6 py-4">{pick(locale, 'المباراة', 'Match')}</th>
              <th className="px-6 py-4 text-center">{pick(locale, 'القنوات الحالية', 'Current channels')}</th>
              <th className="px-6 py-4 text-center">{pick(locale, 'إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {matches.map((m) => (
              <tr key={m.id} className="hover:bg-muted dark:hover:bg-slate-700/50 transition-colors text-sm">
                <td className="px-6 py-4 font-bold">
                  {m.homeTeam.name} vs {m.awayTeam.name}
                  <span className="block text-[10px] text-muted-foreground mt-1 font-medium italic">
                    {new Date(m.kickoffAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    {m.channels.map((mc) => (
                      <span key={mc.id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-black">
                        {mc.channel.name}
                      </span>
                    ))}
                    {m.channels.length === 0 && <span className="text-muted-foreground italic">{pick(locale, 'لا يوجد', 'None')}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 bg-orange-500 text-primary-foreground rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 text-xs font-bold shadow-md">
                      <LinkIcon className="w-3.5 h-3.5" />
                      {pick(locale, 'ربط قناة', 'Link channel')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
