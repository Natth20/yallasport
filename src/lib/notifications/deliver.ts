import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { sendWebPush } from '@/lib/notifications/web-push';
import type { NotificationType } from '@/generated/prisma';

export const PUSH_ICON = '/icons/icon-192.png';

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
};

type PrefKey = 'goal' | 'matchStart' | 'matchEnd' | 'breakingNews';

export async function fansOfMatch(match: { id: string; homeTeamId: string; awayTeamId: string }) {
  const [favorites, reminders] = await Promise.all([
    prisma.userFavorite.findMany({
      where: {
        OR: [
          { entityType: 'MATCH', entityId: match.id },
          { entityType: 'TEAM', entityId: match.homeTeamId },
          { entityType: 'TEAM', entityId: match.awayTeamId },
        ],
      },
      include: { user: { include: { pushSubscriptions: true } } },
    }),
    prisma.matchReminder.findMany({
      where: { matchId: match.id },
      include: { user: { include: { pushSubscriptions: true } } },
    }),
  ]);

  const byUser = new Map<
    string,
    { prefs: Record<string, unknown> | null; subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[] }
  >();

  for (const row of [...favorites, ...reminders]) {
    byUser.set(row.userId, {
      prefs: (row.user.notificationPrefs as Record<string, unknown> | null) ?? null,
      subscriptions: row.user.pushSubscriptions,
    });
  }

  return byUser;
}

export async function usersWanting(pref: PrefKey) {
  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { pushSubscriptions: true },
  });

  return users.filter((user) => {
    const prefs = user.notificationPrefs as Record<string, unknown> | null;
    return prefs?.[pref] !== false;
  });
}

export async function deliverPush(
  userId: string,
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
  record: {
    type: NotificationType;
    entityType: string;
    entityId: string;
    matchId?: string;
  }
) {
  const body: PushPayload = {
    ...payload,
    icon: payload.icon || PUSH_ICON,
  };

  let delivered = false;
  for (const subscription of subscriptions) {
    try {
      await sendWebPush(subscription, body);
      delivered = true;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      }
    }
  }

  if (delivered) {
    await prisma.notification.create({
      data: {
        userId,
        matchId: record.matchId,
        type: record.type,
        entityType: record.entityType,
        entityId: record.entityId,
        payload: body,
      },
    });
  }

  return delivered;
}

export async function reserveOnce(key: string, seconds: number) {
  return redis.set(key, '1', { nx: true, ex: seconds });
}

export async function release(key: string) {
  await redis.del(key);
}

export function prefers(prefs: Record<string, unknown> | null, key: PrefKey) {
  return prefs?.[key] !== false;
}
