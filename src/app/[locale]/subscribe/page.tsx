import { getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { Link } from '@/i18n/navigation';
import { Crown, Shield, Zap } from 'lucide-react';
import { pick } from '@/i18n/pick';
import { subscriptionLabel, isPremiumSubscriber } from '@/lib/auth/premium';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الاشتراك', 'Subscribe'),
    description: pick(
      locale,
      'خطط يلا سبورت: مجاني، مميز، وVIP. بوابة الدفع تُربط لاحقاً دون تغيير المنطق.',
      'Yalla Sport plans: Free, Premium, and VIP. Payment checkout plugs in later without changing the logic.'
    ),
    path: '/subscribe',
  });
}

export default async function SubscribePage() {
  const locale = await getLocale();
  const session = await auth();
  const status = session?.user?.subscriptionStatus || 'FREE';
  const premium = isPremiumSubscriber(status, session?.user?.role);

  const plans = [
    {
      id: 'FREE',
      icon: Zap,
      title: pick(locale, 'مجاني', 'Free'),
      blurb: pick(locale, 'النتائج، الأخبار المعتمدة، والتوقعات.', 'Scores, approved news, and predictions.'),
    },
    {
      id: 'PREMIUM',
      icon: Crown,
      title: pick(locale, 'مميز', 'Premium'),
      blurb: pick(locale, 'تحليلات حصرية ومحتوى VOD المقيّد عند التفعيل.', 'Exclusive analysis and gated VOD when streaming is on.'),
    },
    {
      id: 'VIP',
      icon: Shield,
      title: 'VIP',
      blurb: pick(locale, 'أعلى طبقة استحقاق للبث المرخّص عند توفره.', 'Highest entitlement tier for licensed streams when available.'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <header className="mb-12 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500">
          {pick(locale, 'الاشتراك', 'Subscription')}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground dark:text-foreground">
          {pick(locale, 'خطط جاهزة للربط مع الدفع', 'Plans ready for checkout wiring')}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {pick(
            locale,
            'المنطق (isPremium / subscriptionStatus) مكتمل. Stripe أو PayPal يُضافان لاحقاً دون إعادة بناء البوابة.',
            'Logic (isPremium / subscriptionStatus) is complete. Stripe or PayPal can plug in later without rebuilding the gate.'
          )}
        </p>
      </header>

      <div className="mb-10 rounded-2xl border border-orange-200/70 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
        {session?.user
          ? pick(
              locale,
              `حالتك الحالية: ${subscriptionLabel(status, locale)}${premium ? ' — وصول مميز مفعّل' : ''}`,
              `Current status: ${subscriptionLabel(status, locale)}${premium ? ' — premium access active' : ''}`
            )
          : pick(locale, 'لست مسجّلاً بعد. سجّل الدخول لربط الحالة بحسابك.', 'You are not signed in. Sign in to attach status to your account.')}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const active = status === plan.id || (plan.id === 'FREE' && !premium);
          return (
            <article
              key={plan.id}
              className={`rounded-3xl border p-6 ${
                active
                  ? 'border-orange-500 bg-card shadow-lg dark:bg-background'
                  : 'border-border bg-white/70 dark:border-border dark:bg-card/[0.03]'
              }`}
            >
              <Icon className="h-6 w-6 text-orange-500" />
              <h2 className="mt-4 text-xl font-black text-foreground dark:text-foreground">{plan.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{plan.blurb}</p>
              {active ? (
                <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-orange-500">
                  {pick(locale, 'خطتك الحالية', 'Your current plan')}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={session?.user ? '/profile' : '/login'}
          className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-white dark:bg-card dark:text-foreground"
        >
          {session?.user
            ? pick(locale, 'العودة للملف', 'Back to profile')
            : pick(locale, 'تسجيل الدخول', 'Sign in')}
        </Link>
        <Link href="/vod" className="rounded-xl border border-border px-5 py-3 text-sm font-bold dark:border-border">
          {pick(locale, 'مكتبة VOD', 'VOD library')}
        </Link>
      </div>
    </div>
  );
}
