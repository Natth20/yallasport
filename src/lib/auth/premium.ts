import 'server-only';

import { prisma } from '@/lib/prisma';
import type { SubscriptionStatus } from '@/generated/prisma';

/** Paid plans stay off until a real Stripe/PayPal account exists. */
export const PAYMENTS_ENABLED = false;

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  PREMIUM: 1,
  VIP: 2,
};

export function isPremiumSubscriber(
  subscriptionStatus: string | null | undefined,
  role?: string | null
): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return subscriptionStatus === 'PREMIUM' || subscriptionStatus === 'VIP';
}

export function canAccessPremiumContent(opts: {
  requiresPremium: boolean;
  subscriptionStatus?: string | null;
  role?: string | null;
}): boolean {
  if (!opts.requiresPremium) return true;
  if (!PAYMENTS_ENABLED) return true;
  return isPremiumSubscriber(opts.subscriptionStatus, opts.role);
}

export function meetsEntitlementTier(
  userTier: string | null | undefined,
  required: string | null | undefined
): boolean {
  const need = required || 'FREE';
  return (TIER_RANK[userTier || 'FREE'] ?? 0) >= (TIER_RANK[need] ?? 0);
}

export function subscriptionLabel(
  status: SubscriptionStatus | string | null | undefined,
  locale: string
): string {
  if (!PAYMENTS_ENABLED) return locale === 'ar' ? 'مجاني' : 'Free';
  if (status === 'VIP') return 'VIP';
  if (status === 'PREMIUM') return locale === 'ar' ? 'مميز' : 'Premium';
  return locale === 'ar' ? 'مجاني' : 'Free';
}

/** Sync User.subscriptionStatus from the latest ACTIVE Subscription row (no payment gateway yet). */
export async function refreshUserSubscriptionStatus(userId: string) {
  const active = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    orderBy: { startDate: 'desc' },
    select: { tier: true },
  });

  const next: SubscriptionStatus = active?.tier ?? 'FREE';
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: next },
  });
  return next;
}
