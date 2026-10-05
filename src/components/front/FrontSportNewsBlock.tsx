import { getLocale } from 'next-intl/server';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontSportNewsTabs } from './FrontSportNewsTabs';

export async function FrontSportNewsBlock() {
  const locale = await getLocale();
  const { lead, rest, latest } = await loadFrontStories(locale);
  const stories = [lead, ...rest, ...latest].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const unique = new Map(stories.map((row) => [row.id, row]));
  return <FrontSportNewsTabs locale={locale} stories={[...unique.values()]} />;
}
