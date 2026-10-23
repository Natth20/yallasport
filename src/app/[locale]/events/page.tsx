import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { getUnifiedEvents } from '@/lib/events/service';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { EventsFeedClient } from './EventsFeedClient';

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'الأحداث الرياضية المباشرة — الموجز الزمني الموحد | يلا سبورت', 'Live Sports Events — Unified Feed & Timelines | Yalla Sport'),
    description: pick(
      locale,
      'موجز زمني موحد يجمع المباريات المباشرة، أحداث اللقاءات، الأخبار العاجلة، وسوق الانتقالات من المصادر الرياضية المعتمدة.',
      'Unified real-time sports timeline consolidating live fixtures, in-game events, breaking news, and verified transfer deals.'
    ),
    path: '/events',
  });
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ timeframe?: string; league?: string; type?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { timeframe, league, type } = await searchParams;

  const selectedTimeframe = (timeframe === 'today' || timeframe === 'month' ? timeframe : 'week') as 'today' | 'week' | 'month';
  const selectedType = (type || 'all').trim();
  const selectedLeague = (league || '').trim();

  const [eventsData, activeLeagues] = await Promise.all([
    getUnifiedEvents({
      timeframe: selectedTimeframe,
      type: selectedType as unknown as 'all',
      leagueSlug: selectedLeague || undefined,
      limit: 60,
      locale,
    }),
    prisma.league.findMany({
      where: {
        matches: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        matches: {
          _count: 'desc',
        },
      },
      take: 24,
    }),
  ]);

  const localizedLeagues = activeLeagues.map((lg) => ({
    ...lg,
    name: localizePlainName(locale, lg.name),
  }));

  return (
    <EventsFeedClient
      locale={locale}
      initialEvents={eventsData.events}
      initialSources={eventsData.sources}
      initialTimeframe={selectedTimeframe}
      initialType={selectedType}
      initialLeague={selectedLeague}
      leagues={localizedLeagues}
    />
  );
}
