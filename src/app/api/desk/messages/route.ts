import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { writeRatelimit } from '@/lib/redis';
import { clientIp, isDeskPageRef, isReplyEmail } from '@/lib/security/http';
import { sendSiteMail } from '@/lib/mail/site-mail';
import { siteInboxEmail } from '@/lib/seo/site';
import { isKnownKind, kindLabel, type DeskChannelId } from '@/lib/desk/kinds';

function asChannel(value: unknown): DeskChannelId | null {
  if (value === 'report' || value === 'contact') return value;
  return null;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { success } = await writeRatelimit.limit(`desk_${ip}`);
  if (!success) {
    return NextResponse.json({ ok: false, error: 'too_many' }, { status: 429 });
  }

  const body = await req.json().catch(swallow("src/app/api/desk/messages/route.ts:22", null, { persist: false }));
  if (typeof body?.company === 'string' && body.company.trim()) {
    return NextResponse.json({ ok: true, stored: true, emailed: false });
  }

  const channel = asChannel(body?.channel);
  const kind = body?.kind;
  const details = typeof body?.details === 'string' ? body.details.trim() : '';
  const pageUrl = typeof body?.pageUrl === 'string' ? body.pageUrl.trim() : '';
  const locale = body?.locale === 'en' ? 'en' : 'ar';
  const replyEmail = typeof body?.replyEmail === 'string' ? body.replyEmail.trim() : '';

  if (!channel || !isKnownKind(channel, kind)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  if (details.length < 12 || details.length > 4000) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  if (pageUrl && !isDeskPageRef(pageUrl)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  if (replyEmail && !isReplyEmail(replyEmail)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const session = await auth();
  let userId: string | undefined;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  const prismaChannel = channel === 'contact' ? 'CONTACT' : 'REPORT';
  const message = await prisma.deskMessage.create({
    data: {
      channel: prismaChannel,
      kind,
      details,
      pageUrl: pageUrl || null,
      replyEmail: replyEmail || session?.user?.email || null,
      locale,
      userId,
    },
    select: { id: true },
  });

  const label = kindLabel(channel, kind, locale);
  const mail = await sendSiteMail({
    subject:
      locale === 'ar'
        ? `يلا سبورت · ${channel === 'contact' ? 'رسالة' : 'بلاغ'}: ${label}`
        : `Yalla Sport · ${channel === 'contact' ? 'message' : 'report'}: ${label}`,
    replyTo: replyEmail || session?.user?.email || undefined,
    text: [
      `To: ${siteInboxEmail()}`,
      `Desk id: ${message.id}`,
      `Channel: ${channel}`,
      `Kind: ${label}`,
      `URL: ${pageUrl || '—'}`,
      `Reply: ${replyEmail || session?.user?.email || '—'}`,
      '',
      details,
    ].join('\n'),
  });

  await prisma.deskMessage.update({
    where: { id: message.id },
    data: mail.sent
      ? { emailSentAt: new Date(), emailSkip: null }
      : { emailSkip: mail.reason },
  });

  return NextResponse.json({
    ok: true,
    stored: true,
    emailed: mail.sent,
    mail: mail.sent ? 'sent' : mail.reason,
    deskId: message.id,
  });
}
