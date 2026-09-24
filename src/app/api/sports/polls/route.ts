import { reportCaughtError } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, writeRatelimit } from '@/lib/redis';
import { clientIp, isEntityId } from '@/lib/security/http';
import { isPollKey, parsePollOptions } from '@/lib/polls/match-poll';

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { success } = await writeRatelimit.limit(`poll_${ip}`);
  if (!success) {
    return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    reportCaughtError("src/app/api/sports/polls/route.ts:17", error);
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 });
  }

  const pollId = isEntityId((body as { pollId?: unknown })?.pollId)
    ? String((body as { pollId: string }).pollId)
    : '';
  const option = (body as { option?: unknown })?.option;
  if (!pollId || !isPollKey(option)) {
    return NextResponse.json({ success: false, error: 'invalid_vote' }, { status: 400 });
  }

  const voteKey = `poll:vote:${pollId}:${ip}`;
  const reserved = await redis.set(voteKey, option, { nx: true, ex: 60 * 60 * 24 * 7 });
  if (!reserved) {
    return NextResponse.json({ success: false, error: 'already_voted' }, { status: 409 });
  }

  try {
    const poll = await prisma.matchPoll.findUnique({ where: { id: pollId } });
    if (!poll) {
      await redis.del(voteKey);
      return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
    }

    const counts = parsePollOptions(poll.options);
    counts[option] += 1;
    await prisma.matchPoll.update({
      where: { id: poll.id },
      data: { options: counts },
    });

    return NextResponse.json({ success: true, options: counts });
  } catch (error) {
    console.error('[POLL_VOTE]', error);
    await redis.del(voteKey);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
