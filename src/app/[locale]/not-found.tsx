import {Link} from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-card px-5 pb-24 text-center dark:bg-black sm:px-8">
      <p className="text-sm font-bold text-orange-500">{t('not_found')}</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight dark:text-foreground sm:text-6xl">{t('offside')}</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
        {t('not_found_description')}
      </p>

      <div className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-white dark:bg-card dark:text-foreground"
        >
          {t('back_home')}
        </Link>
        <Link
          href="/matches"
          className="rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold text-foreground dark:border-border dark:bg-card/[0.04] dark:text-muted-foreground"
        >
          {t('match_center')}
        </Link>
        <Link
          href="/search"
          className="rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold text-foreground dark:border-border dark:bg-card/[0.04] dark:text-muted-foreground"
        >
          {t('global_search')}
        </Link>
      </div>
    </div>
  );
}
