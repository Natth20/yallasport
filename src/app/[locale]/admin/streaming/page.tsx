import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { createStreamAsset } from './actions';

export default async function AdminStreamingPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'SUPER_ADMIN') redirect('/');
  const t = await getTranslations('streaming_admin');
  const [assets, licenses, matches] = await Promise.all([
    prisma.streamAsset.findMany({
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
  }),
    prisma.license.findMany({ orderBy: { updatedAt: 'desc' }, take: 40, select: { id: true, provider: true, scope: true } }),
    prisma.match.findMany({
      orderBy: { kickoffAt: 'desc' },
      take: 40,
      select: {
        id: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('never_store_secrets')}</p>
      </div>

      <form action={createStreamAsset} className="grid gap-3 rounded-2xl border border-border p-5 sm:grid-cols-2">
        <input name="externalAssetId" required placeholder={t('asset')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <select name="protocol" className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold">
          <option value="HLS">HLS</option>
          <option value="DASH">DASH</option>
        </select>
        <select name="licenseId" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">{t('license')}</option>
          {licenses.map((row) => (
            <option key={row.id} value={row.id}>{row.provider || row.scope} · {row.scope}</option>
          ))}
        </select>
        <select name="matchId" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">Match</option>
          {matches.map((row) => (
            <option key={row.id} value={row.id}>{row.homeTeam.name} vs {row.awayTeam.name}</option>
          ))}
        </select>
        <input name="apiCredentialsRef" placeholder={t('credentials')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <button type="submit" className="rounded-xl bg-foreground px-4 py-2 text-xs font-black text-white sm:col-span-2">
          {t('create')}
        </button>
      </form>
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
