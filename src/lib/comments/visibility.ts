import { swallow } from '@/lib/ops/caught';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';

export async function hiddenCommentIdSet() {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Comment" WHERE "hiddenAt" IS NOT NULL
  `.catch(swallow("src/lib/comments/visibility.ts:7", [] as Array<{ id: string }>));
  return new Set(rows.map((row) => row.id));
}

export async function visibleCommentsWhere(
  extra: Prisma.CommentWhereInput,
): Promise<Prisma.CommentWhereInput> {
  const hidden = [...(await hiddenCommentIdSet())];
  if (hidden.length === 0) return extra;
  return { AND: [extra, { id: { notIn: hidden } }] };
}
