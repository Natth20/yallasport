import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';

/** API-Football competition IDs → desk names. Never map a bare "Premier League" string. */
const LEAGUE_BY_ID: Record<string, { ar: string; en: string }> = {
  '1': { ar: 'كأس العالم', en: 'FIFA World Cup' },
  '2': { ar: 'دوري أبطال أوروبا', en: 'UEFA Champions League' },
  '3': { ar: 'الدوري الأوروبي', en: 'UEFA Europa League' },
  '4': { ar: 'بطولة أمم أوروبا', en: 'UEFA Euro' },
  '5': { ar: 'دوري الأمم الأوروبية', en: 'UEFA Nations League' },
  '6': { ar: 'كأس أفريقيا للأمم', en: 'Africa Cup of Nations' },
  '9': { ar: 'كوبا أمريكا', en: 'Copa America' },
  '10': { ar: 'مباريات دولية ودية', en: 'International Friendlies' },
  '15': { ar: 'كأس العالم للأندية', en: 'FIFA Club World Cup' },
  '39': { ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League' },
  '40': { ar: 'التشامبيونشيب', en: 'Championship' },
  '45': { ar: 'كأس الاتحاد الإنجليزي', en: 'FA Cup' },
  '48': { ar: 'كأس الرابطة الإنجليزية', en: 'EFL Cup' },
  '61': { ar: 'الدوري الفرنسي', en: 'Ligue 1' },
  '71': { ar: 'الدوري البرازيلي', en: 'Brasileirão' },
  '78': { ar: 'البوندسليغا', en: 'Bundesliga' },
  '88': { ar: 'الدوري الهولندي', en: 'Eredivisie' },
  '94': { ar: 'الدوري البرتغالي', en: 'Primeira Liga' },
  '98': { ar: 'الدوري الياباني', en: 'J1 League' },
  '103': { ar: 'الدوري النرويجي', en: 'Eliteserien' },
  '113': { ar: 'الدوري السويدي', en: 'Allsvenskan' },
  '128': { ar: 'الدوري الأرجنتيني', en: 'Liga Profesional' },
  '135': { ar: 'الدوري الإيطالي', en: 'Serie A' },
  '140': { ar: 'الليغا', en: 'La Liga' },
  '143': { ar: 'كأس الملك', en: 'Copa del Rey' },
  '144': { ar: 'الدوري البلجيكي', en: 'Belgian Pro League' },
  '169': { ar: 'الدوري الصيني الممتاز', en: 'Chinese Super League' },
  '179': { ar: 'الدوري الإسكتلندي', en: 'Premiership' },
  '203': { ar: 'الدوري التركي', en: 'Süper Lig' },
  '233': { ar: 'الدوري المصري الممتاز', en: 'Egyptian Premier League' },
  '253': { ar: 'MLS', en: 'Major League Soccer' },
  '262': { ar: 'الدوري المكسيكي', en: 'Liga MX' },
  '286': { ar: 'دوري نجوم قطر', en: 'Qatar Stars League' },
  '292': { ar: 'الدوري الكوري', en: 'K League 1' },
  '301': { ar: 'دوري أدنوك', en: 'UAE Pro League' },
  '307': { ar: 'دوري روشن', en: 'Saudi Pro League' },
  '340': { ar: 'الدوري المنغولي الممتاز', en: 'Mongolian Premier League' },
  '848': { ar: 'دوري المؤتمر الأوروبي', en: 'UEFA Europa Conference League' },
  '667': { ar: 'مباريات ودية للأندية', en: 'Club Friendlies' },
};

const LEAGUE_COUNTRY_BY_ID: Record<string, string> = {
  '1': 'World',
  '2': 'World',
  '3': 'World',
  '4': 'World',
  '5': 'World',
  '6': 'World',
  '9': 'World',
  '10': 'World',
  '15': 'World',
  '39': 'England',
  '40': 'England',
  '45': 'England',
  '48': 'England',
  '61': 'France',
  '71': 'Brazil',
  '78': 'Germany',
  '88': 'Netherlands',
  '94': 'Portugal',
  '98': 'Japan',
  '103': 'Norway',
  '113': 'Sweden',
  '128': 'Argentina',
  '135': 'Italy',
  '140': 'Spain',
  '143': 'Spain',
  '144': 'Belgium',
  '169': 'China',
  '179': 'Scotland',
  '203': 'Turkey',
  '233': 'Egypt',
  '253': 'USA',
  '262': 'Mexico',
  '286': 'Qatar',
  '292': 'South Korea',
  '301': 'United Arab Emirates',
  '307': 'Saudi-Arabia',
  '340': 'Mongolia',
  '848': 'World',
  '667': 'World',
};

export function countryForLeagueId(externalId?: string | null) {
  if (!externalId) return null;
  return LEAGUE_COUNTRY_BY_ID[String(externalId)] || null;
}

export function localizeCountryName(locale: string, raw?: string | null) {
  const value = (raw || '').trim();
  if (!value) return '';
  return localizePlainName(locale, value.replace(/[_-]+/g, ' '));
}

export function formatLeagueSeason(seasonId?: string | null) {
  if (!seasonId) return null;
  const year = Number.parseInt(seasonId, 10);
  if (!Number.isFinite(year) || year < 1990 || year > 2100) return seasonId;
  return `${year}/${String(year + 1).slice(-2)}`;
}
const EPL_AR = 'الدوري الإنجليزي الممتاز';
const ROSHN_AR = 'دوري روشن';

function countryLooksEnglish(country?: string | null) {
  const value = String(country || '').toLowerCase();
  return /england|إنجلترا|united kingdom|britain/.test(value);
}

function countryLooksSaudi(country?: string | null) {
  const value = String(country || '').toLowerCase();
  return /saudi|السعود/.test(value);
}

export function leagueNameByExternalId(locale: string, externalId?: string | null) {
  if (!externalId) return null;
  const entry = LEAGUE_BY_ID[String(externalId)];
  if (!entry) return null;
  return locale === 'ar' ? entry.ar : entry.en;
}

const ARABIC_ORDINAL: Record<string, string> = {
  '1': 'الأولى',
  '2': 'الثانية',
  '3': 'الثالثة',
  '4': 'الرابعة',
  '5': 'الخامسة',
  '6': 'السادسة',
  '7': 'السابعة',
  '8': 'الثامنة',
  '9': 'التاسعة',
  '10': 'العاشرة',
  '11': 'الحادية عشرة',
  '12': 'الثانية عشرة',
};

function arabicOrdinal(n: string) {
  return ARABIC_ORDINAL[String(Number.parseInt(n, 10))] || n;
}

export function localizeRoundName(locale: string, raw?: string | null) {
  const value = (raw || '').trim();
  if (!value) return '';
  if (locale !== 'ar') return value;
  const staged = value
    .replace(/\bknockout play-?offs?\b/gi, 'الملحق')
    .replace(/\bplay-?off round\b/gi, 'الملحق')
    .replace(/\bround of 16\b/gi, 'دور الـ16')
    .replace(/\beighth-?finals?\b/gi, 'دور الـ16')
    .replace(/\bquarter-?finals?\b/gi, 'ربع النهائي')
    .replace(/\bsemi-?finals?\b/gi, 'نصف النهائي')
    .replace(/\bleague stage\b/gi, 'مرحلة الدوري')
    .replace(/\bgroup stage\b/gi, 'دور المجموعات')
    .replace(/\bregular season\b/gi, 'الموسم العادي')
    .replace(/\bmatchday\s*(\d+)\b/gi, (_all, n: string) => `الجولة ${arabicOrdinal(n)}`)
    .replace(/\bround\s+(\d+)\b/gi, (_all, n: string) => `الجولة ${arabicOrdinal(n)}`)
    .replace(/\s*[-–]\s*(\d+)\s*$/u, (_all, n: string) => ` – الجولة ${arabicOrdinal(n)}`)
    .replace(/\bplay-?offs?\b/gi, 'الملحق')
    .replace(/\bknockout\b/gi, 'الأدوار الإقصائية')
    .replace(/^finals?$/i, 'النهائي');
  return localizePlainName('ar', staged);
}

const UEFA_COMPETITION_IDS = new Set(['2', '3', '4', '5', '848']);
const CONTINENT_BY_ID: Record<string, string> = {
  '2': 'Europe',
  '3': 'Europe',
  '4': 'Europe',
  '5': 'Europe',
  '6': 'Africa',
  '9': 'South America',
  '848': 'Europe',
};

/** Stable atlas chapter: continents first, never treat UEFA as a country named World. */
export function atlasChapterKey(country?: string | null, externalId?: string | null) {
  const byId = CONTINENT_BY_ID[String(externalId || '')];
  if (byId) return byId;
  const value = (country || '').trim();
  if (!value || /^world$/i.test(value) || value === 'عالمي') return 'World';
  return value;
}

export function chapterRank(key: string) {
  const order = ['World', 'Europe', 'Asia', 'Africa', 'South America', 'North America', 'Oceania'];
  const index = order.indexOf(key);
  return index === -1 ? 100 + key.charCodeAt(0) : index;
}

export function roundSortKey(raw?: string | null) {
  const value = String(raw || '').toLowerCase();
  if (!value) return 10_000;
  const nums = value.match(/\d+/g);
  const n = nums ? Number(nums[nums.length - 1]) : 0;
  if (/final/.test(value) && !/quarter|semi|round of/.test(value)) return 9_000 + n;
  if (/semi/.test(value)) return 8_000 + n;
  if (/quarter/.test(value)) return 7_000 + n;
  if (/round of 16|eighth/.test(value)) return 6_000 + n;
  if (/round of 32/.test(value)) return 5_000 + n;
  if (/play-?off|knockout/.test(value)) return 4_000 + n;
  if (/group/.test(value)) return 1_000 + n;
  return 200 + n;
}

export function localizeLeagueRegion(
  locale: string,
  country?: string | null,
  externalId?: string | null,
) {
  if (UEFA_COMPETITION_IDS.has(String(externalId || ''))) {
    return locale === 'ar' ? 'أوروبا' : 'Europe';
  }
  const value = (country || '').trim();
  if (!value || /^world$/i.test(value) || value === 'عالمي') {
    if (!value) return '';
    return locale === 'ar' ? 'عالمي' : 'International';
  }
  return localizeCountryName(locale, value);
}

type LeagueInput = {
  name?: string | null;
  country?: string | null;
  externalId?: string | null;
};

export function localizeCompetitionTitle(
  locale: string,
  league: LeagueInput,
  translated?: string | null,
) {
  const named = localizeLeagueName(locale, league, translated);
  if (locale !== 'ar') return named;
  return localizeTeamName('ar', named).replace(/\bwomen'?s?\b/gi, 'للسيدات');
}

export function localizeLeagueName(locale: string, league: LeagueInput, translated?: string | null) {
  const byId = leagueNameByExternalId(locale, league.externalId);
  if (byId) return byId;

  const official = (league.name || '').trim();
  const stored = (translated || '').trim();
  if (locale === 'ar') {
    if (stored === EPL_AR && !countryLooksEnglish(league.country) && String(league.externalId || '') !== '39') {
      // Machine map used to stamp every "Premier League" as the English top flight.
    } else if (stored === ROSHN_AR && !countryLooksSaudi(league.country) && String(league.externalId || '') !== '307') {
      // Same class of error for generic "Pro League".
    } else if (stored && stored !== official) {
      return stored;
    }
  } else if (stored && stored !== official) {
    return stored;
  }

  if (!official) return stored;

  if (locale === 'ar') {
    const countryAr = league.country ? localizePlainName('ar', league.country) : '';
    if (/^premier league$/i.test(official) || /^premierleague$/i.test(official.replace(/\s+/g, ''))) {
      if (countryLooksEnglish(league.country)) return EPL_AR;
      if (countryAr) return `دوري ${countryAr} الممتاز`;
      return official;
    }
    if (/friendly international|world.*friendl/i.test(official)) return 'مباريات دولية ودية';
    if (/club friendly|friendlies clubs|club friendlies/i.test(official)) return 'مباريات ودية للأندية';
    if (/^friendl(y|ies)$/i.test(official)) {
      return /club/i.test(String(league.country || '')) ? 'مباريات ودية للأندية' : 'مباريات دولية ودية';
    }
    if (/pro league/i.test(official) && countryAr && !countryLooksSaudi(league.country)) {
      return `دوري ${countryAr}`;
    }
  }

  return localizePlainName(locale, official);
}
