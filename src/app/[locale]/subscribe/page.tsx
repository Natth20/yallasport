import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubscribePage() {
  await headers();
  const locale = await getLocale();
  redirect(`/${locale}`);
}
