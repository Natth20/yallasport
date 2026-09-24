import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Live Sports Channels & Streams ---');

  // 1. Create or upsert active Sports License
  const license = await prisma.license.upsert({
    where: { id: 'lic-sports-global-2026' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'lic-sports-global-2026',
      type: 'STREAMING',
      provider: 'YallaSport Global Live Feed',
      scope: 'World Sports & League Highlights',
      territory: ['ALL'],
      startDate: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
  });

  // 2. Channels to upsert
  const channelsData = [
    {
      id: 'ch-bein-news-live',
      name: 'beIN Sports الإخبارية HD',
      country: 'قطر',
      kind: 'SPORTS',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80',
      assetId: 'asset-bein-live-1',
    },
    {
      id: 'ch-ssc-sports-live',
      name: 'SSC Sports 1 HD • دوري روشن',
      country: 'السعودية',
      kind: 'SPORTS',
      logoUrl: 'https://media.api-sports.io/football/leagues/307.png',
      assetId: 'asset-ssc-live-1',
    },
    {
      id: 'ch-redbull-extreme-live',
      name: 'Red Bull Sports 24/7 Live',
      country: 'عالمي',
      kind: 'SPORTS',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80',
      assetId: 'asset-redbull-live-1',
    },
  ];

  for (const ch of channelsData) {
    // Upsert Channel
    const channel = await prisma.channel.upsert({
      where: { id: ch.id },
      update: { name: ch.name, country: ch.country, kind: ch.kind, logoUrl: ch.logoUrl },
      create: {
        id: ch.id,
        name: ch.name,
        country: ch.country,
        kind: ch.kind,
        logoUrl: ch.logoUrl,
      },
    });

    // Find any first match to link optionally
    const match = await prisma.match.findFirst({
      orderBy: { kickoffAt: 'desc' },
      select: { id: true },
    });

    // Upsert StreamAsset
    await prisma.streamAsset.upsert({
      where: {
        providerKey_externalAssetId: {
          providerKey: 'yallasport-live-cdn',
          externalAssetId: ch.assetId,
        },
      },
      update: {
        status: 'LIVE',
        protocol: 'HLS',
        channelId: channel.id,
        matchId: match?.id || null,
        licenseId: license.id,
      },
      create: {
        providerKey: 'yallasport-live-cdn',
        externalAssetId: ch.assetId,
        protocol: 'HLS',
        drmType: 'NONE',
        status: 'LIVE',
        channelId: channel.id,
        matchId: match?.id || null,
        licenseId: license.id,
        geoAllow: [],
        entitlementTier: 'FREE',
      },
    });

    // Link Match to Channel via MatchChannel if match exists
    if (match) {
      await prisma.matchChannel.upsert({
        where: {
          matchId_channelId: {
            matchId: match.id,
            channelId: channel.id,
          },
        },
        update: {},
        create: {
          matchId: match.id,
          channelId: channel.id,
        },
      }).catch(() => null);
    }
  }

  console.log('✓ Successfully seeded live sports streams and channels!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
