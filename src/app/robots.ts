import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/*/admin',
          '/*/admin/',
          '/*/login',
          '/*/register',
          '/*/forgot-password',
          '/*/watch/',
          '/*/profile',
          '/*/settings',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
