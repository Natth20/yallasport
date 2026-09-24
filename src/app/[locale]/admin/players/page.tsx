import React from 'react';
import { prisma } from '@/lib/prisma';
import { User, Flag } from 'lucide-react';
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
      <div>
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة اللاعبين', 'Manage players')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(locale, 'عرض من القاعدة. لا إضافة يدوية من هنا.', 'Database list only. Players are not created from this screen.')}
        </p>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'اللاعب', 'Player')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'الجنسية', 'Nationality')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'المركز', 'Position')}</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
