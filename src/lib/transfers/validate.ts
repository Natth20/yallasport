import { foldSearch } from '@/lib/search/text';
import { splitTransferType } from './fee';

export function looksLikePersonName(value?: string | null) {
  const name = (value || '').trim();
  if (!name) return false;
  if (/\b(fc|cf|sc|ac|united|city|real|sporting|club)\b/i.test(name)) return false;
  const parts = name.split(/\s+/);
  return parts.length >= 2 && parts.every((part) => /^[A-ZÀ-ÿ][a-zà-ÿ.'-]+$/.test(part) || /^[A-Z]\.$/.test(part));
}

export function validateTransferMove(input: {
  playerName: string;
  fromTeam?: string | null;
  toTeam?: string | null;
  date?: Date | null;
  type?: string | null;
}) {
  const from = input.fromTeam?.trim() || null;
  const to = input.toTeam?.trim() || null;
  if (!from && !to) return { ok: false as const, reason: 'missing-clubs' };
  if (from && to && foldSearch(from) === foldSearch(to)) return { ok: false as const, reason: 'same-club' };
  const player = foldSearch(input.playerName);
  if (to && (foldSearch(to) === player || looksLikePersonName(to))) {
    return { ok: false as const, reason: 'to-is-person' };
  }
  if (from && (foldSearch(from) === player || looksLikePersonName(from))) {
    return { ok: false as const, reason: 'from-is-person' };
  }
  if (!input.date || Number.isNaN(input.date.getTime())) return { ok: false as const, reason: 'bad-date' };
  splitTransferType(input.type);
  return { ok: true as const };
}

export function transferDedupeKey(input: {
  playerId: string;
  fromTeam?: string | null;
  toTeam?: string | null;
  date: Date;
  type?: string | null;
}) {
  const kind = splitTransferType(input.type).kind;
  return [input.playerId, foldSearch(input.fromTeam || ''), foldSearch(input.toTeam || ''), input.date.toISOString().slice(0, 10), kind].join('|');
}
