export function toProxyStreamUrl(sourceUrl) {
  return `/api/stream?url=${encodeURIComponent(String(sourceUrl || ''))}`;
}

export function toDirectPlaybackUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  return /^https:\/\//i.test(value) ? value : null;
}

export function shouldRedirectToSource(status, protocol) {
  return Number(status) === 511 && protocol === 'https:';
}
