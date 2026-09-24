import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function VideoPage() {
  const locale = await getLocale();
  redirect(`/${locale}/videos`);
}
