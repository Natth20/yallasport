export type ThemePreference = 'light' | 'dark';

export const THEME_COOKIE = 'yalla-theme';
export const THEME_STORAGE_KEY = 'yalla-theme';

export function parseTheme(value: string | null | undefined): ThemePreference {
  return value === 'light' ? 'light' : 'dark';
}

export function themeClassName(theme: ThemePreference) {
  return `h-full scroll-smooth ${theme}`;
}
