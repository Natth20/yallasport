/**
 * The news desks a story can be filed under.
 *
 * `News.category` is free text, so this is the single place that decides what
 * goes in it. Feeds arrive tagged only "Football"; classifying on import is what
 * turns the category filter on /news from one dead chip into a real index.
 *
 * Order matters: the first desk whose pattern matches wins, so the specific
 * competitions sit above the broad catch-alls.
 */
export type NewsDesk = {
  /** Stored verbatim in News.category. */
  key: string;
  ar: string;
  en: string;
  match: RegExp;
};

export const NEWS_DESKS: NewsDesk[] = [
  {
    key: 'Champions League',
    ar: 'دوري أبطال أوروبا',
    en: 'Champions League',
    match:
      /champions\sleague|europa\sleague|conference\sleague|uefa\b|دوري\s*أبطال|دوري\sالأبطال|الدوري\sالأوروبي|اليوروبا/i,
  },
  {
    key: 'Premier League',
    ar: 'الدوري الإنجليزي الممتاز',
    en: 'Premier League',
    match:
      /premier\sleague|\bepl\b|arsenal|liverpool|manchester\s(united|city)|chelsea|tottenham|newcastle\sunited|الدوري\sالإنجليزي|البريميرليغ|ليفربول|أرسنال|مانشستر|تشيلسي|توتنهام/i,
  },
  {
    key: 'La Liga',
    ar: 'الليغا',
    en: 'La Liga',
    match:
      /la\s?liga|real\smadrid|barcelona|atletico\smadrid|الدوري\sالإسباني|الليغا|ريال\sمدريد|برشلونة|أتلتيكو/i,
  },
  {
    key: 'Saudi League',
    ar: 'دوري روشن',
    en: 'Saudi Pro League',
    match:
      /saudi\spro\sleague|roshn|al\s?hilal|al\s?nassr|al\s?ittihad|al\s?ahli\s?saudi|دوري\sروشن|الدوري\sالسعودي|الهلال|النصر|الاتحاد\sالسعودي|الأهلي\sالسعودي/i,
  },
  {
    key: 'Transfers',
    ar: 'الانتقالات',
    en: 'Transfers & Mercato',
    match:
      /\btransfer(s|red|\swindow)?\b|\bsign(s|ed|ing)\b|\bdeal\sfor\b|\bbid\sfor\b|\bmove\sto\b|\bloan\b|انتقال|انتقالات|صفقة|صفقات|يوقّع|وقّع\sعقد|إعارة|الميركاتو/i,
  },
  {
    key: 'International',
    ar: 'كأس العالم والمنتخبات',
    en: 'World Cup & International',
    match:
      /world\scup|euro\s20|nations\sleague|africa\scup|copa\samerica|international\sbreak|\bqualifier(s)?\b|منتخب|المنتخبات|كأس\sالعالم|أمم\sأفريقيا|كوبا\sأمريكا|تصفيات/i,
  },
  {
    key: 'Tactical Analysis',
    ar: 'تحليلات تكتيكية',
    en: 'Tactical Analysis',
    match:
      /tactics|tactical|analysis|stats|data\sanalyst|تحليل|تكتيك|خطة|قراءة\sفنية|أرقام\sوإحصائيات|أداء/i,
  },
  {
    key: 'Serie A',
    ar: 'الدوري الإيطالي',
    en: 'Serie A',
    match:
      /serie\sa\b|juventus|\bmilan\b|inter\smilan|napoli|\broma\b|الدوري\sالإيطالي|يوفنتوس|ميلان|إنتر|نابولي|روما/i,
  },
  {
    key: 'Bundesliga',
    ar: 'البوندسليغا',
    en: 'Bundesliga',
    match:
      /bundesliga|bayern\smunich|borussia\sdortmund|leverkusen|الدوري\sالألماني|بايرن|دورتموند|ليفركوزن/i,
  },
  {
    key: 'Ligue 1',
    ar: 'الدوري الفرنسي',
    en: 'Ligue 1',
    match: /ligue\s?1|paris\ssaint-germain|\bpsg\b|marseille|الدوري\sالفرنسي|باريس\sسان\sجيرمان|مارسيليا/i,
  },
  {
    key: 'Arab Football',
    ar: 'الكرة العربية والإفريقية',
    en: 'Arab & African Football',
    match:
      /egyptian\spremier|al\s?ahly|zamalek|الترجي|الرجاء|الوداد|الدوري\sالمصري|الأهلي\sالمصري|الزمالك|كأس\sالعرش|أبطال\sإفريقيا/i,
  },
  {
    key: "Women's Football",
    ar: 'كرة القدم النسائية',
    en: "Women's Football",
    match: /women'?s\s(super\sleague|football|world\scup)|\bwsl\b|كرة\sالقدم\sالنسائية|النسائية/i,
  },
];

/** The desk every story falls back to when nothing more specific matches. */
export const DEFAULT_DESK = { key: 'Football', ar: 'كرة القدم', en: 'Football' };

export function classifyDesk(title: string, body = ''): string {
  // Titles are the strongest signal; only fall back to the body when needed.
  const head = title || '';
  const full = `${title} ${body.replace(/<[^>]+>/g, ' ')}`.slice(0, 4000);
  const byHead = NEWS_DESKS.find((desk) => desk.match.test(head));
  if (byHead) return byHead.key;
  const byFull = NEWS_DESKS.find((desk) => desk.match.test(full));
  return byFull ? byFull.key : DEFAULT_DESK.key;
}

export function deskLabel(category: string | null | undefined, locale: string): string {
  if (!category) return locale === 'ar' ? DEFAULT_DESK.ar : DEFAULT_DESK.en;
  const desk = NEWS_DESKS.find((d) => d.key === category);
  if (desk) return locale === 'ar' ? desk.ar : desk.en;
  if (category === DEFAULT_DESK.key) return locale === 'ar' ? DEFAULT_DESK.ar : DEFAULT_DESK.en;
  return category;
}

/** Competition tags worth storing alongside the desk, for the "in the news" rails. */
export function competitionTags(title: string, body = ''): string[] {
  const text = `${title} ${body.replace(/<[^>]+>/g, ' ')}`.slice(0, 4000);
  return NEWS_DESKS.filter((desk) => desk.match.test(text)).map((desk) => desk.key.toLowerCase().replace(/\s+/g, '-'));
}
