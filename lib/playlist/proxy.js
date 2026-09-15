export function toProxyStreamUrl(sourceUrl) {
  return `/api/stream?url=${encodeURIComponent(String(sourceUrl || ''))}`;
}
