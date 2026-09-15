import { NextResponse } from 'next/server';
import { parseM3U } from '../../../../lib/playlist/m3u.js';
import { buildXtreamApiUrl, buildXtreamPlaylistUrl, normalizeXtreamItems, normalizeXtreamServer } from '../../../../lib/playlist/xtream.js';
import { toProxyStreamUrl } from '../../../../lib/playlist/proxy.js';

const fetchOptions = {
  redirect: 'follow',
  headers: { 'User-Agent': 'StreamTV/1.0' },
  signal: AbortSignal.timeout(20000),
};

function proxyItems(items) {
  return items.map(item => ({ ...item, streamUrl: toProxyStreamUrl(item.streamUrl) }));
}

async function fetchXtreamApi(baseUrl, username, password, action) {
  const response = await fetch(buildXtreamApiUrl(baseUrl, username, password, action), fetchOptions);
  if (!response.ok) return { ok: false, status: response.status, data: null };
  try {
    return { ok: true, status: response.status, data: await response.json() };
  } catch {
    return { ok: false, status: response.status, data: null };
  }
}

async function importViaPlayerApi(baseUrl, username, password) {
  const account = await fetchXtreamApi(baseUrl, username, password, 'get_account_info');
  if (!account.ok) return null;
  if (account.data?.user_info && account.data.user_info.auth === 0) {
    throw new Error('Les identifiants Xtream sont refusés par le serveur.');
  }

  const [live, movies, series] = await Promise.all([
    fetchXtreamApi(baseUrl, username, password, 'get_live_streams'),
    fetchXtreamApi(baseUrl, username, password, 'get_vod_streams'),
    fetchXtreamApi(baseUrl, username, password, 'get_series'),
  ]);

  const payload = {
    live: live.ok && Array.isArray(live.data) ? live.data.map(x => ({ ...x, username, password })) : [],
    movies: movies.ok && Array.isArray(movies.data) ? movies.data.map(x => ({ ...x, username, password })) : [],
    series: series.ok && Array.isArray(series.data) ? series.data : [],
  };

  const items = normalizeXtreamItems(payload, baseUrl).filter(x => x.streamUrl).slice(0, 10000);
  return items.length ? proxyItems(items) : null;
}

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
    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      const text = await response.text();
      const items = parseM3U(text).slice(0, 10000);
      if (items.length) return NextResponse.json({ count: items.length, items: proxyItems(items) });
    } else {
      const fallbackItems = await importViaPlayerApi(baseUrl, username, password);
      if (fallbackItems) return NextResponse.json({ count: fallbackItems.length, items: fallbackItems });
      return NextResponse.json({ error: `Le serveur Xtream répond avec HTTP ${response.status} et son API alternative n’a pas fourni de contenu.` }, { status: 400 });
    }

    const fallbackItems = await importViaPlayerApi(baseUrl, username, password);
    if (fallbackItems) return NextResponse.json({ count: fallbackItems.length, items: fallbackItems });
    return NextResponse.json({ error: 'Le serveur Xtream a répondu, mais aucune chaîne ou contenu lisible n’a été trouvé.' }, { status: 400 });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Le serveur Xtream met trop de temps à répondre.'
      : error?.message || 'Impossible de récupérer le compte Xtream.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
