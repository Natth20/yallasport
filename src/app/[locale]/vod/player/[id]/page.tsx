import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { canAccessPremiumContent } from '@/lib/auth/premium';
import { MatchStreamPlayer } from '@/components/streaming/MatchStreamPlayer';
import { BrandMark } from '@/components/brand/BrandMark';
import { DeskRule, PhotoCorners } from '@/components/news/NewsOrnaments';

export default async function VODPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const session = await auth();

  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      show: true,
      streamAssets: {
        where: {
          status: { in: ['READY', 'LIVE'] },
          license: { status: 'ACTIVE' },
        },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!episode || episode.show.status !== 'PUBLISHED') notFound();

  const requiresPremium = !episode.isFree || episode.show.isPremium;
  const canAccess = canAccessPremiumContent({
    requiresPremium,
    subscriptionStatus: session?.user?.subscriptionStatus,
    role: session?.user?.role,
  });

  const siblings = await prisma.episode.findMany({
    where: {
      showId: episode.showId,
      NOT: { id: episode.id },
      streamAssets: {
        some: {
          status: { in: ['READY', 'LIVE'] },
          license: { status: 'ACTIVE' },
        },
      },
    },
    orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }],
    take: 8,
  });

  const licensedAsset = STREAMING_ENABLED ? episode.streamAssets[0] ?? null : null;
  const title =
    episode.title ||
    pick(locale, `الحلقة ${episode.episodeNumber}`, `Episode ${episode.episodeNumber}`);

  return (
    <div className="watch-booth vod-title relative min-h-screen pb-16">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <BrandMark size={32} />
          <Link href={`/vod/${episode.show.slug}`} className="watch-chip-link is-ghost">
            {episode.show.title}
          </Link>
          <Link href="/watch" className="watch-chip-link is-ghost">
            {pick(locale, 'المكتبة', 'Library')}
          </Link>
        </div>

        <div className="watch-gate watch-gate-lux">
          <div className="watch-gate-screen relative">
            <PhotoCorners className="watch-stage-corners" />
            {!canAccess ? (
              <div className="relative flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                <h1 className="text-2xl font-black text-white">
                  {pick(locale, 'محتوى للمشتركين', 'Subscribers only')}
                </h1>
                <Link href="/subscribe" className="watch-featured-cta">
                  {pick(locale, 'خطط الاشتراك', 'Subscription plans')}
                </Link>
              </div>
            ) : licensedAsset ? (
              <MatchStreamPlayer assetId={licensedAsset.id} />
            ) : (
              <div className="relative flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-lg font-black text-white">
                  {pick(locale, 'غير متاح الآن', 'Unavailable right now')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="vod-plate">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b48a]">
              {episode.show.title}
            </p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h1>
            <DeskRule className="mt-4 max-w-xs opacity-45" />
            {episode.description || episode.show.description ? (
              <p className="mt-4 text-sm leading-7 text-white/55">
                {episode.description || episode.show.description}
              </p>
            ) : null}
          </section>

          {siblings.length > 0 ? (
            <aside className="vod-plate">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b48a]">
                {pick(locale, 'المزيد', 'More')}
              </p>
              <ul className="mt-4 space-y-2">
                {siblings.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/vod/player/${item.id}`}
                      className="block rounded-xl border border-white/8 bg-card/[0.03] px-3 py-2.5 text-sm font-bold text-white/80 hover:border-[#e8b48a]/35 hover:text-white"
                    >
                      {item.title ||
                        pick(locale, `الحلقة ${item.episodeNumber}`, `Episode ${item.episodeNumber}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
