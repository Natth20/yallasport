import { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { SalonStage } from '@/components/salon/SalonStage';
import { Skeleton } from '@/components/ui/Skeleton';
import { SettingsDesk, type SettingsTab } from './SettingsDesk';
import styles from './settings.module.css';

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

function SettingsFallback() {
  return (
    <div className={styles.stack}>
      <Skeleton variant="text" width="12rem" height="2rem" />
      <Skeleton variant="card" height="8rem" />
    </div>
  );
}

export function SettingsSalon({ initialTab }: { initialTab: SettingsTab }) {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsSalonBody initialTab={initialTab} />
    </Suspense>
  );
}

async function SettingsSalonBody({ initialTab }: { initialTab: SettingsTab }) {
  const locale = await getLocale();
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, role: true, points: true, notificationPrefs: true },
      })
    : null;
  const stored = readStoredPrefs(user?.notificationPrefs);

  return (
    <SalonStage
      tone="vault"
      wide
      kicker={pick(locale, 'الحساب', 'Account')}
      title={pick(locale, 'الإعدادات', 'Settings')}
      lead={pick(
        locale,
        'الحساب والتنبيهات من سجلك. المظهر واللغة هما نفس المفتاحين في الترويسة.',
        'Account and alerts come from your record. Theme and language are the same switches as the header.',
      )}
    >
      <SettingsDesk
        locale={locale}
        initialTab={initialTab}
        account={
          user
            ? { name: user.name, email: user.email, role: user.role, points: user.points }
            : null
        }
        prefs={user ? stored.prefs : null}
        configured={stored.configured}
      />
    </SalonStage>
  );
}
