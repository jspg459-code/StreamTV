import { describe, expect, it } from 'vitest';
import { toProxyStreamUrl } from '../../lib/playlist/proxy.js';

describe('proxy routing', () => {
  it('routes HTTP sources through the same-origin Vercel endpoint', () => {
    expect(toProxyStreamUrl('http://provider.example/live/channel.m3u8')).toBe('/api/stream?url=http%3A%2F%2Fprovider.example%2Flive%2Fchannel.m3u8');
  });

  it('keeps HTTPS sources direct', () => {
    expect(toProxyStreamUrl('https://provider.example/live/channel.m3u8')).toBe('https://provider.example/live/channel.m3u8');
  });
});
