import { describe, expect, it } from 'vitest';
import { getNativePlaybackUrl, isHttpStream } from '../../lib/player/runtime.js';

describe('native playback routing', () => {
  it('recognizes HTTP IPTV sources', () => {
    expect(isHttpStream('http://provider.example/live/1.ts')).toBe(true);
    expect(isHttpStream('https://provider.example/live/1.m3u8')).toBe(false);
  });

  it('unwraps an existing StreamTV proxy URL for native direct playback', () => {
    expect(getNativePlaybackUrl('/api/stream?url=http%3A%2F%2Fprovider.example%2Flive%2F1.ts'))
      .toBe('http://provider.example/live/1.ts');
  });
});
