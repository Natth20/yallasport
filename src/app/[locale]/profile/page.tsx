import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { User, Shield, Heart, Bell, Crown } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Link } from '@/i18n/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { NotificationSettings } from './NotificationSettings';
import { PAYMENTS_ENABLED, subscriptionLabel, isPremiumSubscriber } from '@/lib/auth/premium';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import houseStyles from '@/components/house/house.module.css';

/**
 * ProfilePage - Personal dashboard for authenticated users.
 * Displays user info, followed teams, and saved matches.
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ProfilePageBody />
    </Suspense>
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
  teams.forEach((team) => favoriteDetails.set(team.id, { name: team.name, href: `/team/${team.slug}` }));
  leagues.forEach((league) => favoriteDetails.set(league.id, { name: league.name, href: `/league/${league.slug}` }));
  matches.forEach((match) => favoriteDetails.set(match.id, {
    name: `${match.homeTeam.name} ضد ${match.awayTeam.name}`,
    href: `/match/${match.id}`,
  }));

  return (
    <div className={`${houseStyles.account} mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Sidebar: User Info */}
        <div className="space-y-8">
          <div className="bg-card dark:bg-background p-10 rounded-[3rem] shadow-2xl border border-gray-50 dark:border-border text-center">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-950/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black mb-1">{user.name || pick(locale, 'مشجع يلا سبورت', 'Yalla Sport fan')}</h2>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-4">{user.role}</p>
            <div className={`mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black ${premium ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'}`}>
              <Crown className="h-3.5 w-3.5" />
              {subscriptionLabel(user.subscriptionStatus, locale)} · {user.points} {pick(locale, 'نقطة', 'pts')}
            </div>

            <div className="space-y-3">
              <Link href="/profile/edit" className="flex items-center gap-3 w-full bg-muted dark:bg-muted p-4 rounded-2xl font-bold text-sm hover:bg-orange-50 hover:text-orange-500 transition-all">
                <User className="w-5 h-5" />
                {pick(locale, 'تعديل الملف', 'Edit profile')}
              </Link>
              <Link href="/favorites" className="flex items-center gap-3 w-full bg-muted dark:bg-muted p-4 rounded-2xl font-bold text-sm hover:bg-orange-50 hover:text-orange-500 transition-all">
                <Heart className="w-5 h-5" />
                {pick(locale, 'صفحة المفضلة', 'Favorites page')}
              </Link>
              <Link href="/settings/notifications" className="flex items-center gap-3 w-full bg-muted dark:bg-muted p-4 rounded-2xl font-bold text-sm hover:bg-orange-50 hover:text-orange-500 transition-all">
                <Bell className="w-5 h-5" />
                {pick(locale, 'إعدادات التنبيهات', 'Notification settings')}
              </Link>
              <SignOutButton
                locale={locale}
                label={pick(locale, 'تسجيل الخروج', 'Sign out')}
                className="flex items-center gap-3 w-full bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl font-bold text-sm text-red-600 hover:bg-red-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Favorites Section */}
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              مفضلاتي
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.favorites.length > 0 ? (
                user.favorites.map((fav) => (
                  <div key={fav.id} className="bg-card dark:bg-background p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted dark:bg-muted rounded-xl flex items-center justify-center font-black text-xs text-muted-foreground">
                        {fav.entityType[0]}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-orange-500 uppercase block">{fav.entityType}</span>
                        <Link href={favoriteDetails.get(fav.entityId)?.href ?? '/matches'} className="font-bold hover:text-orange-500">
                          {favoriteDetails.get(fav.entityId)?.name ?? 'عنصر غير متاح'}
                        </Link>
                      </div>
                    </div>
                    <button className="text-muted-foreground hover:text-red-500">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-muted dark:bg-muted/50 rounded-[2rem] border-2 border-dashed border-border dark:border-border">
                  <p className="text-muted-foreground font-bold">لم تقم بإضافة أي فرق أو مباريات للمفضلة بعد.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Notifications */}
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
              <Shield className="w-8 h-8 text-brand-green" />
              آخر التنبيهات
            </h2>
            <div className="space-y-4">
              {user.notifications.length > 0 ? (
                user.notifications.map((notif) => (
                  <div key={notif.id} className="bg-muted dark:bg-background p-6 rounded-3xl border border-transparent hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-orange-500 uppercase tracking-tighter">{notif.type}</span>
                      <span className="text-[10px] text-muted-foreground">{format(notif.sentAt, 'p', { locale: ar })}</span>
                    </div>
                    <p className="text-sm font-bold mt-2">لقد تلقيت تنبيهاً جديداً بخصوص {notif.entityType}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic">لا توجد تنبيهات حديثة.</p>
              )}
            </div>
          </section>

          {/* Notification Preferences */}
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
              <Bell className="w-8 h-8 text-orange-500" />
              {pick(locale, 'تخصيص الإشعارات', 'Notification preferences')}
            </h2>
            <NotificationSettings initialPrefs={{
              goal: true,
              matchStart: true,
              matchEnd: true,
              breakingNews: true,
              ...(user.notificationPrefs as Partial<{
                goal: boolean;
                matchStart: boolean;
                matchEnd: boolean;
                breakingNews: boolean;
              }> ?? {}),
            }} />
          </section>
        </div>

      </div>
    </div>
  );
}
