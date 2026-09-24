'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const ar = params?.locale !== 'en';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-bold text-orange-500">{ar ? 'عطل في الملعب' : 'A fault on the pitch'}</p>
      <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
        {ar ? 'ما قدرنا نفتح هالصفحة الآن' : 'This page could not be opened'}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
        {ar
          ? 'حصل خطأ أثناء جلب البيانات الحقيقية. أعد المحاولة أو ارجع إلى الملعب.'
          : 'Something went wrong while fetching live data. Try again or return to the pitch.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-white dark:bg-card dark:text-foreground"
        >
          {ar ? 'حاول مرة أخرى' : 'Try again'}
        </button>
        <Link
          href="/"
          className="rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold text-foreground"
        >
          {ar ? 'العودة إلى الملعب' : 'Back to the pitch'}
        </Link>
      </div>
    </div>
  );
}
