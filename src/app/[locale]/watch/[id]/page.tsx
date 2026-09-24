import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { WatchBooth } from '@/components/streaming/WatchBooth';
import { getWatchTarget, upcomingLicensedWindows, licensedAssetsForMatch } from '@/lib/streaming/catalog';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { requireLicensedStreaming } from '@/lib/streaming/public-door';
import { countryFromHeaders, isEntitled, isGeoAllowed } from '@/lib/streaming/entitlement';
import { relatedNewsForMatch } from '@/lib/news/entity-suggest';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const t = await getTranslations('watch');
  const locale = await getLocale();
  const { id } = await params;
  const asset = await getWatchTarget(id);
  if (!asset) {
    return pageMetadata({
      locale,
      title: t('title'),
      description: t('title'),
      path: `/watch/${id}`,
      noIndex: true,
    });
  }
  const title = asset.match
    ? `${asset.match.homeTeam.name} vs ${asset.match.awayTeam.name}`
    : asset.channel?.name || t('title');
  return pageMetadata({
    locale,
    title,
    description: t('kicker'),
    path: `/watch/${id}`,
    noIndex: true,
  });
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLicensedStreaming();
  const locale = await getLocale();
  const { id } = await params;
  const session = await auth();
  const headerList = await headers();
  const country = countryFromHeaders(headerList);
  const asset = await getWatchTarget(id);

  if (!STREAMING_ENABLED) {
    return (
      <WatchBooth
        locale={locale}
        entitled={false}
        asset={null}
        siblingChannels={[]}
        upcoming={[]}
        related={[]}
      />
    );
  }

  if (!asset) notFound();

  const related = asset.matchId ? await relatedNewsForMatch(asset.matchId, locale, 4) : [];
  const upcoming = (await upcomingLicensedWindows(6)).filter((item) => item.id !== asset.id);
  const entitled = isEntitled(session?.user?.subscriptionStatus, asset.entitlementTier);
  const siblingChannels = asset.matchId
    ? (await licensedAssetsForMatch(asset.matchId)).filter((item) => item.id !== asset.id)
    : [];
  const geoBlocked = !isGeoAllowed(country, asset.geoAllow);

  return (
    <WatchBooth
      locale={locale}
      entitled={entitled}
      geoBlocked={geoBlocked}
      asset={asset}
      siblingChannels={siblingChannels}
      upcoming={upcoming}
      related={related}
    />
  );
}
