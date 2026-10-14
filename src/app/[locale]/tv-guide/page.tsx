import { redirect } from 'next/navigation';

export default async function TVGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/channels`);
}
