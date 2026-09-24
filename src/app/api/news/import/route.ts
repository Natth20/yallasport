import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { importFromRSS } from '@/lib/news/rss-service';
import { TRUSTED_RSS_FEEDS } from '@/lib/news/trusted-sources';
import { auth } from '@/lib/auth/auth';
import { ratelimit } from '@/lib/redis';
import { clientIp, isSafeHttpUrl } from '@/lib/security/http';

export const POST = auth(async function POST(req) {
  const ip = clientIp(req);
  const { success } = await ratelimit.limit(`import_rss_${ip}`);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!req.auth || !['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'].includes((req.auth.user as { role?: string })?.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(swallow("src/app/api/news/import/route.ts:19", null, { persist: false }));
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const useDefaults = body?.allTrusted === true;

  try {
    if (useDefaults) {
      let imported = 0;
      for (const feed of TRUSTED_RSS_FEEDS) {
        const result = await importFromRSS(feed.url).catch(swallow("src/app/api/news/import/route.ts:27", ({ imported: 0 })));
        imported += result.imported;
      }
      return NextResponse.json({
        success: true,
        message: `Imported ${imported} stories from trusted feeds`,
        imported,
      });
    }

    if (!url || !isSafeHttpUrl(url)) {
      return NextResponse.json({ error: 'A trusted RSS URL is required' }, { status: 400 });
    }

    const result = await importFromRSS(url);
    return NextResponse.json({
      success: true,
      message: `Imported ${result.imported} stories for review`,
      imported: result.imported,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import news';
    console.error('RSS Import Error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
