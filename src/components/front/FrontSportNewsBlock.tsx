import { getLocale } from 'next-intl/server';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontSportNewsTabs } from './FrontSportNewsTabs';

export async function FrontSportNewsBlock() {
  const locale = await getLocale();
  const { lead, rest, latest } = await loadFrontStories(locale);
  // Exclude lead story so it doesn't repeat from the top hero / headlines
  const leadId = lead?.id;
  const stories = [...rest, ...latest].filter((row): row is NonNullable<typeof row> => Boolean(row) && row.id !== leadId);
  const unique = new Map(stories.map((row) => [row.id, row]));
  return <FrontSportNewsTabs locale={locale} stories={[...unique.values()]} />;
}
