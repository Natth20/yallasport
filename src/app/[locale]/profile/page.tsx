import React, { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Shield, User, Heart, Bell, Pencil } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Link } from '@/i18n/navigation';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { NotificationSettings } from './NotificationSettings';
import { PAYMENTS_ENABLED, subscriptionLabel, isPremiumSubscriber } from '@/lib/auth/premium';
import { isStaffRole } from '@/lib/auth/admin-access';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import styles from './profile.module.css';

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

function storedNotice(payload: unknown): { title: string; body: string } | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const row = payload as Record<string, unknown>;
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  const body = typeof row.body === 'string' ? row.body.trim() : '';
  if (!title && !body) return null;
  return { title, body };
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfilePageBody />
    </Suspense>
  );
}

export function ProfileFallback() {
  return (
    <div className={styles.stack}>
      <Skeleton variant="text" width="12rem" height="2rem" />
      <Skeleton variant="card" height="8rem" />
    </div>
  );
}

async function ProfilePageBody() {
  const locale = await getLocale();
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      favorites: true,
      notifications: { take: 5, orderBy: { sentAt: 'desc' } },
      subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
    }
  });

  if (!user) redirect('/');
  const premium = PAYMENTS_ENABLED && isPremiumSubscriber(user.subscriptionStatus, user.role);
  const stored = readStoredPrefs(user.notificationPrefs);

  const [teams, leagues, matches] = await Promise.all([
    prisma.team.findMany({
      where: { id: { in: user.favorites.filter((favorite) => favorite.entityType === 'TEAM').map((favorite) => favorite.entityId) } },
      select: { id: true, name: true, slug: true },
    }),
    prisma.league.findMany({
      where: { id: { in: user.favorites.filter((favorite) => favorite.entityType === 'LEAGUE').map((favorite) => favorite.entityId) } },
      select: { id: true, name: true, slug: true },
    }),
    prisma.match.findMany({
      where: { id: { in: user.favorites.filter((favorite) => favorite.entityType === 'MATCH').map((favorite) => favorite.entityId) } },
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);
  const favoriteDetails = new Map<string, { name: string; href: string }>();
  const versus = pick(locale, 'ضد', 'vs');
  teams.forEach((team) => favoriteDetails.set(team.id, { name: localizePlainName(locale, team.name), href: `/team/${team.slug}` }));
  leagues.forEach((league) => favoriteDetails.set(league.id, { name: localizePlainName(locale, league.name), href: `/league/${league.slug}` }));
  matches.forEach((match) => favoriteDetails.set(match.id, {
    name: `${localizePlainName(locale, match.homeTeam.name)} ${versus} ${localizePlainName(locale, match.awayTeam.name)}`,
    href: `/match/${match.id}`,
  }));

  const notices = user.notifications.flatMap((notice) => {
    const copy = storedNotice(notice.payload);
    if (!copy) return [];
    return [{ id: notice.id, type: notice.type, sentAt: notice.sentAt, ...copy }];
  });

  const kindLabel = (kind: string) => {
    if (kind === 'TEAM') return pick(locale, 'فريق', 'Team');
    if (kind === 'LEAGUE') return pick(locale, 'بطولة', 'League');
    if (kind === 'MATCH') return pick(locale, 'مباراة', 'Match');
    return kind;
  };

  const typeLabel = (type: string) => {
    if (type === 'GOAL') return pick(locale, 'هدف', 'Goal');
    if (type === 'MATCH_START') return pick(locale, 'بداية مباراة', 'Match start');
    if (type === 'MATCH_END') return pick(locale, 'نهاية مباراة', 'Match end');
    if (type === 'BREAKING_NEWS') return pick(locale, 'خبر عاجل', 'Breaking news');
    return type;
  };

  const displayName = user.name || pick(locale, 'مشجع يلا سبورت', 'Yalla Sport fan');

  return (
    <SalonStage
      tone="pass"
      wide
      compact
      kicker={pick(locale, 'بطاقة العضوية', 'Membership')}
      title={displayName}
      lead={user.role}
      aside={`${user.points} ${pick(locale, 'نقطة', 'pts')}`}
      tools={
        <HallFoyer
          label={pick(locale, 'جناح الحساب', 'Account suite')}
          items={[
            { href: '/profile', label: pick(locale, 'الملف', 'Profile'), icon: User, current: true },
            { href: '/profile/edit', label: pick(locale, 'تعديل', 'Edit'), icon: Pencil },
            { href: '/favorites', label: pick(locale, 'المفضلة', 'Favorites'), icon: Heart },
            { href: '/settings', label: pick(locale, 'الإعدادات', 'Settings'), icon: Bell },
            ...(isStaffRole(user.role)
              ? [{ href: '/admin', label: pick(locale, 'لوحة التحكم', 'Control desk'), icon: Shield }]
              : []),
          ]}
        />
      }
    >
      <div className={styles.stack}>
        <section className={styles.pass}>
          <p>{pick(locale, 'السجل', 'Record')}</p>
          <strong>{displayName}</strong>
          <em>{user.email}</em>
          <span>
            {subscriptionLabel(user.subscriptionStatus, locale)}
            {premium ? ` · ${pick(locale, 'مميز', 'Premium')}` : ''}
          </span>
          <SignOutButton
            locale={locale}
            label={pick(locale, 'تسجيل الخروج', 'Sign out')}
            className={styles.signOut}
          />
        </section>

        <section>
          <div className={styles.head}>
            <h2>{pick(locale, 'مفضلاتي', 'My favorites')}</h2>
            <Badge variant="outline" size="sm">{user.favorites.length}</Badge>
          </div>
          {user.favorites.length > 0 ? (
            <div className={styles.grid}>
              {user.favorites.map((favorite) => {
                const detail = favoriteDetails.get(favorite.entityId);
                return (
                  <Card key={favorite.id} variant="interactive" padding="sm">
                    <Link href={detail?.href ?? '/matches'} className={styles.cardLink}>
                      <span className={styles.mark}>{kindLabel(favorite.entityType).charAt(0)}</span>
                      <span className={styles.copy}>
                        <Badge variant="accent" size="sm">{kindLabel(favorite.entityType)}</Badge>
                        <strong>{detail?.name ?? pick(locale, 'عنصر غير متاح', 'Unavailable item')}</strong>
                      </span>
                    </Link>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>
              {pick(locale, 'لم تُضف فرقاً أو مباريات إلى المفضلة بعد.', 'No teams or matches saved yet.')}
            </p>
          )}
        </section>

        {notices.length > 0 ? (
          <section>
            <div className={styles.head}>
              <h2>{pick(locale, 'آخر التنبيهات', 'Recent alerts')}</h2>
            </div>
            <div className={styles.stack}>
              {notices.map((notice) => (
                <Card key={notice.id} variant="bordered" padding="sm" className={styles.notice}>
                  <div className={styles.head}>
                    <Badge variant="accent" size="sm">{typeLabel(notice.type)}</Badge>
                    <time className={styles.when} dateTime={notice.sentAt.toISOString()}>
                      {format(notice.sentAt, 'p', { locale: locale === 'ar' ? ar : enUS })}
                    </time>
                  </div>
                  {notice.title ? <strong>{notice.title}</strong> : null}
                  {notice.body ? <p>{notice.body}</p> : null}
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className={styles.head}>
            <h2>{pick(locale, 'تخصيص الإشعارات', 'Notification preferences')}</h2>
          </div>
          <NotificationSettings initialPrefs={stored.prefs} configured={stored.configured} />
        </section>
      </div>
    </SalonStage>
  );
}
