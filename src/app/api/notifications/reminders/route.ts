import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { sendWebPush } from '@/lib/notifications/web-push';
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
      if (preferences?.matchStart === false) continue;

      const dedupKey = `notification:match-start:${match.id}:${reminder.userId}`;
      const reserved = await redis.set(dedupKey, '1', { nx: true, ex: 86400 });
      if (!reserved) continue;

      const payload = {
        title: 'المباراة تبدأ بعد 15 دقيقة',
        body: `${match.homeTeam.name} ضد ${match.awayTeam.name}`,
        url: `/match/${match.id}`,
        tag: `match-start-${match.id}`,
        icon: '/images/logo.jpg',
      };

      let delivered = false;
      for (const subscription of reminder.user.pushSubscriptions) {
        try {
          await sendWebPush(subscription, payload);
          delivered = true;
        } catch (error) {
          failed += 1;
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: subscription.id } });
          }
        }
      }

      if (delivered) {
        await prisma.notification.create({
          data: {
            userId: reminder.userId,
            matchId: match.id,
            type: 'MATCH_START',
            entityType: 'MATCH',
            entityId: match.id,
            payload,
          },
        });
        sent += 1;
      } else {
        await redis.del(dedupKey);
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
