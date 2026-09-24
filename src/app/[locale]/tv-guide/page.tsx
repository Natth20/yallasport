// src/app/tv-guide/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import { Tv, Globe, Clock, Search, PlayCircle, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {Link} from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'دليل البث', 'TV Guide'),
    description: pick(
      locale,
      'قنوات نقل مباريات اليوم كما وردت في دليل يلا سبورت. قائمة حقيقية دون أزرار مشاهدة وهمية.',
      "Today's match TV listings as recorded in the Yalla Sport guide. Real listings, no fake Watch buttons."
    ),
    path: '/tv-guide',
  });
}

export default async function TVGuidePage({ searchParams }: { searchParams: Promise<{ channel?: string, country?: string }> }) {
  const locale = await getLocale();
  const params = await searchParams;
  const { channel, country } = params;

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(dayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const channelFilter = {
    name: channel ? { contains: channel } : undefined,
    country: country ? { contains: country } : undefined,
  };

  const includeMc = {
    match: {
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    },
    channel: true,
  } as const;

  // Prefer live + today→+7d listings; fall back to any linked channels so the guide is never empty of real data.
  let matchChannels = await prisma.matchChannel.findMany({
    where: {
      OR: [
        { match: { status: { in: ['LIVE', 'HALFTIME'] } } },
        { match: { kickoffAt: { gte: dayStart, lte: weekEnd } } },
      ],
      channel: channelFilter,
    },
    include: includeMc,
    orderBy: { match: { kickoffAt: 'asc' } },
    take: 60,
  });

  if (matchChannels.length === 0) {
    matchChannels = await prisma.matchChannel.findMany({
      where: { channel: channelFilter },
      include: includeMc,
      orderBy: { match: { kickoffAt: 'desc' } },
      take: 24,
    });
  }

  const allChannels = await prisma.channel.findMany({
    distinct: ['name'],
    select: { name: true, country: true }
  });

  const uniqueCountries = Array.from(new Set(allChannels.map(c => c.country).filter(Boolean)));

  return (
    <div className="min-h-screen bg-card dark:bg-black pb-40">
      
      {/* Cinematic Header */}
      <section className="pt-6 pb-16 border-b border-border dark:border-border relative overflow-hidden text-center">
         <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <span className="mb-6 block text-[11px] font-bold text-orange-500">
               {pick(locale, 'قنوات النقل المسجّلة', 'Listed channels')}
            </span>
            <h1 className="mb-8 text-4xl font-black tracking-tight dark:text-foreground sm:text-6xl md:text-7xl">
               {pick(locale, 'دليل البث', 'TV guide')}
            </h1>
            
            <form className="flex flex-wrap justify-center gap-6 mt-12">
               <div className="bg-muted dark:bg-card/[0.04] p-2 rounded-[2.5rem] border border-border dark:border-border shadow-2xl flex flex-wrap gap-2">
                  <div className="relative">
                    <select 
                      name="country" 
                      className="appearance-none bg-transparent pl-12 pr-8 py-4 font-black text-[10px] uppercase tracking-widest outline-none dark:text-foreground min-w-[180px]"
                      defaultValue={country || ""}
                    >
                      <option value="">{pick(locale, 'كل المناطق', 'All regions')}</option>
                      {uniqueCountries.map(c => <option key={c} value={c as string}>{c}</option>)}
                    </select>
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>

                  <div className="w-px h-10 bg-gray-200 dark:bg-muted/10 self-center"></div>

                  <div className="relative">
                    <select 
                      name="channel" 
                      className="appearance-none bg-transparent pl-12 pr-8 py-4 font-black text-[10px] uppercase tracking-widest outline-none dark:text-foreground min-w-[180px]"
                      defaultValue={channel || ""}
                    >
                      <option value="">{pick(locale, 'كل القنوات', 'All channels')}</option>
                      {allChannels.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <Tv className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>

                  <button type="submit" className="bg-foreground dark:bg-card text-white dark:text-foreground px-12 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95">
                    {pick(locale, 'تصفية', 'Filter')}
                  </button>
               </div>
            </form>
         </div>
      </section>

      {/* Broadcasting Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-24">
        {matchChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {matchChannels.map((mc) => (
              <div key={mc.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-border dark:bg-card sm:rounded-3xl">

                {/* Channel Context */}
                <div className="relative flex items-center justify-between overflow-hidden bg-background p-5 sm:p-8">
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center p-3 shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                      {mc.channel.logoUrl ? (
                        <img src={mc.channel.logoUrl} alt={mc.channel.name} className="w-full h-full object-contain" />
                      ) : (
                        <Radio className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-2xl tracking-tight mb-2 uppercase">{mc.channel.name}</h3>
                      <span className="text-orange-400 text-[8px] font-black uppercase tracking-[0.4em] px-3 py-1 bg-white/10 rounded-full border border-white/15">
                        {mc.channel.country || pick(locale, 'دولي', 'International')}
                      </span>
                    </div>
                  </div>
                  <div className="text-left relative z-10">
                     <Radio className="w-6 h-6 text-red-500 mb-4 ml-auto animate-pulse" />
                     <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                        {format(mc.match.kickoffAt, 'HH:mm')}
                     </span>
                  </div>
                  {/* Background Aura */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none"></div>
                </div>

                {/* Matchup Context */}
                <div className="space-y-6 p-6 text-center sm:p-10">
                  <div className="flex items-center justify-between gap-10">
                    <div className="flex flex-col items-center flex-1 gap-4">
                       <img src={mc.match.homeTeam.logoUrl || "/placeholder-team.png"} className="w-12 h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                       <span className="text-[11px] font-black uppercase tracking-wider text-foreground dark:text-foreground line-clamp-1">{mc.match.homeTeam.name}</span>
                    </div>
                    <div className="text-muted-foreground dark:text-foreground font-black text-xs uppercase tracking-[0.5em]">VS</div>
                    <div className="flex flex-col items-center flex-1 gap-4">
                       <img src={mc.match.awayTeam.logoUrl || "/placeholder-team.png"} className="w-12 h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                       <span className="text-[11px] font-black uppercase tracking-wider text-foreground dark:text-foreground line-clamp-1">{mc.match.awayTeam.name}</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-border dark:border-border flex items-center justify-center">
                     <span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.3em]">
                        {mc.match.league.name}
                     </span>
                  </div>
                </div>

                {/* Entry Action */}
                <Link href={`/match/${mc.match.id}`} className="group/btn block w-full py-8 bg-muted dark:bg-card/[0.04] hover:bg-orange-500 transition-all duration-500 text-center">
                   <div className="flex items-center justify-center gap-4">
                      <PlayCircle className="w-6 h-6 text-orange-500 group-hover/btn:text-white transition-colors duration-500" />
                      <span className="text-sm font-bold text-foreground group-hover/btn:text-white dark:text-foreground">
                        {pick(locale, 'صفحة المباراة', 'Match page')}
                      </span>
                   </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted py-16 text-center dark:border-border dark:bg-card/[0.04] sm:py-24">
            <Tv className="mx-auto h-12 w-12 text-muted-foreground dark:text-foreground/15" />
            <div className="space-y-2">
              <h2 className="text-xl font-black text-muted-foreground dark:text-muted-foreground">
                {pick(locale, 'لا نقل مسجّل حالياً', 'No listings right now')}
              </h2>
              <p className="mx-auto max-w-xs text-sm font-medium text-muted-foreground">
                {pick(locale, 'لا قنوات ناقلة للمباريات المختارة في الدليل الآن. جرّب تغيير المنطقة أو القناة.', 'No TV channels are listed for the selected filters. Try another region or channel.')}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Global Notice */}
      <footer className="max-w-7xl mx-auto px-6 lg:px-12 mt-40">
         <div className="p-12 border-t border-border dark:border-border text-center">
            <p className="mx-auto max-w-3xl text-xs leading-7 text-muted-foreground dark:text-muted-foreground">
               {pick(
                 locale,
                 'حقوق البث لأصحابها. الدليل يسجّل القنوات الواردة لدينا فقط، والتواقيت كما وردت من المصدر.',
                 'Broadcast rights stay with their owners. This guide lists channels we have on file; kickoff times follow the source.'
               )}
            </p>
         </div>
      </footer>
    </div>
  );
}
