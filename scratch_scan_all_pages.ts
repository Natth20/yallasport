async function testPage(url: string): Promise<{ url: string; status: number; durationMs: number; ok: boolean; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'PagePerformanceScanner/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });
    const durationMs = Date.now() - start;
    return {
      url,
      status: res.status,
      durationMs,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err: any) {
    return {
      url,
      status: 0,
      durationMs: Date.now() - start,
      ok: false,
      error: err?.message || String(err),
    };
  }
}

async function run() {
  const base = 'http://localhost:3000';
  const routes = [
    '/ar',
    '/en',
    '/ar/matches',
    '/ar/live',
    '/ar/leagues',
    '/ar/teams',
    '/ar/team/real-madrid',
    '/ar/team/barcelona',
    '/ar/team/fluminense-124',
    '/ar/team/vasco-da-gama-133',
    '/ar/players',
    '/ar/player/lionel-messi',
    '/ar/player/cristiano-ronaldo',
    '/ar/player/davi-wanderley-silva-40680',
    '/ar/coaches',
    '/ar/coach/jose-mourinho',
    '/ar/coach/carlo-ancelotti',
    '/ar/coach/t-aaroy',
    '/ar/news',
    '/ar/transfers',
    '/ar/stats',
    '/ar/tv-guide',
    '/ar/channels',
    '/ar/channel/bein-sports-1',
    '/ar/compare',
    '/ar/compare-players',
    '/ar/map',
    '/ar/leaderboard',
    '/ar/photos',
    '/ar/videos',
    '/ar/vod',
    '/ar/watch',
    '/ar/social',
    '/ar/reels',
    '/ar/favorites',
    '/ar/search?q=madrid',
    '/ar/about',
    '/ar/contact',
    '/ar/cookies',
    '/ar/copyright',
    '/ar/privacy',
    '/ar/terms',
    '/ar/demo',
    '/ar/login',
    '/ar/register',
    '/ar/forgot-password',
    '/ar/settings',
    '/ar/profile',
    '/ar/subscribe',
    '/ar/report',
    '/ar/events',
    '/ar/follow',
  ];

  console.log(`Starting comprehensive audit of ${routes.length} pages...`);

  const results: any[] = [];
  for (const r of routes) {
    const fullUrl = `${base}${r}`;
    const res = await testPage(fullUrl);
    results.push(res);
    const speedBadge = res.durationMs < 300 ? '⚡ FAST' : res.durationMs < 1000 ? '✅ OK' : '⏳ SLOW';
    console.log(`[${res.status}] ${res.ok ? 'SUCCESS' : 'FAILED'} ${speedBadge} (${res.durationMs}ms) - ${r}${res.error ? ` - Error: ${res.error}` : ''}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  const avgMs = Math.round(results.reduce((a, b) => a + b.durationMs, 0) / results.length);

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`Passed (HTTP 200/3xx): ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Average Latency: ${avgMs}ms`);

  if (failed.length > 0) {
    console.log('\nFailed routes:');
    failed.forEach((f) => console.log(`- ${f.url} (status: ${f.status}, error: ${f.error || 'N/A'})`));
  }
}

run().catch(console.error);
