import type {Locale} from './routing';

export function pick(locale: string, ar: string, en: string) {
  return locale === ('ar' satisfies Locale) ? ar : en;
}
