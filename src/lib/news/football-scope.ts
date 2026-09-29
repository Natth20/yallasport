import type { Prisma } from '@/generated/prisma';
import { hostFromUrl } from '@/lib/news/trusted-sources';

const ALJAZEERA_HOSTS = ['aljazeera.net', 'aljazeera.com'] as const;

/** Paths that are clearly not the sports desk. */
const ALJAZEERA_OFF_SPORT_PATH =
  /\/(politics|ebusiness|economy|opinions?|blogs?|science|culture|arts?|climate|encyclopedia|features|investigations|humanrights|midan)(?:\/|$)/i;

const ALJAZEERA_SPORT_PATH =
  /\/sports?(?:\/|$)|\/football(?:\/|$)|\/رياضة|%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9/i;

/**
 * Politics, other sports, and general news that ride a “sport” RSS item.
 * Keep this off club names — those belong on the pitch.
 */
export const NON_FOOTBALL_PATTERN =
  /شطرنج|\bchess\b|كرة\s*السلة|\bbasketball\b|\bnba\b|تنس|\btennis\b|فورمولا|formula\s*1|\bf1\b|ملاكمة|\bboxing\b|سباحة|أولمبي|\bolympic|ألعاب\s*القوى|حواجز|عداءة|عدّاء|سباق\s*\d+\s*متر|الإسكان|أصحاب الأراضي|مصافي|الجنائية الدولية|قادة الخليج|الثلاجة|الإصلاح الدولي|منشآت حيوية|الحوثي|حوثي|غارة|غارات|قصف|صاروخ|صواريخ|انتخابات|مجلس النواب|أزمة دبلوماسية|مظاهرات|اغتيال|أسعار الخبز|تضخم|دعم الخبز|الحرب في|عسكرية|معارك/;

/** Positive football signal. Avoid bare هدف / نادي / بطولة — they match politics and other sports. */
export const FOOTBALL_PATTERN =
  /football|\bsoccer\b|premier\sleague|la\s?liga|serie\s?a|bundesliga|ligue\s?1|champions\sleague|europa\sleague|conference\sleague|\buefa\b|\bfifa\b|world\scup|nations\sleague|africa\s?cup|afcon|كرة\s*القدم|كروية|مباراة|مباريات|منتخب|منتخبات|الدوري\sالإنجليزي|البريمير|الليغا|روشن|الهلال|النصر|الأهلي|الزمالك|ريال\sمدريد|برشلونة|ليفربول|مانشستر|أرسنال|تشيلسي|يوفنتوس|بايرن|ميسي|رونالدو|صلاح|هالاند|مبابي|فينيسيوس|مرموش|انتقالات|ميركاتو|ركلة\s(جزاء|حرة)|هداف|كأس\s(العالم|الخليج|خليجي|أمم|الملك|آسيا|الاتحاد)/i;

const TITLE_BLOCKLIST = [
  'شطرنج',
  'الإسكان',
  'مصافي',
  'الجنائية الدولية',
  'قادة الخليج',
  'الثلاجة',
  'الإصلاح الدولي',
  'أصحاب الأراضي',
  'منشآت حيوية',
  'الحوثي',
  'انتخابات',
  'كرة السلة',
  'فورمولا',
  'ألعاب القوى',
  'حواجز',
  'Who am I',
  'من أنا',
  'quiz',
  'Crossword',
  'اختبر معرفتك',
  'خمّن',
  'Guess the',
  'Fantasy',
] as const;

export function isAlJazeeraHost(host: string | null | undefined) {
  if (!host) return false;
  const normalized = host.toLowerCase().replace(/^www\./, '');
  return ALJAZEERA_HOSTS.some((trusted) => normalized === trusted || normalized.endsWith(`.${trusted}`));
}

export function isAlJazeeraSportsUrl(raw: string | null | undefined) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (!isAlJazeeraHost(url.hostname)) return false;
    let path = url.pathname;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      /* keep encoded */
    }
    if (ALJAZEERA_OFF_SPORT_PATH.test(path)) return false;
    return ALJAZEERA_SPORT_PATH.test(url.pathname) || ALJAZEERA_SPORT_PATH.test(path);
  } catch {
    return false;
  }
}

function plainText(title: string, content = '') {
  return `${title} ${content.replace(/<[^>]+>/g, ' ')}`.slice(0, 4000);
}

export function isFootballCoverage(input: {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
}) {
  const title = input.title?.trim() || '';
  if (!title) return false;
  const text = plainText(title, `${input.excerpt || ''} ${input.content || ''}`);
  if (NON_FOOTBALL_PATTERN.test(text)) return false;

  const host = hostFromUrl(input.sourceUrl);
  if (isAlJazeeraHost(host)) {
    if (isAlJazeeraSportsUrl(input.sourceUrl)) return FOOTBALL_PATTERN.test(text);
    return FOOTBALL_PATTERN.test(title);
  }

  return FOOTBALL_PATTERN.test(text);
}

/** Hide off-desk rows immediately, even before the cron archives them. */
export function footballCoverageWhere(): Prisma.NewsWhereInput {
  const titleNoise: Prisma.NewsWhereInput[] = TITLE_BLOCKLIST.map((phrase) =>
    /[A-Za-z]/.test(phrase)
      ? { title: { contains: phrase, mode: 'insensitive' as const } }
      : { title: { contains: phrase } },
  );

  const ajHosts: Prisma.NewsWhereInput[] = [
    { sourceUrl: { contains: '://www.aljazeera.net/' } },
    { sourceUrl: { contains: '://aljazeera.net/' } },
    { sourceUrl: { contains: '://www.aljazeera.com/' } },
    { sourceUrl: { contains: '://aljazeera.com/' } },
  ];

  const ajOffDeskPaths = [
    '/politics',
    '/ebusiness',
    '/economy',
    '/opinion',
    '/opinions',
    '/blogs',
    '/science',
    '/culture',
    '/climate',
    '/encyclopedia',
    '/midan',
  ];

  return {
    NOT: {
      OR: [
        ...titleNoise,
        {
          AND: [
            { OR: ajHosts },
            { OR: ajOffDeskPaths.map((path) => ({ sourceUrl: { contains: path } })) },
          ],
        },
      ],
    },
  };
}
