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
  'شرموط',
  'عرص',
  'زب',
  'نيك',
  'قحب',
  'spam',
  'advert',
  'promo code',
  'fuck',
  'f***',
  'shit',
  'bitch',
  'asshole',
  'slut',
];

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|me|tv|xyz|info|co)\b/i;
const REPEAT_CHAR_PATTERN = /(.)\1{7,}/;

export const CHAT_MIN_LENGTH = 2;
export const CHAT_MAX_LENGTH = 400;

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

  if (REPEAT_CHAR_PATTERN.test(cleanText)) {
    return { cleanText, isFlagged: true, reason: 'spam' };
  }

  for (const word of BANNED_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    if (regex.test(cleanText)) {
      return { cleanText, isFlagged: true, reason: 'profanity' };
    }
  }

  return { cleanText, isFlagged: false };
}
