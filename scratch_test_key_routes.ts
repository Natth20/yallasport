async function test() {
  const routes = [
    '/ar/matches',
    '/ar/live',
    '/ar/team/real-madrid',
    '/ar/team/fluminense-124',
    '/ar/team/barcelona',
    '/ar/leagues',
    '/ar/teams',
    '/ar/demo',
    '/ar/player/lionel-messi',
    '/ar/player/davi-wanderley-silva-40680',
    '/ar/coach/jose-mourinho',
    '/ar/coach/t-aaroy',
    '/ar/news',
    '/ar/channels',
    '/ar/contact',
    '/ar/copyright',
  ];

  for (const r of routes) {
    const start = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:3000${r}`, {
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(20000),
      });
      const ms = Date.now() - start;
      const speed = ms < 400 ? '⚡ LIGHTNING FAST' : ms < 1500 ? '✅ FAST' : '⏳ COMPILING';
      console.log(`[${res.status}] ${speed} (${ms}ms) -> ${r}`);
    } catch (err: any) {
      console.log(`[ERR] (${Date.now() - start}ms) -> ${r}: ${err?.message || err}`);
    }
  }
}

test();
