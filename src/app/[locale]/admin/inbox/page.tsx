import { Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { pick } from '@/i18n/pick';
import { kindLabel, type DeskChannelId } from '@/lib/desk/kinds';
import { siteInboxEmail } from '@/lib/seo/site';
import { setDeskStatus } from './actions';

type DeskStatus = 'NEW' | 'READ' | 'ARCHIVED';

function asFilter(value: string | undefined): DeskStatus | 'ALL' {
  if (value === 'READ' || value === 'ARCHIVED' || value === 'NEW') return value;
  if (value === 'ALL') return 'ALL';
  return 'NEW';
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session || !['SUPER_ADMIN', 'MODERATOR', 'EDITOR'].includes(session.user?.role as string)) {
    redirect('/');
  }

  const params = await searchParams;
  const filter = asFilter(params.status);
  const messages = await prisma.deskMessage.findMany({
    where: filter === 'ALL' ? undefined : { status: filter },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  const unread = await prisma.deskMessage.count({ where: { status: 'NEW' } });
  const tabs: { id: string; label: string }[] = [
    { id: 'NEW', label: pick(locale, 'وارد', 'Inbox') },
    { id: 'READ', label: pick(locale, 'مقروء', 'Read') },
    { id: 'ARCHIVED', label: pick(locale, 'أرشيف', 'Archive') },
    { id: 'ALL', label: pick(locale, 'الكل', 'All') },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-4 text-3xl font-black text-foreground dark:text-foreground">
            <Inbox className="h-8 w-8 text-orange-500" />
            {pick(locale, 'صندوق المكتب', 'Desk inbox')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            {pick(
              locale,
              `كل بلاغ ورسالة من الموقع تصل هنا. نسخة البريد تُرسل إلى ${siteInboxEmail()} عندما تكون خدمة البريد مفعّلة.`,
              `Every report and site message lands here. A copy is sent to ${siteInboxEmail()} when mail is configured.`
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-6 py-2 text-xs font-black text-orange-600 dark:border-orange-900/30 dark:bg-orange-950/20">
          {pick(locale, 'غير مقروء:', 'Unread:')} {unread}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`?status=${tab.id}`}
            className={`rounded-full px-4 py-2 text-xs font-black ${
              filter === tab.id
                ? 'bg-orange-500 text-primary-foreground'
                : 'bg-card text-muted-foreground dark:bg-background'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {messages.map((item) => {
          const channel: DeskChannelId = item.channel === 'CONTACT' ? 'contact' : 'report';
          return (
            <article
              key={item.id}
              className="rounded-[2rem] border border-gray-50 bg-card p-8 shadow-xl dark:border-border dark:bg-background"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                    {item.channel === 'CONTACT'
                      ? pick(locale, 'تواصل', 'Contact')
                      : pick(locale, 'بلاغ', 'Report')}
                    {' · '}
                    {kindLabel(channel, item.kind, locale)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(item.createdAt, 'dd/MM/yyyy HH:mm', { locale: locale === 'ar' ? ar : enUS })}
                    {' · '}
                    {item.replyEmail || item.user?.email || pick(locale, 'بدون بريد للرد', 'No reply address')}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase text-muted-foreground dark:bg-muted">
                  {item.emailSentAt
                    ? pick(locale, 'أُرسل البريد', 'Mail sent')
                    : item.emailSkip === 'not_configured'
                      ? pick(locale, 'البريد غير مفعّل', 'Mail not configured')
                      : pick(locale, 'البريد لم يُرسل', 'Mail not sent')}
                </span>
              </div>
              {item.pageUrl ? (
                <p className="mt-4 break-all text-xs font-bold text-muted-foreground">{item.pageUrl}</p>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground dark:text-foreground">
                {item.details}
              </p>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground">{item.id}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {item.status !== 'READ' ? (
                  <form action={setDeskStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="READ" />
                    <button className="rounded-xl bg-muted px-4 py-2 text-xs font-black text-foreground dark:bg-muted">
                      {pick(locale, 'مقروء', 'Mark read')}
                    </button>
                  </form>
                ) : null}
                {item.status !== 'ARCHIVED' ? (
                  <form action={setDeskStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <button className="rounded-xl bg-orange-50 px-4 py-2 text-xs font-black text-orange-600">
                      {pick(locale, 'أرشفة', 'Archive')}
                    </button>
                  </form>
                ) : (
                  <form action={setDeskStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="NEW" />
                    <button className="rounded-xl bg-green-50 px-4 py-2 text-xs font-black text-green-700">
                      {pick(locale, 'إعادة للوارد', 'Back to inbox')}
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}

        {messages.length === 0 ? (
          <div className="rounded-[3rem] bg-card py-24 text-center text-muted-foreground dark:bg-background">
            <Inbox className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p>{pick(locale, 'لا رسائل في هذا الصندوق حالياً.', 'No messages in this tray.')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
