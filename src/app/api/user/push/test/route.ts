import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { sendWebPush } from '@/lib/notifications/web-push';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { pushSubscriptions: true },
  });

  if (!user || !user.pushSubscriptions.length) {
    return NextResponse.json(
      { error: 'No active push subscriptions found for this account. Please enable notifications first.' },
      { status: 400 }
    );
  }

  let bodyData: { title?: string; body?: string; url?: string; image?: string } = {};
  try {
    bodyData = await request.json();
  } catch {
    // Default payload
  }

  const payload = {
    title: bodyData.title || 'يلا سبورت | إشعار تجريبي ⚽',
    body:
      bodyData.body ||
      'أرسنال 2 - 1 ليدز يونايتد (انتهت) • تم تفعيل التنبيهات بنجاح على هذا الجهاز!',
    url: bodyData.url || '/ar/matches',
    image: bodyData.image || undefined,
    tag: `test-push-${Date.now()}`,
  };

  let sentCount = 0;
  for (const subscription of user.pushSubscriptions) {
    try {
      await sendWebPush(subscription, payload);
      sentCount++;
    } catch (error) {
      console.warn('[TEST PUSH ERROR]', error);
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      }
    }
  }

  return NextResponse.json({
    success: true,
    sentCount,
    totalDevices: user.pushSubscriptions.length,
  });
}
