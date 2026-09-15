import { describe, expect, it } from 'vitest';
import { buildLiveFallbackUrls } from '../../lib/playlist/proxy.js';

describe('live stream fallback', () => {
  it('tries TS when an M3U8 live URL is rejected', () => {
    expect(buildLiveFallbackUrls('http://provider.example/live/1.m3u8')).toEqual([
      'http://provider.example/live/1.m3u8',
      'http://provider.example/live/1.ts',
    ]);
  });

  it('keeps non-HLS URLs unchanged', () => {
    expect(buildLiveFallbackUrls('http://provider.example/live/1.ts')).toEqual([
      'http://provider.example/live/1.ts',
    ]);
  });
});
