import { NextResponse } from 'next/server';
import { parseM3U } from '../../../../lib/playlist/m3u.js';
import { buildXtreamPlaylistUrl, normalizeXtreamServer } from '../../../../lib/playlist/xtream.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const baseUrl = normalizeXtreamServer(body);
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');
    if (!baseUrl || !username || !password || !/^https?:\/\//i.test(baseUrl)) {
      return NextResponse.json({ error: 'Serveur ou identifiants Xtream invalides.' }, { status: 400 });
    }

    const url = buildXtreamPlaylistUrl(baseUrl, username, password);
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'StreamTV/1.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return NextResponse.json({ error: `Le serveur Xtream répond avec HTTP ${response.status}.` }, { status: 400 });

    const text = await response.text();
    const items = parseM3U(text).slice(0, 10000);
    if (!items.length) return NextResponse.json({ error: 'Le serveur Xtream a répondu, mais aucune chaîne ou contenu n’a été trouvé.' }, { status: 400 });
    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Le serveur Xtream met trop de temps à répondre.'
      : error?.message || 'Impossible de récupérer le compte Xtream.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
