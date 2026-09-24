import { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Link } from '@/i18n/navigation';
import { ProfileEditForm } from './ProfileEditForm';

export const dynamic = 'force-dynamic';

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ProfileEditPageBody />
    </Suspense>
  );
}

async function ProfileEditPageBody() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile/edit');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500">
        {pick(locale, 'الملف', 'Profile')}
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">
        {pick(locale, 'تعديل الملف الشخصي', 'Edit profile')}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {pick(
          locale,
          'الاسم يظهر للجمهور في التعليقات والتوقعات. البريد مربوط بحساب Google ولا يُعدَّل من هنا.',
          'Your display name appears on comments and predictions. Email is bound to Google and cannot be changed here.',
        )}
      </p>
      <ProfileEditForm
        locale={locale}
        initialName={user.name || ''}
        email={user.email}
      />
      <Link href="/profile" className="mt-6 inline-block text-sm font-bold text-orange-500">
        {pick(locale, 'العودة للملف', 'Back to profile')}
      </Link>
    </div>
  );
}
