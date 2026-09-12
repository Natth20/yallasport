import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { STREAMING_ENABLED, getStreamingProvider } from '@/lib/streaming';
import { countryFromHeaders, isEntitled, isGeoAllowed, isWithinWindow } from '@/lib/streaming/entitlement';
import { createPlaybackToken } from '@/lib/streaming/playback-token';

export const POST = auth(async function POST(req) {
  if (!STREAMING_ENABLED) {
    return NextResponse.json({ error: 'streaming_disabled' }, { status: 503 });
  }

  const userId = req.auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const assetId = typeof body?.assetId === 'string' ? body.assetId : '';
  if (!assetId) {
    return NextResponse.json({ error: 'invalid_asset' }, { status: 400 });
  }

  const asset = await prisma.streamAsset.findUnique({
    where: { id: assetId },
    include: { license: true, match: { select: { kickoffAt: true } } }
  });

  if (!asset || !asset.license || asset.license.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'license_inactive' }, { status: 403 });
  }
  if (asset.status !== 'READY' && asset.status !== 'LIVE') {
    return NextResponse.json({ error: 'asset_unavailable' }, { status: 404 });
  }

  const country = countryFromHeaders(req.headers);
  if (!isGeoAllowed(country, asset.geoAllow)) {
    return NextResponse.json({ error: 'geo_blocked' }, { status: 451 });
  }
  if (!isEntitled(req.auth?.user?.subscriptionStatus, asset.entitlementTier)) {
    return NextResponse.json({ error: 'entitlement_required' }, { status: 402 });
  }
  if (!isWithinWindow(new Date(), asset.startsAt, asset.endsAt, asset.match?.kickoffAt)) {
    return NextResponse.json({ error: 'outside_window' }, { status: 403 });
  }

  const provider = getStreamingProvider();
  const session = await provider.mintPlayback({
    externalAssetId: asset.externalAssetId,
    credentialsRef: asset.apiCredentialsRef || asset.license.apiCredentialsRef,
    protocol: asset.protocol,
    drmType: asset.drmType,
    userId
  });

  if (!session) {
    return NextResponse.json({ error: 'provider_unconfigured' }, { status: 503 });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STREAM_PLAYBACK_TOKEN',
      entityType: 'StreamAsset',
      entityId: asset.id
    }
  }).catch(() => undefined);

  return NextResponse.json({
    token: createPlaybackToken({ assetId: asset.id, userId, country }),
    protocol: session.protocol,
    drmType: session.drmType,
    manifestUrl: session.manifestUrl,
    licenseUrl: session.licenseUrl ?? null,
    expiresAt: session.expiresAt.toISOString()
  });
});
