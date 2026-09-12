import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
  localeCookie: {
    name: 'yalla-locale',
    maxAge: 60 * 60 * 24 * 365
  },
  localeDetection: true
});

export type Locale = (typeof routing.locales)[number];
