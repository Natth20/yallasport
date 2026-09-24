import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !['SUPER_ADMIN', 'MODERATOR'].includes(session.user?.role as string)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const commentId = String(formData.get('commentId') || '');
    if (!/^[a-z0-9_-]{8,64}$/i.test(commentId)) {
      return NextResponse.json({ success: false, error: 'Invalid comment' }, { status: 400 });
    }

    await prisma.$executeRaw`UPDATE "Comment" SET "parentId" = NULL WHERE "parentId" = ${commentId}`;
    await prisma.$executeRaw`DELETE FROM "Comment" WHERE id = ${commentId}`;
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMMENT_DELETE',
        entityType: 'Comment',
        entityId: commentId,
      },
    }).catch(swallow("src/app/api/admin/comments/delete/route.ts:27", undefined));

    return NextResponse.redirect(new URL('/admin/comments', req.url));
  } catch (error) {
    console.error('[COMMENT_DELETE_ERROR]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
