import { NextResponse } from 'next/server';
import { parseM3U } from '../../../../lib/playlist/m3u.js';
import { buildXtreamPlaylistUrl } from '../../../../lib/playlist/xtream.js';

export async function POST(request) {
  try {
    const { baseUrl, username, password } = await request.json();
    if (!baseUrl || !username || !password || !/^https?:\/\//i.test(baseUrl)) return NextResponse.json({ error: 'Identifiants Xtream invalides.' }, { status: 400 });
    const url = buildXtreamPlaylistUrl(baseUrl, username, password);
    const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'StreamTV/1.0' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) return NextResponse.json({ error: `Le serveur Xtream répond avec HTTP ${response.status}.` }, { status: 400 });
    const text = await response.text();
    const items = parseM3U(text).slice(0, 10000);
    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Impossible de récupérer le compte Xtream.' }, { status: 500 });
  }
}
