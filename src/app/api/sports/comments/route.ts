import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { CHAT_MAX_LENGTH, CHAT_MIN_LENGTH, filterContent } from '@/lib/utils/word-filter';
import { ratelimit, redis, writeRatelimit } from '@/lib/redis';
import { clientIp, isEntityId } from '@/lib/security/http';
import { visibleCommentsWhere } from '@/lib/comments/visibility';

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  user: { select: { name: true, role: true } },
} as const;

function serializeComment(comment: {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string | null; role: string };
}) {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name || 'User',
      role: comment.user.role,
    },
  };
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  const { success } = await ratelimit.limit(`comment_read_${ip}`);
  if (!success) {
    return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = isEntityId(searchParams.get('matchId')) ? searchParams.get('matchId')! : undefined;
  const newsId = isEntityId(searchParams.get('newsId')) ? searchParams.get('newsId')! : undefined;
  const after = searchParams.get('after');
  const afterTime = after && !Number.isNaN(Date.parse(after)) ? new Date(after) : null;

  if ((!matchId && !newsId) || (matchId && newsId)) {
    return NextResponse.json({ success: false, error: 'invalid_target' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: await visibleCommentsWhere({
        matchId: matchId || undefined,
        newsId: newsId || undefined,
        ...(afterTime ? { createdAt: { gt: afterTime } } : {}),
      }),
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
      take: afterTime ? 40 : 50,
    });

    return NextResponse.json({
      success: true,
      comments: comments.map(serializeComment),
    });
  } catch (error) {
    console.error('[COMMENT_GET_ERROR]:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const ip = clientIp(req);
  const { success } = await writeRatelimit.limit(`comment_${session.user.id}_${ip}`);
  if (!success) {
    return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 });
  }

  const body = await req.json().catch(swallow("src/app/api/sports/comments/route.ts:84", null, { persist: false }));
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const matchId = isEntityId(body?.matchId) ? body.matchId : undefined;
  const newsId = isEntityId(body?.newsId) ? body.newsId : undefined;

  if (!content || content.length < CHAT_MIN_LENGTH || content.length > CHAT_MAX_LENGTH) {
    return NextResponse.json({ success: false, error: 'invalid_length' }, { status: 400 });
  }
  if ((!matchId && !newsId) || (matchId && newsId)) {
    return NextResponse.json({ success: false, error: 'invalid_target' }, { status: 400 });
  }

  const filtered = filterContent(content);
  if (filtered.isFlagged) {
    return NextResponse.json(
      { success: false, error: filtered.reason === 'link' ? 'no_links' : filtered.reason === 'spam' ? 'spam' : 'flagged' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const duplicateKey = `comment_dup_${user.id}_${matchId || newsId}`;
    const lastText = await redis.get<string>(duplicateKey).catch(swallow("src/app/api/sports/comments/route.ts:111", null));
    if (lastText && lastText === filtered.cleanText) {
      return NextResponse.json({ success: false, error: 'duplicate' }, { status: 400 });
    }

    if (matchId) {
      const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } });
      if (!match) return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
    }
    if (newsId) {
      const news = await prisma.news.findUnique({ where: { id: newsId }, select: { id: true } });
      if (!news) return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: filtered.cleanText,
        userId: user.id,
        matchId,
        newsId,
      },
      select: commentSelect,
    });

    await redis.set(duplicateKey, filtered.cleanText, { ex: 90 }).catch(swallow("src/app/api/sports/comments/route.ts:135", undefined));

    return NextResponse.json({ success: true, comment: serializeComment(comment) });
  } catch (error) {
    console.error('[COMMENT_ERROR]:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
