import React from 'react';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { linkMatchChannel } from './actions';

export default async function AdminTVGuidePage() {
  const locale = await getLocale();
  const [matches, channels] = await Promise.all([
    prisma.match.findMany({
      where: { status: 'NOT_STARTED' },
      include: { homeTeam: true, awayTeam: true, channels: { include: { channel: true } } },
      orderBy: { kickoffAt: 'asc' },
      take: 20,
    }),
    prisma.channel.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-brand-green dark:text-foreground">
          {pick(locale, 'إدارة القنوات الناقلة', 'Manage TV channels')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(locale, 'ربط قناة موجودة بمباراة قادمة.', 'Link an existing channel to an upcoming match.')}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-md dark:bg-muted">
        <table className="w-full text-right">
          <thead className="border-b border-border bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:border-border dark:bg-slate-700">
            <tr>
              <th className="px-6 py-4">{pick(locale, 'المباراة', 'Match')}</th>
              <th className="px-6 py-4 text-center">{pick(locale, 'القنوات الحالية', 'Current channels')}</th>
              <th className="px-6 py-4 text-center">{pick(locale, 'ربط', 'Link')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {matches.map((m) => (
              <tr key={m.id} className="text-sm transition-colors hover:bg-muted dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-bold">
                  {m.homeTeam.name} vs {m.awayTeam.name}
                  <span className="mt-1 block text-[10px] font-medium italic text-muted-foreground">
                    {new Date(m.kickoffAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    {m.channels.map((mc) => (
                      <span
                        key={mc.id}
                        className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {mc.channel.name}
                      </span>
                    ))}
                    {m.channels.length === 0 && (
                      <span className="italic text-muted-foreground">{pick(locale, 'لا يوجد', 'None')}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {channels.length > 0 ? (
                    <form action={linkMatchChannel} className="flex items-center justify-center gap-2">
                      <input type="hidden" name="matchId" value={m.id} />
                      <select
                        name="channelId"
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        defaultValue={channels[0]?.id}
                      >
                        {channels.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-orange-600"
                      >
                        {pick(locale, 'ربط', 'Link')}
                      </button>
                    </form>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      {pick(locale, 'لا قنوات في القاعدة', 'No channels in the database')}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
