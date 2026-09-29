import { NextRequest, NextResponse } from 'next/server';
import { reportCaughtError } from '@/lib/ops/caught';
import { ingestYoutubeClips, listYoutubeShelf } from '@/lib/youtube/ingest';
import { toYoutubeCards } from '@/lib/youtube/present';
import { ratelimit } from '@/lib/redis';
import { clientIp } from '@/lib/security/http';

let lastIngest = 0;
let ingesting = false;
const INGEST_EVERY_MS = 4 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await ratelimit.limit(`media_videos_${ip}`);
  if (!success) return NextResponse.json({ clips: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const kind = searchParams.get('kind') === 'SHORT' ? 'SHORT' : 'VIDEO';

  try {
    const now = Date.now();
    if (!ingesting && now - lastIngest > INGEST_EVERY_MS) {
      ingesting = true;
      lastIngest = now;
      void ingestYoutubeClips()
        .catch((error) => reportCaughtError('src/app/api/media/videos/route.ts:ingest', error))
        .finally(() => {
          ingesting = false;
        });
    }

    const clips = await listYoutubeShelf(kind, 48, locale);
    return NextResponse.json({
      clips: toYoutubeCards(clips, locale),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    reportCaughtError('src/app/api/media/videos/route.ts', error);
    return NextResponse.json({ clips: [] });
  }
}
