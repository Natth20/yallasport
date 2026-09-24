'use server';
import { swallow } from '@/lib/ops/caught';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

const MOD_ROLES = new Set(['SUPER_ADMIN', 'MODERATOR']);

async function requireModerator() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role as string | undefined;
  if (!userId || !role || !MOD_ROLES.has(role)) {
    throw new Error('Unauthorized');
  }
  return userId;
}

async function audit(userId: string, action: string, entityId: string) {
  await prisma.auditLog.create({
    data: { userId, action, entityType: 'Comment', entityId },
  }).catch(swallow("src/app/[locale]/admin/comments/actions.ts:22", undefined));
}

function revalidateCommentSurfaces() {
  revalidatePath('/admin/comments');
  revalidatePath('/ar/admin/comments');
  revalidatePath('/en/admin/comments');
}

export async function hideComment(formData: FormData) {
  const userId = await requireModerator();
  const commentId = String(formData.get('commentId') || '');
  if (!/^[a-z0-9_-]{8,64}$/i.test(commentId)) return;
  await prisma.$executeRaw`UPDATE "Comment" SET "hiddenAt" = NOW() WHERE id = ${commentId}`;
  await audit(userId, 'COMMENT_HIDE', commentId);
  revalidateCommentSurfaces();
}

export async function unhideComment(formData: FormData) {
  const userId = await requireModerator();
  const commentId = String(formData.get('commentId') || '');
  if (!/^[a-z0-9_-]{8,64}$/i.test(commentId)) return;
  await prisma.$executeRaw`UPDATE "Comment" SET "hiddenAt" = NULL WHERE id = ${commentId}`;
  await audit(userId, 'COMMENT_UNHIDE', commentId);
  revalidateCommentSurfaces();
}

export async function deleteComment(formData: FormData) {
  const userId = await requireModerator();
  const commentId = String(formData.get('commentId') || '');
  if (!/^[a-z0-9_-]{8,64}$/i.test(commentId)) return;
  await prisma.$executeRaw`UPDATE "Comment" SET "parentId" = NULL WHERE "parentId" = ${commentId}`;
  await prisma.$executeRaw`DELETE FROM "Comment" WHERE id = ${commentId}`;
  await audit(userId, 'COMMENT_DELETE', commentId);
  revalidateCommentSurfaces();
}
