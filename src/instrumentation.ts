export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns');
    dns.setDefaultResultOrder('ipv4first');
    const { persistAlert } = await import('@/lib/ops/caught-persist');
    (globalThis as { __ysPersistCaught?: typeof persistAlert }).__ysPersistCaught = persistAlert;
  }
}
