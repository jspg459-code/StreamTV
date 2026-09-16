export function isHttpStream(sourceUrl) {
  return /^http:\/\//i.test(String(sourceUrl || '').trim());
}

export function getNativePlaybackUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value, 'https://streamtv.local');
    if (parsed.pathname === '/api/stream') {
      const nested = parsed.searchParams.get('url');
      if (nested) return decodeURIComponent(nested);
    }
  } catch {}

  return value;
}
