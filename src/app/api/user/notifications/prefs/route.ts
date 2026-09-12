import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';

const defaults = {
  goal: true,
  matchStart: true,
  matchEnd: true,
  breakingNews: true,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });
  return NextResponse.json({ preferences: { ...defaults, ...(user?.notificationPrefs as object ?? {}) } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const input = await req.json();
  const prefs = {
    goal: Boolean(input.goal),
    matchStart: Boolean(input.matchStart),
    matchEnd: Boolean(input.matchEnd),
    breakingNews: Boolean(input.breakingNews),
  };

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { notificationPrefs: prefs }
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to save preferences',
    }, { status: 500 });
  }
}
