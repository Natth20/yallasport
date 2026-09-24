import { timingSafeEqual } from 'crypto';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthorizedCron(req: Request) {
  const secret = process.env.CRON_SECRET?.trim() || '';
  const header = req.headers.get('authorization') || '';
  if (secret.length < 16) return false;
  return safeEqual(header, `Bearer ${secret}`);
}
