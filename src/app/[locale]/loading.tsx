import React from 'react';
import { getTranslations } from 'next-intl/server';
import { FootballLoader } from '@/components/common/FootballLoader';

export default async function Loading() {
  const t = await getTranslations('loading');
  return <FootballLoader caption={t('sync')} title={t('intelligence')} />;
}
