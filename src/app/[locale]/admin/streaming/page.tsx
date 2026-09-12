import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';

export default async function AdminStreamingPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'SUPER_ADMIN') redirect('/');
  const t = await getTranslations('streaming_admin');
  const assets = await prisma.streamAsset.findMany({
    include: {
      license: true,
      channel: true,
      match: {
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('never_store_secrets')}</p>
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <article key={asset.id} className="rounded-2xl border border-border p-4 dark:border-border">
              <p className="text-xs font-black uppercase text-orange-500">{asset.status} · {asset.protocol}</p>
              <h3 className="mt-1 font-bold">
                {asset.match
                  ? `${asset.match.homeTeam.name} vs ${asset.match.awayTeam.name}`
                  : asset.channel?.name || asset.externalAssetId}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('provider')}: {asset.providerKey} · {t('asset')}: {asset.externalAssetId}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('license')}: {asset.license?.provider || '—'} · {t('credentials')}: {asset.apiCredentialsRef || asset.license?.apiCredentialsRef || '—'}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
