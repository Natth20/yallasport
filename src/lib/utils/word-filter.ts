/**
 * Content rules for match / news chat rooms.
 * Flagged content is rejected by the API (not silently softened).
 */

const BANNED_WORDS = [
  'سبام',
  'اعلان',
  'إعلان',
  'اشتراك مجاني',
  'مسيء',
  'كس ام',
  'كسم',
  'شرموط',
  'عرص',
  'زب',
  'نيك',
  'قحب',
  'قحبه',
  'قحبة',
  'ابن كلب',
  'يا كلب',
  'spam',
  'advert',
  'promo code',
  'buy followers',
  'fuck',
  'f***',
  'shit',
  'bitch',
  'asshole',
  'slut',
  'whore',
];

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|me|tv|xyz|info|co|site|click)\b/i;
const REPEAT_CHAR_PATTERN = /(.)\1{7,}/;
const REPEAT_WORD_PATTERN = /\b(\S+)(?:\s+\1){4,}\b/i;

export const CHAT_MIN_LENGTH = 2;
export const CHAT_MAX_LENGTH = 400;

export function normalizeChatText(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآاٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[0-9０-９]+/g, ' ')
    .replace(/[@$]/g, 's')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterContent(text: string): {
  cleanText: string;
  isFlagged: boolean;
  reason?: 'profanity' | 'link' | 'spam' | 'length';
} {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (cleanText.length < CHAT_MIN_LENGTH || cleanText.length > CHAT_MAX_LENGTH) {
    return { cleanText, isFlagged: true, reason: 'length' };
  }

  if (URL_PATTERN.test(cleanText)) {
    return { cleanText, isFlagged: true, reason: 'link' };
  }

  if (REPEAT_CHAR_PATTERN.test(cleanText) || REPEAT_WORD_PATTERN.test(cleanText) || /(..)\1{4,}/.test(cleanText.replace(/\s+/g, ''))) {
    return { cleanText, isFlagged: true, reason: 'spam' };
  }

  const normalized = normalizeChatText(cleanText);
  for (const word of BANNED_WORDS) {
    const needle = normalizeChatText(word);
    if (!needle) continue;
    if (normalized.includes(needle)) {
      return { cleanText, isFlagged: true, reason: 'profanity' };
    }
  }

  return { cleanText, isFlagged: false };
}
