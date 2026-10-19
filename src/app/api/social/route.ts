import { NextResponse } from 'next/server';
import { getPublishedSocialFeed, getSocialAccounts } from '@/lib/social/service';
import { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get('platform') || undefined) as SocialPlatform | undefined;
    const [accounts, feedPosts] = await Promise.all([
      getSocialAccounts(),
      getPublishedSocialFeed(platform, 35),
    ]);

    return NextResponse.json({
      accounts,
      feedPosts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch social feed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
