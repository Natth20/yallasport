import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { TranslationReview } from './TranslationReview';

export default async function AdminTranslationsPage() {
  const session = await auth();
  if (!session || !['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'].includes(session.user?.role as string)) {
    redirect('/');
  }
  const t = await getTranslations('translations');
  const items = await prisma.newsTranslation.findMany({
    where: { status: 'DRAFT' },
    include: {
      news: { select: { id: true, title: true, excerpt: true, content: true, sourceLocale: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 40
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('hidden_note')}</p>
      </div>
      <TranslationReview items={items} />
    </div>
  );
}
