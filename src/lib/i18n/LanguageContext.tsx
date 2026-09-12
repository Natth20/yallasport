// src/lib/i18n/LanguageContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import {useLocale, useMessages} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useLocale() as Language;
  const messages = useMessages() as Record<string, unknown>;
  const pathname = usePathname();
  const router = useRouter();

  const setLanguage = (lang: Language) => {
    router.replace(pathname, {locale: lang});
  };

  const t = (path: string, values?: Record<string, string | number>) => {
    const resolved = path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, messages);
    if (typeof resolved !== 'string') return path;
    if (!values) return resolved;
    return Object.entries(values).reduce(
      (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
      resolved
    );
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
