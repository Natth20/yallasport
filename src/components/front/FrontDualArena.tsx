import { getLocale } from 'next-intl/server';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontTransfers } from '@/lib/front/load-transfers';
import { loadFrontTape } from '@/lib/front/load-tape';
import { FrontArenaClient } from './FrontArenaClient';

export async function FrontDualArena() {
  const locale = await getLocale();
  const [board, stories, transfers, tape] = await Promise.all([
    loadFrontBoard(locale),
    loadFrontStories(locale),
    loadFrontTransfers(locale),
    loadFrontTape(locale),
  ]);

  return (
    <FrontArenaClient
      locale={locale}
      matches={board}
      latestStory={stories.lead || stories.rest[0] || null}
      latestTransfer={transfers[0] || null}
      latestGoal={tape[0] || null}
    />
  );
}
