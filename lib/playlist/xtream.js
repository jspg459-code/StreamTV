export function normalizeXtreamServer(input = {}) {
  let value = String(input.server || input.baseUrl || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = `http://${value}`;
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function cleanBase(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '');
}

export function buildXtreamPlaylistUrl(baseUrl, username, password) {
  const base = cleanBase(baseUrl);
  return `${base}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;
}

export function buildXtreamApiUrl(baseUrl, username, password, action = '') {
  const base = cleanBase(baseUrl);
  const query = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  return `${base}/player_api.php?${query}${action ? `&action=${encodeURIComponent(action)}` : ''}`;
}

export function toXtreamPlaybackUrl(streamUrl, type) {
  return String(streamUrl || '');
}

function item(id, type, raw, streamUrl, group) {
  return { id: `${type}-${id}`, type, title: raw.name || 'Sans titre', group: group || raw.category_name || 'Autres', logo: raw.stream_icon || raw.cover || raw.cover_big || '', streamUrl: toXtreamPlaybackUrl(streamUrl, type), tvgId: raw.epg_channel_id || '' };
}

export function normalizeXtreamItems(payload, baseUrl) {
  const base = cleanBase(baseUrl);
  const live = (payload?.live || []).map(x => item(x.stream_id, 'live', x, `${base}/live/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.ts`, x.category_name));
  const movies = (payload?.movies || []).map(x => item(x.stream_id, 'movie', x, `${base}/movie/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.${x.container_extension || 'mp4'}`, x.category_name));
  const series = (payload?.series || []).map(x => item(x.series_id, 'series', x, '', x.category_name));
  return [...live, ...movies, ...series];
}
