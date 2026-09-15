import { describe, expect, it } from 'vitest';
import { toDirectPlaybackUrl } from '../../lib/playlist/proxy.js';

describe('direct playback fallback', () => {
  it('allows HTTPS source URLs as a browser fallback', () => {
    expect(toDirectPlaybackUrl('https://provider.example/live/user/pass/123.m3u8')).toBe('https://provider.example/live/user/pass/123.m3u8');
  });

  it('does not expose HTTP streams to the browser', () => {
    expect(toDirectPlaybackUrl('http://provider.example/live/user/pass/123.ts')).toBe(null);
  });
});
