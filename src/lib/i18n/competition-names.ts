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
  '41': { ar: 'الدوري الإنجليزي - الدرجة الأولى', en: 'League One' },
  '42': { ar: 'الدوري الإنجليزي - الدرجة الثانية', en: 'League Two' },
  '45': { ar: 'كأس الاتحاد الإنجليزي', en: 'FA Cup' },
  '48': { ar: 'كأس الرابطة الإنجليزية', en: 'EFL Cup' },
  '61': { ar: 'الدوري الفرنسي', en: 'Ligue 1' },
  '62': { ar: 'الدوري الفرنسي الثاني', en: 'Ligue 2' },
  '66': { ar: 'كأس فرنسا', en: 'Coupe de France' },
  '71': { ar: 'الدوري البرازيلي', en: 'Brasileirão' },
  '73': { ar: 'كوبا دو برازيل', en: 'Copa do Brasil' },
  '78': { ar: 'البوندسليغا', en: 'Bundesliga' },
  '79': { ar: 'البوندسليغا الثانية', en: '2. Bundesliga' },
  '81': { ar: 'كأس ألمانيا', en: 'DFB Pokal' },
  '88': { ar: 'الدوري الهولندي', en: 'Eredivisie' },
  '89': { ar: 'الدوري الهولندي الثاني', en: 'Eerste Divisie' },
  '94': { ar: 'الدوري البرتغالي', en: 'Primeira Liga' },
  '95': { ar: 'الدوري البرتغالي الثاني', en: 'Liga Portugal 2' },
  '98': { ar: 'الدوري الياباني', en: 'J1 League' },
  '99': { ar: 'الدوري الياباني الثاني', en: 'J2 League' },
  '103': { ar: 'الدوري النرويجي', en: 'Eliteserien' },
  '113': { ar: 'الدوري السويدي', en: 'Allsvenskan' },
  '128': { ar: 'الدوري الأرجنتيني', en: 'Liga Profesional' },
  '130': { ar: 'كوبا أرجنتينا', en: 'Copa Argentina' },
  '135': { ar: 'الدوري الإيطالي', en: 'Serie A' },
  '136': { ar: 'الدوري الإيطالي الثاني', en: 'Serie B' },
  '137': { ar: 'كأس إيطاليا', en: 'Coppa Italia' },
  '140': { ar: 'الليغا', en: 'La Liga' },
  '141': { ar: 'الدوري الإسباني الثاني', en: 'La Liga 2' },
  '143': { ar: 'كأس الملك', en: 'Copa del Rey' },
  '144': { ar: 'الدوري البلجيكي', en: 'Belgian Pro League' },
  '169': { ar: 'الدوري الصيني الممتاز', en: 'Chinese Super League' },
  '179': { ar: 'الدوري الإسكتلندي', en: 'Premiership' },
  '197': { ar: 'الدوري اليوناني', en: 'Super League Greece' },
  '203': { ar: 'الدوري التركي', en: 'Süper Lig' },
  '207': { ar: 'الدوري الرومانيّ', en: 'Liga 1' },
  '218': { ar: 'الدوري الروسي', en: 'Premier League Russia' },
  '233': { ar: 'الدوري المصري الممتاز', en: 'Egyptian Premier League' },
  '253': { ar: 'MLS', en: 'Major League Soccer' },
  '262': { ar: 'الدوري المكسيكي', en: 'Liga MX' },
  '264': { ar: 'الدوري الكولومبي', en: 'Liga BetPlay' },
  '265': { ar: 'الدوري التشيلي', en: 'Primera División Chile' },
  '271': { ar: 'الدوري الدنماركي', en: 'Superliga Denmark' },
  '283': { ar: 'الدوري الأوكراني', en: 'Premier League Ukraine' },
  '286': { ar: 'دوري نجوم قطر', en: 'Qatar Stars League' },
  '290': { ar: 'كأس الأمير قطر', en: 'Qatar Cup' },
  '292': { ar: 'الدوري الكوري', en: 'K League 1' },
  '293': { ar: 'الدوري الكوري الثاني', en: 'K League 2' },
  '301': { ar: 'دوري أدنوك', en: 'UAE Pro League' },
  '307': { ar: 'دوري روشن', en: 'Saudi Pro League' },
  '323': { ar: 'دوري أبطال آسيا - النخبة', en: 'AFC Champions League Elite' },
  '340': { ar: 'الدوري المنغولي الممتاز', en: 'Mongolian Premier League' },
  '383': { ar: 'الدوري الإيراني', en: 'Persian Gulf Pro League' },
  '384': { ar: 'دوري الدرجة الأولى الإيراني', en: 'Azadegan League' },
  '480': { ar: 'دوري أبطال أفريقيا', en: 'CAF Champions League' },
  '481': { ar: 'كأس الاتحاد الأفريقي', en: 'CAF Confederation Cup' },
  '484': { ar: 'كأس الأمم الأفريقية', en: 'AFCON Qualifiers' },
  '529': { ar: 'دوري أبطال آسيا', en: 'AFC Champions League' },
  '530': { ar: 'كأس الاتحاد الآسيوي', en: 'AFC Cup' },
  '667': { ar: 'مباريات ودية للأندية', en: 'Club Friendlies' },
  '848': { ar: 'دوري المؤتمر الأوروبي', en: 'UEFA Europa Conference League' },
  '890': { ar: 'دوري الأمم الأفريقية', en: 'AFCON' },
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
  '41': 'England',
  '42': 'England',
  '45': 'England',
  '48': 'England',
  '61': 'France',
  '62': 'France',
  '66': 'France',
  '71': 'Brazil',
  '73': 'Brazil',
  '78': 'Germany',
  '79': 'Germany',
  '81': 'Germany',
  '88': 'Netherlands',
  '89': 'Netherlands',
  '94': 'Portugal',
  '95': 'Portugal',
  '98': 'Japan',
  '99': 'Japan',
  '103': 'Norway',
  '113': 'Sweden',
  '128': 'Argentina',
  '130': 'Argentina',
  '135': 'Italy',
  '136': 'Italy',
  '137': 'Italy',
  '140': 'Spain',
  '141': 'Spain',
  '143': 'Spain',
  '144': 'Belgium',
  '169': 'China',
  '179': 'Scotland',
  '197': 'Greece',
  '203': 'Turkey',
  '207': 'Romania',
  '218': 'Russia',
  '233': 'Egypt',
  '253': 'USA',
  '262': 'Mexico',
  '264': 'Colombia',
  '265': 'Chile',
  '271': 'Denmark',
  '283': 'Ukraine',
  '286': 'Qatar',
  '290': 'Qatar',
  '292': 'South Korea',
  '293': 'South Korea',
  '301': 'United Arab Emirates',
  '307': 'Saudi-Arabia',
  '323': 'World',
  '340': 'Mongolia',
  '383': 'Iran',
  '384': 'Iran',
  '480': 'World',
  '481': 'World',
  '484': 'World',
  '529': 'World',
  '530': 'World',
  '667': 'World',
  '848': 'World',
  '890': 'World',
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
  '1': 'الأولى', '2': 'الثانية', '3': 'الثالثة', '4': 'الرابعة',
  '5': 'الخامسة', '6': 'السادسة', '7': 'السابعة', '8': 'الثامنة',
  '9': 'التاسعة', '10': 'العاشرة', '11': 'الحادية عشرة', '12': 'الثانية عشرة',
  '13': 'الثالثة عشرة', '14': 'الرابعة عشرة', '15': 'الخامسة عشرة',
  '16': 'السادسة عشرة', '17': 'السابعة عشرة', '18': 'الثامنة عشرة',
  '19': 'التاسعة عشرة', '20': 'العشرون', '21': 'الحادية والعشرون',
  '22': 'الثانية والعشرون', '23': 'الثالثة والعشرون', '24': 'الرابعة والعشرون',
  '25': 'الخامسة والعشرون', '26': 'السادسة والعشرون', '27': 'السابعة والعشرون',
  '28': 'الثامنة والعشرون', '29': 'التاسعة والعشرون', '30': 'الثلاثون',
  '31': 'الحادية والثلاثون', '32': 'الثانية والثلاثون', '33': 'الثالثة والثلاثون',
  '34': 'الرابعة والثلاثون', '35': 'الخامسة والثلاثون', '36': 'السادسة والثلاثون',
  '37': 'السابعة والثلاثون', '38': 'الثامنة والثلاثون',
};

