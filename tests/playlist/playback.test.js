import { describe, expect, it } from 'vitest';
import { toXtreamPlaybackUrl } from '../../lib/playlist/xtream.js';

describe('Xtream playback URLs', () => {
  it('uses HLS for live streams so mobile Safari can play them', () => {
    expect(toXtreamPlaybackUrl('http://provider.example/live/user/pass/123.ts', 'live')).toBe('http://provider.example/live/user/pass/123.m3u8');
  });

  it('keeps movie URLs unchanged', () => {
    expect(toXtreamPlaybackUrl('http://provider.example/movie/user/pass/456.mp4', 'movie')).toBe('http://provider.example/movie/user/pass/456.mp4');
  });
});
