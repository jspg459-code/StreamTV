import { NextResponse } from 'next/server';
import { parseM3U } from '../../../../lib/playlist/m3u.js';
import { buildXtreamApiUrl, buildXtreamPlaylistUrl, normalizeXtreamItems, normalizeXtreamServer, toXtreamPlaybackUrl } from '../../../../lib/playlist/xtream.js';
import { toProxyStreamUrl } from '../../../../lib/playlist/proxy.js';

const REQUEST_TIMEOUT_MS = 9000;

function getFetchOptions(timeoutMs = REQUEST_TIMEOUT_MS) {
  return {
    redirect: 'follow',
    headers: {
      'User-Agent': 'StreamTV/1.0',
      Accept: '*/*',
    },
    signal: AbortSignal.timeout(timeoutMs),
  };
}

function proxyItems(items) {
  return items.map(item => ({
    ...item,
    streamUrl: toProxyStreamUrl(toXtreamPlaybackUrl(item.streamUrl, item.type)),
  }));
}

async function fetchXtreamApi(baseUrl, username, password, action) {
  try {
    const response = await fetch(
      buildXtreamApiUrl(baseUrl, username, password, action),
      getFetchOptions(),
    );

    if (!response.ok) return { ok: false, status: response.status, data: null };

    try {
      return { ok: true, status: response.status, data: await response.json() };
    } catch {
      return { ok: false, status: response.status, data: null };
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      timeout: error?.name === 'TimeoutError' || error?.name === 'AbortError',
    };
  }
}

async function importViaPlayerApi(baseUrl, username, password) {
  const account = await fetchXtreamApi(baseUrl, username, password, 'get_account_info');
  if (!account.ok) return { items: null, status: account.status, timeout: account.timeout };

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
  if (items.length) return { items: proxyItems(items), status: 200, timeout: false };

  return {
    items: null,
    status: live.status || movies.status || series.status || 502,
    timeout: Boolean(live.timeout || movies.timeout || series.timeout),
  };
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

    // Try the lightweight Xtream API first. This avoids downloading a huge M3U file
    // and prevents a single expired AbortSignal from affecting later requests.
    const apiResult = await importViaPlayerApi(baseUrl, username, password);
    if (apiResult.items) {
      return NextResponse.json({ count: apiResult.items.length, items: apiResult.items });
    }

    // Some providers disable the player API but still expose get.php.
    try {
      const playlistResponse = await fetch(
        buildXtreamPlaylistUrl(baseUrl, username, password),
        getFetchOptions(12000),
      );

      if (playlistResponse.ok) {
        const text = await playlistResponse.text();
        const items = parseM3U(text).slice(0, 10000);
        if (items.length) {
          const proxied = proxyItems(items);
          return NextResponse.json({ count: proxied.length, items: proxied });
        }
      }
    } catch {
      // Return the more useful API error below when the M3U fallback also fails.
    }

    if (apiResult.timeout) {
      return NextResponse.json({
        error: 'Le serveur Xtream ne répond pas dans le délai imparti. Vérifie le serveur, son port ou contacte ton fournisseur.',
      }, { status: 504 });
    }

    if (apiResult.status >= 400) {
      return NextResponse.json({
        error: `Le serveur Xtream a refusé la connexion (HTTP ${apiResult.status}). Vérifie l’adresse du serveur et tes identifiants.`,
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'Le serveur Xtream a répondu, mais aucun contenu n’a été trouvé.',
    }, { status: 400 });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Le serveur Xtream met trop de temps à répondre.'
      : error?.message || 'Impossible de récupérer le compte Xtream.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
