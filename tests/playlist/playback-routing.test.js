import { describe, expect, it } from 'vitest';
import { toPlaybackUrl } from '../../lib/playlist/proxy.js';

describe('playback routing', () => {
  it('plays HTTPS streams directly and routes HTTP streams through StreamTV', () => {
    const https = 'https://provider.example/live/123.m3u8';
    const http = 'http://provider.example/live/123.ts';

    expect(toPlaybackUrl(https)).toBe(https);
    expect(toPlaybackUrl(http)).toBe(`/api/stream?url=${encodeURIComponent(http)}`);
  });
});
