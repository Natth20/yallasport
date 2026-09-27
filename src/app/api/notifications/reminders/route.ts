import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deliverPush, prefers, reserveOnce, release } from '@/lib/notifications/deliver';
import { isAuthorizedCron } from '@/lib/security/cron';

interface NotificationPreferences {
  matchStart?: boolean;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const windowStart = new Date(now + 10 * 60 * 1000);
  const windowEnd = new Date(now + 16 * 60 * 1000);
  const matches = await prisma.match.findMany({
    where: {
      status: 'NOT_STARTED',
      kickoffAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const match of matches) {
    const reminders = await prisma.matchReminder.findMany({
      where: { matchId: match.id },
      include: {
        user: {
          include: { pushSubscriptions: true },
        },
      },
    });

    for (const reminder of reminders) {
      const preferences = reminder.user.notificationPrefs as NotificationPreferences | null;
      if (!prefers(preferences as Record<string, unknown> | null, 'matchStart')) continue;

      const dedupKey = `notification:kickoff-soon:${match.id}:${reminder.userId}`;
      const reserved = await reserveOnce(dedupKey, 86400);
      if (!reserved) continue;

      const delivered = await deliverPush(
        reminder.userId,
        reminder.user.pushSubscriptions,
        {
          title: 'المباراة تبدأ خلال 10-16 دقيقة',
          body: `${match.homeTeam.name} ضد ${match.awayTeam.name}`,
          url: `/ar/match/${match.id}`,
          tag: `kickoff-soon-${match.id}`,
        },
        {
          type: 'MATCH_START',
          entityType: 'MATCH',
          entityId: match.id,
          matchId: match.id,
        }
      );

      if (delivered) sent += 1;
      else {
        failed += 1;
        await release(dedupKey);
      }
    }
  }

  return NextResponse.json({
    success: true,
    checkedMatches: matches.length,
    sent,
    failed,
    timestamp: new Date().toISOString(),
  });
}