function arabicOrdinal(n: string) {
  const parsed = Number.parseInt(n, 10);
  return ARABIC_ORDINAL[String(parsed)] || String(parsed);
}


export function localizeRoundName(locale: string, raw?: string | null) {
  const value = (raw || '').trim();
  if (!value) return '';
  if (locale !== 'ar') return value;

  // Already Arabic — return as-is
  if (/[\u0600-\u06FF]/.test(value)) return value;

  // Group - 1 - 6 => المجموعة 1 — الجولة 6
  const groupDuelMatch = value.match(/^group[\s_-]*(\d+)[\s_-]*(\d+)$/i);
  if (groupDuelMatch) return `المجموعة ${groupDuelMatch[1]} — الجولة ${arabicOrdinal(groupDuelMatch[2])}`;

  // Group A / Group B (letter groups)
  const groupLetterMatch = value.match(/^group[\s_-]*([A-Z])$/i);
  if (groupLetterMatch) return `المجموعة ${groupLetterMatch[1].toUpperCase()}`;

  // Regular Season - 14
  const regMatch = value.match(/^regular[\s_-]*season[\s_-]*(\d+)$/i);
  if (regMatch) return `الجولة ${arabicOrdinal(regMatch[1])}`;

  // Matchweek 5 / Week 5
  const weekMatch = value.match(/^(?:matchweek|week)[\s_-]*(\d+)$/i);
  if (weekMatch) return `الجولة ${arabicOrdinal(weekMatch[1])}`;

  // Round of 32 / 64
  const roundOfMatch = value.match(/^round\s+of\s+(\d+)$/i);
  if (roundOfMatch) return `دور الـ${roundOfMatch[1]}`;

  const staged = value
    .replace(/\bknockout play-?offs?\b/gi, 'الملحق')
    .replace(/\bplay-?off round\b/gi, 'الملحق')
    .replace(/\b2nd leg\b/gi, 'الإياب')
    .replace(/\b1st leg\b/gi, 'الذهاب')
    .replace(/\bfirst leg\b/gi, 'الذهاب')
    .replace(/\bsecond leg\b/gi, 'الإياب')
    .replace(/\bextra time\b/gi, 'الوقت الإضافي')
    .replace(/\bpenalty[\s-]shootout\b/gi, 'ركلات الترجيح')
    .replace(/\bround of 64\b/gi, 'دور الـ64')
    .replace(/\bround of 32\b/gi, 'دور الـ32')
    .replace(/\bround of 16\b/gi, 'دور الـ16')
    .replace(/\beighth-?finals?\b/gi, 'دور الـ16')
    .replace(/\bquarter-?finals?\b/gi, 'ربع النهائي')
    .replace(/\bsemi-?finals?\b/gi, 'نصف النهائي')
    .replace(/\bthird.?place\b/gi, 'مباراة الثالث')
    .replace(/\bleague stage\b/gi, 'مرحلة الدوري')
    .replace(/\bgroup stage\b/gi, 'دور المجموعات')
    .replace(/\bregular season\b/gi, 'الموسم العادي')
    .replace(/\bqualifying round\b/gi, 'دور التأهل')
    .replace(/\bqualification\b/gi, 'التصفيات')
    .replace(/\bpreliminaries\b/gi, 'الأدوار التمهيدية')
    .replace(/\bpreliminary round\b/gi, 'الدور التمهيدي')
    .replace(/\bmatchday\s*(\d+)\b/gi, (_all, n: string) => `الجولة ${arabicOrdinal(n)}`)
    .replace(/\bround\s+(\d+)\b/gi, (_all, n: string) => `الجولة ${arabicOrdinal(n)}`)
    .replace(/\bweek\s+(\d+)\b/gi, (_all, n: string) => `الجولة ${arabicOrdinal(n)}`)
    .replace(/\s*[-–]\s*(\d+)\s*$/u, (_all, n: string) => ` – الجولة ${arabicOrdinal(n)}`)
    .replace(/\bplay-?offs?\b/gi, 'الملحق')
    .replace(/\bknockout\b/gi, 'الأدوار الإقصائية')
    .replace(/^finals?$/i, 'النهائي')
    .replace(/\bgrand final\b/gi, 'النهائي الكبير');
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
    // Hungarian league tiers
    if (/^nb\s*iii\b/i.test(official)) {
      const region = official.match(/southeast|southwest|northeast|northwest/i);
      const regAr = region ? (region[0].toLowerCase() === 'southeast' ? 'الجنوب الشرقي' : region[0].toLowerCase() === 'southwest' ? 'الجنوب الغربي' : region[0].toLowerCase() === 'northeast' ? 'الشمال الشرقي' : 'الشمال الغربي') : '';
      return regAr ? `دوري الدرجة الثالثة المجري — ${regAr}` : 'دوري الدرجة الثالثة المجري';
    }
    if (/^nb\s*ii\b/i.test(official)) return 'دوري الدرجة الثانية المجري';
    if (/^nb\s*i\b/i.test(official)) return 'الدوري المجري الممتاز';
    // Youth leagues (e.g. 1. Liga U19)
    if (/\bu-?19\b/i.test(official)) {
      return countryAr ? `دوري ${countryAr} تحت 19 سنة` : 'دوري تحت 19 سنة';
    }
    if (/\bu-?21\b/i.test(official)) {
      return countryAr ? `دوري ${countryAr} تحت 21 سنة` : 'دوري تحت 21 سنة';
    }
  }

  return localizePlainName(locale, official);
}
