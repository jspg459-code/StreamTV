export function buildXtreamPlaylistUrl(baseUrl, username, password) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  return `${base}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;
}

function item(id, type, raw, streamUrl, group) {
  return { id: `${type}-${id}`, type, title: raw.name || 'Sans titre', group: group || raw.category_name || 'Autres', logo: raw.stream_icon || raw.cover || raw.cover_big || '', streamUrl, tvgId: raw.epg_channel_id || '' };
}

export function normalizeXtreamItems(payload, baseUrl) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const live = (payload?.live || []).map(x => item(x.stream_id, 'live', x, `${base}/live/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.ts`, x.category_name));
  const movies = (payload?.movies || []).map(x => item(x.stream_id, 'movie', x, `${base}/movie/${encodeURIComponent(x.username || '')}/${encodeURIComponent(x.password || '')}/${x.stream_id}.${x.container_extension || 'mp4'}`, x.category_name));
  const series = (payload?.series || []).map(x => item(x.series_id, 'series', x, '', x.category_name));
  return [...live, ...movies, ...series];
}
