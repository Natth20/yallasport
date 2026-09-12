import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations('metadata');
  return {
    name: t('site_title'),
    short_name: 'YallaSport',
    description: t('site_description'),
    start_url: '.',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#f97316',
    icons: [
      { src: '/images/logo.jpg', sizes: '192x192', type: 'image/jpeg' },
      { src: '/images/logo.jpg', sizes: '512x512', type: 'image/jpeg' }
    ]
  };
}
