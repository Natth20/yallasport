// src/components/layout/LanguageToggle.tsx
'use client';

import React from 'react';
import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const query = window.location.search.replace(/^\?/, '');
    router.replace(`${pathname}${query ? `?${query}` : ''}`, {
      locale: locale === 'ar' ? 'en' : 'ar'
    });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-orange-500 transition-all rounded-full bg-muted dark:bg-muted hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-transparent hover:border-orange-200"
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Languages className="w-4 h-4 text-orange-500" />
      <span className="text-[10px] font-black uppercase tracking-tighter">
        {locale === 'ar' ? 'English' : 'العربية'}
      </span>
    </button>
  );
};
