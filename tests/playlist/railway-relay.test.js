import { describe, expect, it } from 'vitest';
import { toProxyStreamUrl } from '../../lib/playlist/proxy.js';

describe('Railway relay playback', () => {
  it('routes HTTP sources through the Railway relay', () => {
    expect(toProxyStreamUrl('http://iptv.example/live/channel.ts')).toBe(
      'https://streamtv-relay-production.up.railway.app/api/stream?url=http%3A%2F%2Fiptv.example%2Flive%2Fchannel.ts'
    );
  });

  it('keeps HTTPS sources direct', () => {
    expect(toProxyStreamUrl('https://cdn.example/live.m3u8')).toBe('https://cdn.example/live.m3u8');
  });
});
