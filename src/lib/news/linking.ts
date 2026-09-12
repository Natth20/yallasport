// src/lib/news/linking.ts
import { prisma } from '@/lib/prisma';

export async function linkContent(content: string) {
  const teams = await prisma.team.findMany({ select: { name: true, slug: true } });
  const players = await prisma.player.findMany({ select: { name: true, slug: true } });

  let linkedContent = content;

  // Replace names with links (Basic regex, avoid overlapping)
  teams.forEach(team => {
    const regex = new RegExp(`(${team.name})`, 'g');
    linkedContent = linkedContent.replace(regex, `<a href="/team/${team.slug}" class="text-orange-500 font-bold hover:underline">$1</a>`);
  });

  players.forEach(player => {
    const regex = new RegExp(`(${player.name})`, 'g');
    linkedContent = linkedContent.replace(regex, `<a href="/player/${player.slug}" class="text-orange-500 font-bold hover:underline">$1</a>`);
  });

  return linkedContent;
}
