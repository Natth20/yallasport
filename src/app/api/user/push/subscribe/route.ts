import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { getVapidPublicKey } from '@/lib/notifications/web-push';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: 'Push is not configured' }, { status: 503 });
  }

  return NextResponse.json({ publicKey });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await request.json();
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const authKey = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.user.id, p256dh, auth: authKey },
    create: { userId: session.user.id, endpoint, p256dh, auth: authKey },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
