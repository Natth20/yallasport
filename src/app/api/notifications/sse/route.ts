// src/app/api/notifications/sse/route.ts
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial keep-alive or message
      sendEvent({ type: 'connected', message: 'SSE stream established' });

      // In a real app, you would subscribe to a message queue or DB changes here
      const interval = setInterval(() => {
        // Mocking a live score update notification
        // sendEvent({ type: 'goal', matchId: '123', team: 'ريال مدريد', score: '1-0' });
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
