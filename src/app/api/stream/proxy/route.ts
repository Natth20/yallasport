import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetUrl,
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream failed: ${upstreamRes.status}`, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    const isM3u8 = targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegurl');

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Content-Type', contentType);

    if (isM3u8) {
      const text = await upstreamRes.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      
      // Rewrite relative URLs to route through proxy
      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          let absolute = trimmed;
          if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            absolute = new URL(trimmed, baseUrl).toString();
          }
          return `/api/stream/proxy?url=${encodeURIComponent(absolute)}`;
        })
        .join('\n');

      return new NextResponse(rewritten, { headers, status: 200 });
    }

    // Binary segment (ts/m4s)
    const blob = await upstreamRes.arrayBuffer();
    headers.set('Cache-Control', 'public, max-age=3600');
    return new NextResponse(blob, { headers, status: 200 });
  } catch (error) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}
