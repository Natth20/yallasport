import type { Metadata } from 'next';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://yalla-sport.com').replace(/\/$/, '');
export const SITE_NAME = 'Yalla Sport';
export const SITE_NAME_AR = 'يلا سبورت';
export const LOGO_PATH = '/images/logo.png';
export const THEME_COLOR = '#f97316';
export const CONTACT_EMAIL = 'contact@yallasport.com';

export function siteInboxEmail() {
  const fromEnv = process.env.SITE_INBOX_EMAIL?.trim();
  return fromEnv || CONTACT_EMAIL;
}

export function absoluteUrl(path = '') {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${SITE_URL}${normalized}`;
}

export function brandName(locale: string) {
  return locale === 'ar' ? SITE_NAME_AR : SITE_NAME;
}

export function defaultTitle(locale: string) {
  return locale === 'ar'
    ? 'يلا سبورت | نتائج المباريات الحية، الدوريات، والأخبار المعتمدة'
    : 'Yalla Sport | Live football scores, leagues, and verified news';
}

export function defaultDescription(locale: string) {
  return locale === 'ar'
    ? 'يلا سبورت منصة كرة قدم عربية لنتائج المباريات الحية، جداول الترتيب، مواعيد الركلات، والأخبار المعتمدة من المصدر فقط. تابع الدوري الإنجليزي، الليغا، دوري أبطال أوروبا، والدوري المصري بأرقام حقيقية دون نتائج وهمية.'
    : 'Yalla Sport is an Arabic-first football desk for live scores, league tables, kickoff times, and source-verified news. Follow the Premier League, La Liga, the Champions League, and the Egyptian Premier League with real figures — never invented results.';
}

export function defaultKeywords(locale: string): string[] {
  return locale === 'ar'
    ? [
        'يلا سبورت',
        'كرة قدم',
        'نتائج مباشرة',
        'نتائج المباريات',
        'الدوري الإنجليزي',
        'الدوري الإسباني',
        'الليغا',
        'دوري أبطال أوروبا',
        'الدوري المصري',
        'جدول الترتيب',
        'مواعيد المباريات',
        'أخبار رياضية',
        'الهدافون',
        'البث المرخص',
        'Yalla Sport',
      ]
    : [
        'Yalla Sport',
        'football',
        'soccer',
        'live scores',
        'Premier League',
        'La Liga',
        'Champions League',
        'Egyptian Premier League',
        'league tables',
        'match fixtures',
        'sports news',
        'top scorers',
        'licensed broadcasts',
        'يلا سبورت',
      ];
}

export function ogLocale(locale: string) {
  return locale === 'ar' ? 'ar_EG' : 'en_US';
}

function localePath(locale: string, path: string) {
  const normalized = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

function resolveImages(images?: Array<string | null | undefined>) {
  const cleaned = (images || [])
    .map((src) => src?.trim())
    .filter((src): src is string => Boolean(src));
  const urls = cleaned.length ? cleaned : [LOGO_PATH];
  return urls.slice(0, 4).map((src) => ({
    url: absoluteUrl(src),
    width: 1200,
    height: 1200,
    alt: SITE_NAME,
    type: src.endsWith('.jpg') || src.endsWith('.jpeg') ? 'image/jpeg' : undefined,
  }));
}

type PageMetaInput = {
  locale: string;
  title: string;
  description: string;
  path: string;
  images?: Array<string | null | undefined>;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  noIndex?: boolean;
  absolute?: boolean;
};

export function pageMetadata(input: PageMetaInput): Metadata {
  const title = input.title.trim();
  const description = input.description.trim();
  const images = resolveImages(input.images);
  const canonical = localePath(input.locale, input.path);
  const openGraph = {
    title,
    description,
    url: absoluteUrl(canonical),
    siteName: SITE_NAME,
    locale: ogLocale(input.locale),
    alternateLocale: input.locale === 'ar' ? ['en_US'] : ['ar_EG'],
    type: input.type || 'website',
    images,
    ...(input.type === 'article'
      ? {
          publishedTime: input.publishedTime,
          modifiedTime: input.modifiedTime,
          authors: input.authors,
        }
      : {}),
  } as Metadata['openGraph'];

  return {
    title: input.absolute ? { absolute: title } : title,
    description,
    applicationName: SITE_NAME,
    keywords: input.keywords?.length ? input.keywords : defaultKeywords(input.locale),
    authors: (input.authors?.length ? input.authors : [SITE_NAME]).map((name) => ({ name })),
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'sports',
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: {
        ar: localePath('ar', input.path),
        en: localePath('en', input.path),
        'x-default': localePath('ar', input.path),
      },
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
    robots: input.noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

export function siteGraph(locale: string) {
  const home = absoluteUrl(`/${locale}`);
  const orgId = `${SITE_URL}/#organization`;
  const siteId = `${SITE_URL}/#website`;
  const logoId = `${SITE_URL}/#logo`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: SITE_NAME,
        alternateName: [SITE_NAME_AR, 'YallaSport'],
        url: SITE_URL,
        email: CONTACT_EMAIL,
        logo: { '@id': logoId },
        image: { '@id': logoId },
        areaServed: 'Worldwide',
        knowsLanguage: ['ar', 'en'],
        description: defaultDescription(locale),
      },
      {
        '@type': 'ImageObject',
        '@id': logoId,
        url: absoluteUrl(LOGO_PATH),
        contentUrl: absoluteUrl(LOGO_PATH),
        caption: SITE_NAME,
      },
      {
        '@type': 'WebSite',
        '@id': siteId,
        url: home,
        name: brandName(locale),
        inLanguage: locale === 'ar' ? 'ar' : 'en',
        publisher: { '@id': orgId },
        description: defaultDescription(locale),
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${absoluteUrl(`/${locale}/search`)}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SportsOrganization',
        '@id': `${SITE_URL}/#sports`,
        name: SITE_NAME,
        sport: 'Soccer',
        url: home,
        parentOrganization: { '@id': orgId },
      },
    ],
  };
}
