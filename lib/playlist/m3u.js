const ATTR_RE = /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g;

function classify(group = '', title = '') {
  const value = `${group} ${title}`.toLowerCase();
  if (/\b(s\d{1,2}e\d{1,2}|season|saison|series|série|serie)\b/.test(value)) return 'series';
  if (/\b(movie|film|films|vod|cinema|cinéma)\b/.test(value)) return 'movie';
  return 'live';
}

export function parseM3U(text = '') {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const items = [];
  let pending = null;
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      const meta = comma >= 0 ? line.slice(0, comma) : line;
      const title = comma >= 0 ? line.slice(comma + 1).trim() : 'Sans titre';
      const attrs = {};
      let match;
      while ((match = ATTR_RE.exec(meta))) attrs[match[1]] = match[2] ?? match[3] ?? '';
      ATTR_RE.lastIndex = 0;
      pending = { title, group: attrs['group-title'] || 'Autres', logo: attrs['tvg-logo'] || '', tvgId: attrs['tvg-id'] || '', attrs };
    } else if (pending && !line.startsWith('#')) {
      const streamUrl = line;
      items.push({ id: `${pending.tvgId || pending.title}-${items.length}`, ...pending, streamUrl, type: classify(pending.group, pending.title) });
      pending = null;
    }
  }
  return items;
}
