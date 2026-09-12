import React from 'react';
import { prisma } from '@/lib/prisma';
import { User, Flag, MoreVertical, Plus } from 'lucide-react';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * PlayersAdminPage - Management of athlete profiles.
 */
export default async function PlayersAdminPage() {
  const locale = await getLocale();
  const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
    take: 50
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة اللاعبين', 'Manage players')}</h1>
        <button className="bg-orange-500 text-primary-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {pick(locale, 'إضافة لاعب', 'Add player')}
        </button>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'اللاعب', 'Player')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'الجنسية', 'Nationality')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'المركز', 'Position')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground text-left">{pick(locale, 'الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted dark:bg-muted rounded-xl flex items-center justify-center text-muted-foreground overflow-hidden">
                      {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                    </div>
                    <span className="font-bold">{player.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase">
                      <Flag className="w-3.5 h-3.5" />
                      {player.nationality || '---'}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <span className="text-xs font-black bg-orange-50 dark:bg-orange-950/20 text-orange-600 px-3 py-1 rounded-lg">
                      {player.position || '---'}
                   </span>
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
