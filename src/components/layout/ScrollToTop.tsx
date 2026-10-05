'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTop – يُعيد scroll الصفحة إلى الأعلى عند كل navigation.
 * يحل مشكلة "بتفتح الصفحة من الأسفل" التي تحدث بسبب scroll restoration
 * أو بسبب انتقالات Framer Motion التي تُبقي الـ scroll position.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // إعادة تعيين scroll position فوراً عند كل تغيير في المسار
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
