import { auth } from '@/lib/auth/auth';
import { isStaffRole } from '@/lib/auth/admin-access';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';

export async function StaffDoor({ className }: { className?: string }) {
  const locale = await getLocale();
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return null;

  return (
    <Link href="/admin" className={className}>
      {pick(locale, 'لوحة التحكم', 'Control desk')}
    </Link>
  );
}
