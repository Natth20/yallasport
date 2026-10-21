export type PublicAdSlot = {
  id: string;
  placement: string;
  isActive: boolean;
  headline: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  html: string | null;
  adsenseSlot: string | null;
};

export const AD_PLACEMENTS = [
  { id: 'header-banner', ar: 'شريط أعلى الموقع', en: 'Site header' },
  { id: 'home-hero-bottom', ar: 'أسفل واجهة القمة بالرئيسية', en: 'Home below hero' },
  { id: 'home-mid', ar: 'منتصف الصفحة الرئيسية', en: 'Home mid-page' },
  { id: 'home-media', ar: 'أعلى قسم الفيديو والوسائط', en: 'Home above media' },
  { id: 'matches-top', ar: 'أعلى جدول المباريات', en: 'Matches top banner' },
  { id: 'matches-infeed', ar: 'بين سطور قائمة المباريات', en: 'Matches in-feed' },
  { id: 'article-inline', ar: 'داخل صفحة الخبر', en: 'Inside article' },
  { id: 'article-sidebar', ar: 'الشريط الجانبي للخبر', en: 'Article sidebar' },
  { id: 'match-rail', ar: 'صفحة المباراة', en: 'Match page' },
  { id: 'match-stats', ar: 'أسفل إحصائيات المباراة', en: 'Match stats bottom' },
  { id: 'leagues-banner', ar: 'صفحة ترتيب الدوريات', en: 'Leagues standings banner' },
  { id: 'teams-banner', ar: 'صفحة تفاصيل النادي', en: 'Team profile banner' },
  { id: 'players-banner', ar: 'صفحة تفاصيل اللاعب', en: 'Player profile banner' },
  { id: 'transfers-feed', ar: 'سوق الانتقالات والميركاتو', en: 'Transfers feed' },
  { id: 'tv-guide-banner', ar: 'دليل التلفزيون والقنوات', en: 'TV guide banner' },
  { id: 'footer-banner', ar: 'شريط أسفل الموقع', en: 'Site footer' },
] as const;

export type AdPlacementId = (typeof AD_PLACEMENTS)[number]['id'];

export function isAdPlacementId(value: string): value is AdPlacementId {
  return AD_PLACEMENTS.some((row) => row.id === value);
}

export function adsensePublisherId() {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || '';
  return /^ca-pub-\d+$/i.test(id) ? id : '';
}

export function isSafeAdHref(raw: string | null | undefined) {
  const value = (raw || '').trim();
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//') && value.length <= 500 && !value.includes('\n')) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeAdHtml(raw: string | null | undefined) {
  const value = (raw || '').trim();
  if (!value || value.length > 8000) return false;
  if (/<script|on\w+\s*=|javascript:|data:text\/html/i.test(value)) return false;
  return true;
}

export function isAdsenseSlotId(raw: string | null | undefined) {
  return /^\d{6,20}$/.test((raw || '').trim());
}
