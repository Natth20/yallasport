'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const name = String(formData.get('name') || '').trim().slice(0, 80);
  if (name.length < 2) return { ok: false as const, error: 'short_name' };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  revalidatePath('/profile');
  revalidatePath('/ar/profile');
  revalidatePath('/en/profile');
  revalidatePath('/profile/edit');
  return { ok: true as const };
}
