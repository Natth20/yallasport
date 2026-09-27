'use client';

import { useState } from 'react';
import { Bell, Languages, Sun, User } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/components/layout/ThemeProvider';
import { NotificationSettings } from '../profile/NotificationSettings';
import styles from './settings.module.css';

export type SettingsTab = 'account' | 'notifications' | 'appearance' | 'language';

const tabs: SettingsTab[] = ['account', 'notifications', 'appearance', 'language'];

export function isSettingsTab(value: string | undefined): value is SettingsTab {
  return tabs.includes(value as SettingsTab);
}

type Prefs = {
  goal: boolean;
  matchStart: boolean;
  matchEnd: boolean;
  breakingNews: boolean;
};

export function SettingsDesk({
  locale,
  initialTab,
  account,
  prefs,
  configured,
}: {
  locale: string;
  initialTab: SettingsTab;
  account: { name: string | null; email: string; role: string; points: number } | null;
  prefs: Prefs | null;
  configured: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const { theme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  const select = (value: string) => {
    if (!isSettingsTab(value)) return;
    setTab(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'account') params.delete('tab');
    else params.set('tab', value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const signInHref = (next: string) => `/login?callbackUrl=${encodeURIComponent(next)}`;

  return (
    <Tabs value={tab} onValueChange={select} variant="pills">
      <TabsList aria-label={pick(locale, 'أقسام الإعدادات', 'Settings sections')}>
        <TabsTrigger value="account" icon={<User aria-hidden="true" />}>
          {pick(locale, 'الحساب', 'Account')}
        </TabsTrigger>
        <TabsTrigger value="notifications" icon={<Bell aria-hidden="true" />}>
          {pick(locale, 'الإشعارات', 'Notifications')}
        </TabsTrigger>
        <TabsTrigger value="appearance" icon={<Sun aria-hidden="true" />}>
          {pick(locale, 'المظهر', 'Appearance')}
        </TabsTrigger>
        <TabsTrigger value="language" icon={<Languages aria-hidden="true" />}>
          {pick(locale, 'اللغة', 'Language')}
        </TabsTrigger>
      </TabsList>

      <div role="tabpanel" hidden={tab !== 'account'}>
        <Card variant="bordered" padding="md">
          {account ? (
            <div className={styles.summary}>
              <strong>{account.name || pick(locale, 'مشجع يلا سبورت', 'Yalla Sport fan')}</strong>
              <p className={styles.meta}>{account.email}</p>
              <p className={styles.meta}>
                {account.role} · {account.points} {pick(locale, 'نقطة', 'pts')}
              </p>
              <Link href="/profile/edit" className={styles.action}>
                {pick(locale, 'تعديل الملف', 'Edit profile')}
              </Link>
            </div>
          ) : (
            <div className={styles.summary}>
              <p className={styles.note}>
                {pick(locale, 'سجّل الدخول لعرض حسابك.', 'Sign in to see your account.')}
              </p>
              <Link href={signInHref('/settings')} className={styles.action}>
                {pick(locale, 'تسجيل الدخول', 'Sign in')}
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div role="tabpanel" hidden={tab !== 'notifications'}>
        {prefs ? (
          <div className={styles.stack}>
            <p className={styles.note}>
              {pick(
                locale,
                'اختر التنبيهات التي تريد استقبالها. تذكير بداية المباراة يُرسل عندما تبقى على الركلة بين 10 و16 دقيقة، وهي نافذة الكرون الفعلية.',
                'Choose which alerts to receive. A match-start reminder is sent when kickoff is 10 to 16 minutes away — the cron window that actually runs.',
              )}
            </p>
            <NotificationSettings initialPrefs={prefs} configured={configured} />
          </div>
        ) : (
          <Card variant="bordered" padding="md">
            <div className={styles.summary}>
              <p className={styles.note}>
                {pick(locale, 'سجّل الدخول لإدارة التنبيهات.', 'Sign in to manage alerts.')}
              </p>
              <Link href={signInHref('/settings?tab=notifications')} className={styles.action}>
                {pick(locale, 'تسجيل الدخول', 'Sign in')}
              </Link>
            </div>
          </Card>
        )}
      </div>

      <div role="tabpanel" hidden={tab !== 'appearance'}>
        <Card variant="bordered" padding="md">
          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <strong>
                {theme === 'light'
                  ? pick(locale, 'الوضع الفاتح', 'Light mode')
                  : pick(locale, 'الوضع الداكن', 'Dark mode')}
              </strong>
              <p className={styles.note}>
                {pick(
                  locale,
                  'نفس مفتاح الترويسة. يُحفظ في هذا المتصفح، لا في حسابك.',
                  'The same header switch. It is stored in this browser, not on your account.',
                )}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </Card>
      </div>

      <div role="tabpanel" hidden={tab !== 'language'}>
        <Card variant="bordered" padding="md">
          <div className={styles.switchRow}>
            <div className={styles.switchCopy}>
              <strong>{currentLocale === 'ar' ? 'العربية' : 'English'}</strong>
              <p className={styles.note}>
                {pick(
                  locale,
                  'نفس مفتاح الترويسة. يبدّل لغة الصفحة الحالية بين العربية والإنجليزية.',
                  'The same header switch. It flips this page between Arabic and English.',
                )}
              </p>
            </div>
            <LanguageToggle />
          </div>
        </Card>
      </div>
    </Tabs>
  );
}
