import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 90_000;

export interface PlaybackTokenPayload {
  assetId: string;
  userId: string;
  country: string | null;
  exp: number;
}

function secret() {
  return process.env.STREAM_TOKEN_SECRET || process.env.AUTH_SECRET || '';
}

function encode(input: string) {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string) {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

export function createPlaybackToken(input: Omit<PlaybackTokenPayload, 'exp'>, ttlMs = TOKEN_TTL_MS) {
  if (!secret()) throw new Error('STREAM_TOKEN_SECRET is not configured');
  const payload: PlaybackTokenPayload = {
    ...input,
    exp: Date.now() + ttlMs
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyPlaybackToken(token: string): PlaybackTokenPayload | null {
  if (!secret() || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PlaybackTokenPayload;
    if (!payload.assetId || !payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
