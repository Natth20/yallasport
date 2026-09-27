import { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Link } from '@/i18n/navigation';
import { ProfileEditForm } from './ProfileEditForm';
import { SalonStage } from '@/components/salon/SalonStage';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './edit.module.css';

export const dynamic = 'force-dynamic';

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<EditFallback />}>
      <ProfileEditPageBody />
    </Suspense>
  );
}

function EditFallback() {
  return (
    <div className={styles.form}>
      <Skeleton variant="text" width="10rem" height="2rem" />
      <Skeleton variant="text" height="3rem" />
    </div>
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
    <SalonStage
      tone="vault"
      kicker={pick(locale, 'الملف', 'Profile')}
      title={pick(locale, 'تعديل الملف الشخصي', 'Edit profile')}
      lead={pick(
        locale,
        'الاسم يظهر للجمهور في التعليقات والتوقعات. البريد مربوط بحساب Google ولا يُعدَّل من هنا.',
        'Your display name appears on comments and predictions. Email is bound to Google and cannot be changed here.',
      )}
    >
      <ProfileEditForm
        locale={locale}
        initialName={user.name || ''}
        email={user.email}
      />
      <p className={styles.note}>
        <Link href="/profile" className={styles.back}>
          {pick(locale, 'العودة للملف', 'Back to profile')}
        </Link>
      </p>
    </SalonStage>
  );
}
