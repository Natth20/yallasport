'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/admin/audit';
import { isEntityId } from '@/lib/security/http';
import type { LicenseStatus, LicenseType } from '@/generated/prisma';

function asType(value: string): LicenseType | null {
  if (value === 'STREAMING' || value === 'DATA' || value === 'CONTENT') return value;
  return null;
}

export async function createLicense(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
  const type = asType(String(formData.get('type') || ''));
  const provider = String(formData.get('provider') || '').trim().slice(0, 120);
  const scope = String(formData.get('scope') || '').trim().slice(0, 180);
  const contractReference = String(formData.get('contractReference') || '').trim().slice(0, 120) || null;
  const apiCredentialsRef = String(formData.get('apiCredentialsRef') || '').trim().slice(0, 80) || null;
  const startRaw = String(formData.get('startDate') || '');
  const endRaw = String(formData.get('endDate') || '');
  if (!type || !scope || !startRaw) return;
  const startDate = new Date(startRaw);
  if (Number.isNaN(+startDate)) return;
  const endDate = endRaw ? new Date(endRaw) : null;
  if (endDate && Number.isNaN(+endDate)) return;

  const created = await prisma.license.create({
    data: {
      type,
      provider: provider || null,
      scope,
      territory: [],
      startDate,
      endDate,
      status: 'PENDING',
      contractReference,
      apiCredentialsRef,
    },
    select: { id: true },
  });
  await writeAudit(session.user.id, 'LICENSE_CREATE', 'License', created.id);
  revalidatePath('/admin/licenses');
  revalidatePath('/ar/admin/licenses');
  revalidatePath('/en/admin/licenses');
}

export async function setLicenseStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '') as LicenseStatus;
  if (!isEntityId(id) || !['PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED'].includes(status)) return;
  await prisma.license.update({ where: { id }, data: { status } });
  await writeAudit(session.user.id, `LICENSE_${status}`, 'License', id);
  revalidatePath('/admin/licenses');
  revalidatePath('/ar/admin/licenses');
  revalidatePath('/en/admin/licenses');
}
