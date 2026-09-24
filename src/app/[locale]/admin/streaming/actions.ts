'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/admin/audit';
import { isEntityId } from '@/lib/security/http';

export async function createStreamAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');

  const externalAssetId = String(formData.get('externalAssetId') || '').trim().slice(0, 180);
  const protocol = formData.get('protocol') === 'DASH' ? 'DASH' : 'HLS';
  const licenseIdRaw = String(formData.get('licenseId') || '').trim();
  const matchIdRaw = String(formData.get('matchId') || '').trim();
  const credentialsRef = String(formData.get('apiCredentialsRef') || '').trim().slice(0, 80) || null;
  if (!externalAssetId) return;

  const licenseId = isEntityId(licenseIdRaw) ? licenseIdRaw : null;
  const matchId = isEntityId(matchIdRaw) ? matchIdRaw : null;

  const created = await prisma.streamAsset.create({
    data: {
      providerKey: 'licensed',
      externalAssetId,
      protocol,
      drmType: 'NONE',
      status: 'DRAFT',
      licenseId,
      matchId,
      apiCredentialsRef: credentialsRef,
      geoAllow: [],
      entitlementTier: 'FREE',
    },
    select: { id: true },
  });
  await writeAudit(session.user.id, 'STREAM_ASSET_CREATE', 'StreamAsset', created.id);
  revalidatePath('/admin/streaming');
  revalidatePath('/ar/admin/streaming');
  revalidatePath('/en/admin/streaming');
}
