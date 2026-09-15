import { describe, expect, it } from 'vitest';
import { shouldFetchOnRelayHost } from '../../lib/playlist/proxy.js';

describe('relay host routing', () => {
  it('fetches the HTTP source when the request is already on the Railway relay', () => {
    expect(shouldFetchOnRelayHost('streamtv-relay-production.up.railway.app')).toBe(true);
  });

  it('does not fetch the HTTP source directly on the frontend host', () => {
    expect(shouldFetchOnRelayHost('streamtv.example.com')).toBe(false);
  });
});
