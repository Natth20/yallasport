import { prisma } from './src/lib/prisma';

async function top() {
  const stars = await prisma.player.findMany({
    where: {
      OR: [
        { name: { contains: 'Haaland', mode: 'insensitive' } },
        { name: { contains: 'Mbappe', mode: 'insensitive' } },
        { name: { contains: 'Yamal', mode: 'insensitive' } },
        { name: { contains: 'Bellingham', mode: 'insensitive' } },
        { name: { contains: 'Vinicius', mode: 'insensitive' } },
        { name: { contains: 'Salah', mode: 'insensitive' } },
        { name: { contains: 'Ronaldo', mode: 'insensitive' } },
        { name: { contains: 'Messi', mode: 'insensitive' } },
        { name: { contains: 'Kane', mode: 'insensitive' } },
        { name: { contains: 'Rodri', mode: 'insensitive' } },
      ],
    },
    select: { name: true, photoUrl: true, position: true, nationality: true, teams: { select: { team: { select: { name: true } } } } },
    take: 10,
  });

  const topCoaches = await prisma.coach.findMany({
    select: { name: true, photoUrl: true, nationality: true, currentTeam: { select: { name: true } } },
    take: 10,
  });

  console.log('STARS:', JSON.stringify({ stars, topCoaches }, null, 2));
}

top().then(() => process.exit(0));
