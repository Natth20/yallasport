import { NextRequest, NextResponse } from 'next/server';
import { reportCaughtError } from '@/lib/ops/caught';
import { importFromRSS } from '@/lib/news/rss-service';
import { TRUSTED_RSS_FEEDS } from '@/lib/news/trusted-sources';
import { loadPhotoFrames } from '@/lib/photos/load-frames';
import { ratelimit } from '@/lib/redis';
import { clientIp } from '@/lib/security/http';

let lastIngest = 0;
let ingesting = false;
const INGEST_EVERY_MS = 8 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await ratelimit.limit(`media_photos_${ip}`);
  if (!success) return NextResponse.json({ frames: [] }, { status: 429 });

  const locale = new URL(req.url).searchParams.get('locale') === 'en' ? 'en' : 'ar';

  try {
    const now = Date.now();
    if (!ingesting && now - lastIngest > INGEST_EVERY_MS) {
      ingesting = true;
      lastIngest = now;
      void Promise.all(
        TRUSTED_RSS_FEEDS.slice(0, 6).map((feed) =>
          importFromRSS(feed.url).catch((error) => reportCaughtError('src/app/api/media/photos/route.ts:ingest', error)),
        ),
      ).finally(() => {
        ingesting = false;
      });
    }

    const frames = await loadPhotoFrames(locale);
    return NextResponse.json({ frames, fetchedAt: new Date().toISOString() });
  } catch (error) {
    reportCaughtError('src/app/api/media/photos/route.ts', error);
    return NextResponse.json({ frames: [] });
  }
}
