import {Link} from '@/i18n/navigation';
import { Bell } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { NotificationSettings } from '../../profile/NotificationSettings';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

const defaults = {
  goal: true,
  matchStart: true,
  matchEnd: true,
  breakingNews: true,
};

export default async function NotificationSettingsPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <Bell className="mx-auto h-8 w-8 text-orange-500" />
        <h1 className="mt-5 text-2xl font-bold">{pick(locale, 'سجّل الدخول لإدارة التنبيهات', 'Sign in to manage alerts')}</h1>
        <Link href="/login?callbackUrl=/settings/notifications" className="mt-6 inline-flex rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 dark:bg-card dark:text-foreground">
          {pick(locale, 'تسجيل الدخول', 'Sign in')}
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });
  const preferences = { ...defaults, ...(user?.notificationPrefs as Partial<typeof defaults> ?? {}) };

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{pick(locale, 'مركز التنبيهات', 'Notification Center')}</span>
      <h1 className="mt-3 text-3xl font-bold">{pick(locale, 'إعدادات التنبيهات', 'Notification settings')}</h1>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{pick(locale, 'اختر التنبيهات التي تريد استقبالها. تذكير بداية المباراة يُرسل قبل 15 دقيقة.', 'Choose which alerts to receive. Match-start reminders are sent 15 minutes before kickoff.')}</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-4 dark:border-border dark:bg-card/[0.04]">
        <NotificationSettings initialPrefs={preferences} />
      </div>
    </div>
  );
}
