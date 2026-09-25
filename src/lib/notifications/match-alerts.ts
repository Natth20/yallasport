import { fansOfMatch, deliverPush, prefers, reserveOnce, release } from '@/lib/notifications/deliver';

type MatchRow = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number | null;
  awayScore: number | null;
};

export async function alertMatchFans(
  match: MatchRow,
  kind: 'GOAL' | 'MATCH_START' | 'MATCH_END',
  payload: { title: string; body: string; tag: string; entityId: string }
) {
  const pref = kind === 'GOAL' ? 'goal' : kind === 'MATCH_START' ? 'matchStart' : 'matchEnd';
  const fans = await fansOfMatch(match);

  for (const [userId, fan] of fans) {
    if (!prefers(fan.prefs, pref)) continue;
    const dedupKey = `notification:${kind.toLowerCase()}:${match.id}:${payload.entityId}:${userId}`;
    const reserved = await reserveOnce(dedupKey, kind === 'GOAL' ? 172800 : 86400);
    if (!reserved) continue;

    const ok = await deliverPush(
      userId,
      fan.subscriptions,
      {
        title: payload.title,
        body: payload.body,
        url: `/ar/match/${match.id}`,
        tag: payload.tag,
      },
      {
        type: kind,
        entityType: kind === 'GOAL' ? 'MATCH_EVENT' : 'MATCH',
        entityId: payload.entityId,
        matchId: match.id,
      }
    );
    if (!ok) await release(dedupKey);
  }
}
