import { swallow, reportCaughtError } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { writeRatelimit } from '@/lib/redis';
import { clientIp, isEntityId } from '@/lib/security/http';

const ALLOWED = new Set(['🔥', '⚽', '👏', '⚡', '💔']);

export async function GET(req: Request) {
  const matchId = new URL(req.url).searchParams.get('matchId') || '';
  if (!isEntityId(matchId)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  try {
    const rows = await prisma.$queryRaw<Array<{ emoji: string; count: number }>>`
      SELECT emoji, count FROM "MatchReaction" WHERE "matchId" = ${matchId}
    `;
    return NextResponse.json({
      ok: true,
      counts: Object.fromEntries(rows.map((row) => [row.emoji, Number(row.count)])),
    });
  } catch (error) {
    reportCaughtError("src/app/api/sports/reactions/route.ts:23", error);
    return NextResponse.json({ ok: true, counts: {} });
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { success } = await writeRatelimit.limit(`react_${ip}`);
  if (!success) {
    return NextResponse.json({ ok: false, error: 'too_many' }, { status: 429 });
  }

  const body = await req.json().catch(swallow("src/app/api/sports/reactions/route.ts:34", null, { persist: false }));
  const matchId = typeof body?.matchId === 'string' ? body.matchId : '';
  const emoji = typeof body?.emoji === 'string' ? body.emoji : '';
  if (!isEntityId(matchId) || !ALLOWED.has(emoji)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } }).catch(swallow("src/app/api/sports/reactions/route.ts:41", null));
  if (!match) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO "MatchReaction" (id, "matchId", emoji, count, "updatedAt")
      VALUES (${randomUUID()}, ${matchId}, ${emoji}, 1, NOW())
      ON CONFLICT ("matchId", emoji)
      DO UPDATE SET count = "MatchReaction".count + 1, "updatedAt" = NOW()
    `;
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count FROM "MatchReaction" WHERE "matchId" = ${matchId} AND emoji = ${emoji}
    `;
    return NextResponse.json({ ok: true, emoji, count: Number(rows[0]?.count ?? 1) });
  } catch (error) {
    reportCaughtError("src/app/api/sports/reactions/route.ts:58", error);
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 });
  }
}
