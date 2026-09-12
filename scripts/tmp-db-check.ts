import { prisma, getDirectPrisma } from '../src/lib/prisma';

const id = 'cmtsqmej003s911ekoiakfuj6';

async function probe(label: string, client: typeof prisma) {
  try {
    const match = await client.match.findFirst({
      where: { OR: [{ id }, { externalId: id }] },
      select: { id: true, status: true, homeScore: true, awayScore: true },
    });
    console.log(label, match ? `${match.status} ${match.homeScore}-${match.awayScore}` : 'null');
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/\s+/g, ' ').slice(0, 120) : String(error);
    console.log(label, 'FAIL', message);
  }
}

async function main() {
  await probe('pooler', prisma);
  const direct = getDirectPrisma();
  if (direct) await probe('direct', direct);
  await prisma.$disconnect().catch(() => undefined);
  await direct?.$disconnect().catch(() => undefined);
}

main();
