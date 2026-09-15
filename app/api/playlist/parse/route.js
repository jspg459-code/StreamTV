import { NextResponse } from 'next/server';
import { parseM3U } from '../../../../lib/playlist/m3u.js';
import { toPlaybackUrl } from '../../../../lib/playlist/proxy.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const url = String(body?.url || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'URL M3U/M3U8 invalide.' }, { status: 400 });
    const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'StreamTV/1.0' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return NextResponse.json({ error: `La playlist répond avec HTTP ${response.status}.` }, { status: 400 });
    const text = await response.text();
    if (!text.includes('#EXTINF')) return NextResponse.json({ error: 'Le contenu ne ressemble pas à une playlist M3U valide.' }, { status: 400 });
    const items = parseM3U(text).slice(0, 10000).map(item => ({ ...item, streamUrl: toPlaybackUrl(item.streamUrl) }));
    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Impossible de récupérer la playlist.' }, { status: 500 });
  }
}
