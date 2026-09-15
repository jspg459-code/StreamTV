import { NextResponse } from 'next/server';
import { buildLiveFallbackUrls, shouldRedirectToSource } from '../../../lib/playlist/proxy.js';

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

    // The frontend stores the HTTPS Railway relay URL for HTTP IPTV sources.
    // Therefore the relay itself must always fetch the upstream source directly.
    const headers = {
      'User-Agent': 'StreamTV/1.0',
      'Accept': '*/*',
    };
    const range = request.headers.get('range');
    if (range) headers.Range = range;

    const candidates = buildLiveFallbackUrls(target.toString());
    let upstream = null;
    let upstreamTarget = target;

    for (const candidate of candidates) {
      const candidateUrl = new URL(candidate);
      const response = await fetch(candidateUrl, {
        redirect: 'follow',
        headers,
        signal: AbortSignal.timeout(30000),
      });
      upstream = response;
      upstreamTarget = candidateUrl;
      if (response.ok || ![456, 511].includes(response.status)) break;
    }

    if (!upstream?.ok) {
      if (upstream && shouldRedirectToSource(upstream.status, upstreamTarget.protocol)) {
        return NextResponse.redirect(upstreamTarget.toString(), 307);
      }
      return new NextResponse(null, { status: upstream?.status || 502 });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isHls = /mpegurl|m3u8/i.test(contentType) || /\.m3u8(?:$|\?)/i.test(upstreamTarget.pathname + upstreamTarget.search);
    if (isHls) {
      const text = await upstream.text();
      return new NextResponse(rewriteM3u8(text, upstream.url || upstreamTarget.toString()), {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const responseHeaders = new Headers();
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'Le flux met trop de temps à répondre.' : 'Impossible de joindre le flux.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
