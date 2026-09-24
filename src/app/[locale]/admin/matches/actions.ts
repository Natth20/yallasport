'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { writeAudit } from '@/lib/admin/audit';
import { runSportsSync } from '@/lib/sports-data/run-sync';

const syncRoles = new Set(['SUPER_ADMIN', 'CONTENT_MANAGER']);

export async function triggerSportsSync(): Promise<{ ok: boolean; synced?: number; live?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role || !syncRoles.has(session.user.role)) {
    return { ok: false, error: 'unauthorized' };
  }
  try {
    const result = await runSportsSync();
    await writeAudit(session.user.id, 'SPORTS_SYNC', 'Match', 'batch');
    revalidatePath('/admin/matches');
    revalidatePath('/ar/admin/matches');
    revalidatePath('/en/admin/matches');
    revalidatePath('/matches');
    return { ok: true, synced: result.synced, live: result.live };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'sync_failed';
    return { ok: false, error: message };
  }
}
