import { describe, expect, it } from 'vitest';
import { toProxyStreamUrl } from '../../lib/playlist/proxy.js';

describe('stream proxy URLs', () => {
  it('wraps an authorized remote stream in the StreamTV proxy', () => {
    const source = 'http://provider.example/live/user/pass/123.m3u8';
    expect(toProxyStreamUrl(source)).toBe(`/api/stream?url=${encodeURIComponent(source)}`);
  });
});
