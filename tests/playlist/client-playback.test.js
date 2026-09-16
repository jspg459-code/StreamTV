import { describe, expect, it } from 'vitest';
import { toProxyStreamUrl } from '../../lib/playlist/proxy.js';

describe('client playback URL normalization', () => {
  it('converts stored relative proxy URLs to the current relay', () => {
    expect(toProxyStreamUrl('/api/stream?url=http%3A%2F%2Fexample.com%2Flive%2F1.ts')).toBe('https://streamtv-relay-final-production.up.railway.app/api/stream?url=http%3A%2F%2Fexample.com%2Flive%2F1.ts');
  });
});
