const RAILWAY_RELAY_BASE = 'https://streamtv-relay-production.up.railway.app';

export function toDirectPlaybackUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  return /^https:\/\//i.test(value) ? value : null;
}

export function toProxyStreamUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  if (!value) return '';
  if (value.startsWith('/api/stream?')) {
    try {
      const nested = new URL(value, RAILWAY_RELAY_BASE).searchParams.get('url');
      if (nested) return toProxyStreamUrl(nested);
    } catch {}
  }
  const direct = toDirectPlaybackUrl(value);
  return direct || `${RAILWAY_RELAY_BASE}/api/stream?url=${encodeURIComponent(value)}`;
}

export function toPlaybackUrl(sourceUrl) {
  return toProxyStreamUrl(sourceUrl);
}

export function shouldRedirectToSource(status, protocol) {
  return Number(status) === 511 && protocol === 'https:';
}

export function buildLiveFallbackUrls(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  if (!/\.m3u8(?:$|\?)/i.test(value)) return value ? [value] : [];
  return [value, value.replace(/\.m3u8(?=($|\?))/i, '.ts')];
}
