import { handlers } from "@/lib/auth/auth";
import { authRatelimit } from '@/lib/redis';
import { clientIp } from '@/lib/security/http';
import type { NextRequest } from 'next/server';

export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await authRatelimit.limit(`auth_post_${ip}`);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  return handlers.POST(req);
}

