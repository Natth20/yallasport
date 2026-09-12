import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';

/**
 * API Route: /api/admin/comments/delete
 * Allows moderators/admins to delete comments.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !['SUPER_ADMIN', 'MODERATOR'].includes(session.user?.role as string)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const commentId = String(formData.get('commentId') || '');
    if (!/^[a-z0-9_-]{8,64}$/i.test(commentId)) {
      return NextResponse.json({ success: false, error: 'Invalid comment' }, { status: 400 });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    // Redirect back to comments page (locale middleware rewrites /admin)
    return NextResponse.redirect(new URL('/admin/comments', req.url));
  } catch (error: any) {
    console.error('[COMMENT_DELETE_ERROR]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
