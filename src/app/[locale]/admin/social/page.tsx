import React from 'react';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { canAccessAdminPath, isStaffRole } from '@/lib/auth/admin-access';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import {
  getSocialDashboardMetrics,
  getSocialAccounts,
  getAdminSocialPosts,
} from '@/lib/social/service';
import { SocialAdminClient } from './SocialAdminClient';

export const metadata: Metadata = {
  title: 'مركز التواصل الاجتماعي | لوحة الإدارة | يلا سبورت',
  description: 'إدارة حسابات يلا سبورت، دورة النشر التحريري، الجدولة، والتحليلات.',
};

export default async function AdminSocialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/admin/social`);
  }

  const role = session.user?.role as string;
  if (!isStaffRole(role) || !canAccessAdminPath(role, '/admin/social')) {
    redirect(`/${locale}/admin`);
  }

  const [metrics, accounts, { posts }, recentMatchesRaw, recentNewsRaw] = await Promise.all([
    getSocialDashboardMetrics(),
    getSocialAccounts(),
    getAdminSocialPosts({ take: 50 }),
    prisma.match.findMany({
      take: 12,
      orderBy: { kickoffAt: 'desc' },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    }),
    prisma.news.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        breaking: true,
      },
    }),
  ]);

  const recentMatches = recentMatchesRaw.map((m) => ({
    id: m.id,
    home: m.homeTeam?.name || m.homeTeam?.officialName || 'فريق',
    away: m.awayTeam?.name || m.awayTeam?.officialName || 'فريق',
    league: m.league?.name || 'البطولة',
    kickoff: m.kickoffAt.toISOString(),
  }));

  return (
    <SocialAdminClient
      locale={locale}
      userRole={role}
      userName={session.user?.name || (locale === 'ar' ? 'فريق يلا سبورت' : 'Yalla Sport Team')}
      metrics={{
        ...metrics,
        recentLogs: metrics.recentLogs.map((l) => ({
          ...l,
          executedAt: l.executedAt.toISOString(),
        })),
      }}
      accounts={accounts.map((a) => ({
        ...a,
        lastSyncAt: a.lastSyncAt ? a.lastSyncAt.toISOString() : null,
      }))}
      initialPosts={posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      }))}
      recentMatches={recentMatches}
      recentNews={recentNewsRaw}
    />
  );
}
