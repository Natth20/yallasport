export function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  return req.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9_-]{8,64}$/i.test(value);
}

export function isSafeHttpUrl(raw: unknown) {
  if (typeof raw !== 'string' || raw.length > 2048) return false;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false;
  }

  if (
    /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return false;
  }

  return true;
}

export function isReplyEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length < 5 || email.length > 190) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isDeskPageRef(raw: unknown) {
  if (typeof raw !== 'string') return false;
  const value = raw.trim();
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//') && value.length <= 500 && !value.includes('\n')) {
    return true;
  }
  return isSafeHttpUrl(value);
}
