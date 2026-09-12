import { PrismaClient } from '@/generated/prisma';

const PRISMA_CLIENT_REVISION = 16;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDirect: PrismaClient | undefined;
  prismaRevision: number | undefined;
};

function withPoolLimits(raw: string | undefined) {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const pooled = url.port === '6543' || url.searchParams.get('pgbouncer') === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    // Session-mode poolers (Supabase 6543) cap total clients — never open a wide Prisma pool against them.
    if (pooled) {
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('connection_limit', '1');
      url.searchParams.set('sslmode', url.searchParams.get('sslmode') || 'require');
    } else if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', isDev ? '5' : '5');
    }

    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15');
    // Prefer waiting a bit longer over failing the whole page render.
    url.searchParams.set('pool_timeout', isDev ? '30' : '20');
    url.searchParams.set('sslmode', url.searchParams.get('sslmode') || 'require');
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrisma(rawUrl?: string) {
  const datasourceUrl = withPoolLimits(rawUrl ?? process.env.DATABASE_URL);
  return new PrismaClient({
    log: ['error'],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prismaRevision !== PRISMA_CLIENT_REVISION) {
    void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
    void globalForPrisma.prismaDirect?.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaDirect = undefined;
    globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION;
  }

  if (!globalForPrisma.prisma) {
    const url =
      process.env.NODE_ENV !== 'production' && process.env.DIRECT_URL
        ? process.env.DIRECT_URL
        : process.env.DATABASE_URL;
    globalForPrisma.prisma = createPrisma(url);
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function getDirectPrisma() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl || directUrl === process.env.DATABASE_URL) return null;
  globalForPrisma.prismaDirect ??= createPrisma(directUrl);
  return globalForPrisma.prismaDirect;
}
