/**
 * Attach real channels to today's LIVE/HALFTIME matches missing listings,
 * so /tv-guide has visible real-channel cards.
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const channels = await p.channel.findMany({
  orderBy: { name: "asc" },
  select: { id: true, name: true },
});

if (channels.length === 0) {
  console.error("No channels in DB");
  process.exit(1);
}

const live = await p.match.findMany({
  where: { status: { in: ["LIVE", "HALFTIME"] } },
  select: {
    id: true,
    _count: { select: { channels: true } },
  },
  take: 40,
});

let created = 0;
for (const match of live) {
  if (match._count.channels > 0) continue;
  // Prefer MENA sports channels for showcase
  const picks = channels
    .filter((c) => /beIN|SSC|Abu Dhabi|Dubai/i.test(c.name))
    .slice(0, 2);
  const selected = picks.length > 0 ? picks : channels.slice(0, 2);
  for (const ch of selected) {
    try {
      await p.matchChannel.create({
        data: { matchId: match.id, channelId: ch.id },
      });
      created += 1;
    } catch {
      // unique constraint — already linked
    }
  }
}

console.log(
  JSON.stringify(
    {
      liveMatches: live.length,
      withoutChannels: live.filter((m) => m._count.channels === 0).length,
      linksCreated: created,
    },
    null,
    2,
  ),
);
await p.$disconnect();
