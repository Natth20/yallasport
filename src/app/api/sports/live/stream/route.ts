import { redis } from '@/lib/redis';
import type { LiveMatchesPayload } from '@/lib/sports-data/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

export async function GET(request: Request) {
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      let previousSyncedAt: string | null = null;

      const close = () => {
        if (closed) return;
        closed = true;
        clearTimer();
        try {
          controller.close();
        } catch {
          // already closed by the runtime / client disconnect
        }
      };

      const send = (event: string, data: unknown) => {
        if (closed || request.signal.aborted) return false;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          return true;
        } catch {
          closed = true;
          clearTimer();
          return false;
        }
      };

      const wait = (ms: number) =>
        new Promise<void>((resolve) => {
          clearTimer();
          timer = setTimeout(() => {
            timer = null;
            resolve();
          }, ms);
        });

      const onAbort = () => close();
      request.signal.addEventListener('abort', onAbort);

      try {
        if (!send('connected', { serverTime: new Date().toISOString() })) return;

        while (!closed && !request.signal.aborted) {
          try {
            const payload = await redis.get<LiveMatchesPayload>('sports:live:all');
            if (closed || request.signal.aborted) break;

            if (payload?.freshness.syncedAt && payload.freshness.syncedAt !== previousSyncedAt) {
              previousSyncedAt = payload.freshness.syncedAt;
              if (!send('matches', payload)) break;
            } else if (
              !send('heartbeat', {
                serverTime: new Date().toISOString(),
                syncedAt: previousSyncedAt,
              })
            ) {
              break;
            }
          } catch {
            if (closed || request.signal.aborted) break;
            if (!send('error', { message: 'Live data temporarily unavailable' })) break;
            await wait(15000);
            continue;
          }
          await wait(10000);
        }
      } catch {
        // Client disconnected mid-stream — do not rethrow (avoids "destination stream closed early")
      } finally {
        request.signal.removeEventListener('abort', onAbort);
        close();
      }
    },
    cancel() {
      closed = true;
      clearTimer();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
