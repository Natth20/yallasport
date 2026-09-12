import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const counts = {
  Team: await prisma.team.count(),
  Match: await prisma.match.count(),
  League: await prisma.league.count(),
  Player: await prisma.player.count(),
  Coach: await prisma.coach.count(),
  News: await prisma.news.count(),
  Channel: await prisma.channel.count(),
};

console.log(JSON.stringify(counts, null, 2));
await prisma.$disconnect();
