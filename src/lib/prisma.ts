import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from '@/generated/prisma';

const PRISMA_CLIENT_REVISION = 21;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWrapped: PrismaClient | undefined;
  prismaDirect: PrismaClient | undefined;
  prismaRevision: number | undefined;
};

const nestedQuery = new AsyncLocalStorage<boolean>();

let inFlight = 0;
let gateSize = 30;
const waiting: Array<() => void> = [];

function acquireGate() {
  if (inFlight < gateSize) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waiting.push(resolve));
}

function releaseGate() {
  const next = waiting.shift();
  if (next) next();
  else inFlight = Math.max(0, inFlight - 1);
}

async function withQueryGate<T>(run: () => Promise<T>): Promise<T> {
  if (nestedQuery.getStore()) return run();
  await acquireGate();
  try {
    return await nestedQuery.run(true, run);
  } finally {
    releaseGate();
  }
}

function withPoolLimits(raw: string | undefined, kind: 'app' | 'direct') {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname;
    const isSupabasePooler = host.includes('pooler.supabase.com');
    const isTransaction = url.port === '6543' || url.searchParams.get('pgbouncer') === 'true';
    const isSessionPooler = isSupabasePooler && !isTransaction;
    const isDev = process.env.NODE_ENV !== 'production';

    if (isTransaction) {
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('connection_limit', kind === 'direct' ? '5' : '35');
      gateSize = 35;
    } else if (isSessionPooler) {
      url.searchParams.set('connection_limit', kind === 'direct' ? '5' : '20');
      gateSize = 25;
    } else if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', isDev ? '20' : '35');
      gateSize = 35;
    }

    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15');
    url.searchParams.set('pool_timeout', '30');
    url.searchParams.set('sslmode', url.searchParams.get('sslmode') || 'require');
    return url.toString();
  } catch (error) {
    console.error('[caught:prisma.url]', error instanceof Error ? error.message : error);
    return raw;
  }
}

function createPrisma(rawUrl?: string, kind: 'app' | 'direct' = 'app') {
  const datasourceUrl = withPoolLimits(rawUrl ?? process.env.DATABASE_URL, kind);
  return new PrismaClient({
    log: ['error'],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });
}

function wrapPrisma(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      const name = String(prop);

      if (name === '$transaction') {
        return (...args: unknown[]) =>
          withQueryGate(() => (value as (...inner: unknown[]) => unknown).apply(target, args) as Promise<unknown>);
      }

      if (name.startsWith('$')) {
        return typeof value === 'function' ? value.bind(target) : value;
      }

      if (value && typeof value === 'object') {
        return new Proxy(value, {
          get(model, method, modelReceiver) {
            const fn = Reflect.get(model, method, modelReceiver);
            if (typeof fn !== 'function') return fn;
            return (...args: unknown[]) =>
              withQueryGate(() => Promise.resolve(fn.apply(model, args)));
          },
        });
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function resetClients() {
  void globalForPrisma.prisma?.$disconnect().catch((error) => {
    console.error('[caught:prisma.disconnect]', error instanceof Error ? error.message : error);
  });
  void globalForPrisma.prismaDirect?.$disconnect().catch((error) => {
    console.error('[caught:prismaDirect.disconnect]', error instanceof Error ? error.message : error);
  });
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaWrapped = undefined;
  globalForPrisma.prismaDirect = undefined;
}

function appDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.DIRECT_URL;
}

function getRawPrisma(): PrismaClient {
  if (globalForPrisma.prismaRevision !== PRISMA_CLIENT_REVISION) {
    resetClients();
    globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrisma(appDatabaseUrl(), 'app');
    globalForPrisma.prismaWrapped = wrapPrisma(globalForPrisma.prisma);
  }

  return globalForPrisma.prisma;
}

function getWrappedPrisma(): PrismaClient {
  return getRawPrisma();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getWrappedPrisma(), prop, receiver);
  },
});

export function getDirectPrisma() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return null;
  if (directUrl === appDatabaseUrl()) return getWrappedPrisma();

  if (globalForPrisma.prismaRevision !== PRISMA_CLIENT_REVISION) {
    resetClients();
    globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION;
  }

  globalForPrisma.prismaDirect ??= createPrisma(directUrl, 'direct');
  return globalForPrisma.prismaDirect;
}
