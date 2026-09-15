import { describe, expect, it } from 'vitest';
import { toXtreamPlaybackUrl } from '../../lib/playlist/xtream.js';

describe('Xtream live playback format', () => {
  it('keeps the native .ts live endpoint instead of forcing .m3u8', () => {
    expect(toXtreamPlaybackUrl('http://provider.example/live/user/pass/123.ts', 'live'))
      .toBe('http://provider.example/live/user/pass/123.ts');
  });

  it('does not alter non-live playback URLs', () => {
    expect(toXtreamPlaybackUrl('http://provider.example/movie/user/pass/123.mp4', 'movie'))
      .toBe('http://provider.example/movie/user/pass/123.mp4');
  });
});
