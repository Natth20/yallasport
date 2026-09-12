export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'VIP';

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  PREMIUM: 1,
  VIP: 2
};

export function normalizeCountry(value: string | null | undefined) {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

export function isGeoAllowed(country: string | null, allowList: string[]) {
  if (!allowList.length) return true;
  if (!country) return false;
  return allowList.map((item) => item.toUpperCase()).includes(country);
}

export function isEntitled(userTier: string | undefined, required: string | null | undefined) {
  const need = required || 'FREE';
  return (TIER_RANK[userTier || 'FREE'] ?? 0) >= (TIER_RANK[need] ?? 0);
}

export function isWithinWindow(
  now: Date,
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
  kickoffAt?: Date | null
) {
  const start = startsAt ?? (kickoffAt ? new Date(kickoffAt.getTime() - 15 * 60 * 1000) : null);
  const end = endsAt ?? (kickoffAt ? new Date(kickoffAt.getTime() + 3 * 60 * 60 * 1000) : null);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export function countryFromHeaders(headers: Headers) {
  return normalizeCountry(
    headers.get('cf-ipcountry') ||
      headers.get('x-vercel-ip-country') ||
      headers.get('x-geo-country')
  );
}
