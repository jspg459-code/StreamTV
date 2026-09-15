export function normalizeXtreamServer(input = {}) {
  const value = input.server || input.baseUrl || '';
  return String(value).trim().replace(/\/+$/, '');
}

export function buildXtreamPlaylistUrl(baseUrl, username, password) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  return `${base}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;
}

export function buildXtreamApiUrl(baseUrl, username, password, action = '') {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  const query = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  return `${base}/player_api.php?${query}${action ? `&action=${encodeURIComponent(action)}` : ''}`;
}

export function toXtreamPlaybackUrl(streamUrl, type) {
  const value = String(streamUrl || '');
  if (type !== 'live') return value;
  return value;
}

function item(id, type, raw, streamUrl, group) {
  return { id: `${type}-${id}`, type, title: raw.name || 'Sans titre', group: group || raw.category_name || 'Autres', logo: raw.stream_icon || raw.cover || raw.cover_big || '', streamUrl: toXtreamPlaybackUrl(streamUrl, type), tvgId: raw.epg_channel_id || '' };
}

export function normalizeXtreamItems(payload, baseUrl) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const live = (payload?.live || []).map(x => item(x.stream_id, 'live', x, `${base}/live/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.ts`, x.category_name));
  const movies = (payload?.movies || []).map(x => item(x.stream_id, 'movie', x, `${base}/movie/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.${x.container_extension || 'mp4'}`, x.category_name));
  const series = (payload?.series || []).map(x => item(x.series_id, 'series', x, '', x.category_name));
  return [...live, ...movies, ...series];
}
