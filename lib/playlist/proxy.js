export function toDirectPlaybackUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  return /^https:\/\//i.test(value) ? value : null;
}

export function toProxyStreamUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  return toDirectPlaybackUrl(value) || `/api/stream?url=${encodeURIComponent(value)}`;
}

export function toPlaybackUrl(sourceUrl) {
  return toProxyStreamUrl(sourceUrl);
}

export function shouldRedirectToSource(status, protocol) {
  return Number(status) === 511 && protocol === 'https:';
}
