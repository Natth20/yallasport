import { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { Link } from '@/i18n/navigation';
import { Bell } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { NotificationSettings } from '../../profile/NotificationSettings';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { HouseStage } from '@/components/house/HouseStage';
import { HousePlate } from '@/components/house/HouseMark';

const emptyPrefs = {
  goal: false,
  matchStart: false,
  matchEnd: false,
  breakingNews: false,
};

function readStoredPrefs(raw: unknown): { prefs: typeof emptyPrefs; configured: boolean } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { prefs: emptyPrefs, configured: false };
  }
  const row = raw as Record<string, unknown>;
  const keys = ['goal', 'matchStart', 'matchEnd', 'breakingNews'] as const;
  const configured = keys.some((key) => key in row);
  if (!configured) return { prefs: emptyPrefs, configured: false };
  return {
    configured: true,
    prefs: {
      goal: row.goal === true,
      matchStart: row.matchStart === true,
      matchEnd: row.matchEnd === true,
      breakingNews: row.breakingNews === true,
    },
  };
}

export default function NotificationSettingsPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <NotificationSettingsPageBody />
    </Suspense>
  );
}

async function NotificationSettingsPageBody() {
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
  const stored = readStoredPrefs(user?.notificationPrefs);

  return (
    <HouseStage
      kicker={pick(locale, 'مركز التنبيهات', 'Notification Center')}
      title={pick(locale, 'إعدادات التنبيهات', 'Notification settings')}
      lead={pick(
        locale,
        'اختر التنبيهات التي تريد استقبالها. تذكير بداية المباراة يُرسل عندما تبقى على الركلة بين 10 و16 دقيقة، وهي نافذة الكرون الفعلية.',
        'Choose which alerts to receive. A match-start reminder is sent when kickoff is 10 to 16 minutes away — the cron window that actually runs.',
      )}
    >
      <HousePlate className="mt-8 p-4">
        <NotificationSettings initialPrefs={stored.prefs} configured={stored.configured} />
      </HousePlate>
    </HouseStage>
  );
}
