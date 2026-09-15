import { NextResponse } from 'next/server';

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '::1' || host === '127.0.0.1' || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) || host.endsWith('.local');
}

function proxyUrl(value) {
  return `/api/stream?url=${encodeURIComponent(value)}`;
}

function rewriteM3u8(text, sourceUrl) {
  return text.split(/\r?\n/).map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/gi, (_match, uri) => `URI="${proxyUrl(new URL(uri, sourceUrl).toString())}"`);
    }
    try {
      return proxyUrl(new URL(trimmed, sourceUrl).toString());
    } catch {
      return line;
    }
  }).join('\n');
}

export async function GET(request) {
  try {
    const source = request.nextUrl.searchParams.get('url');
    if (!source) return NextResponse.json({ error: 'Flux manquant.' }, { status: 400 });

    const target = new URL(source);
    if (!['http:', 'https:'].includes(target.protocol) || isBlockedHost(target.hostname)) {
      return NextResponse.json({ error: 'Source de flux refusée.' }, { status: 400 });
    }

    const headers = { 'User-Agent': 'StreamTV/1.0' };
    const range = request.headers.get('range');
    if (range) headers.Range = range;

    const upstream = await fetch(target, {
      redirect: 'follow',
      headers,
      signal: AbortSignal.timeout(30000),
    });
    if (!upstream.ok) return new NextResponse(null, { status: upstream.status });

    const contentType = upstream.headers.get('content-type') || '';
    const isHls = /mpegurl|m3u8/i.test(contentType) || /\.m3u8(?:$|\?)/i.test(target.pathname + target.search);
    if (isHls) {
      const text = await upstream.text();
      return new NextResponse(rewriteM3u8(text, target.toString()), {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const responseHeaders = new Headers();
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'Le flux met trop de temps à répondre.' : 'Impossible de joindre le flux.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
