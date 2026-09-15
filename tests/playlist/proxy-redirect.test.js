import { describe, expect, it } from 'vitest';
import { shouldRedirectToSource } from '../../lib/playlist/proxy.js';

describe('proxy upstream fallback', () => {
  it('redirects HTTPS sources when the proxy upstream returns 511', () => {
    expect(shouldRedirectToSource(511, 'https:')).toBe(true);
  });

  it('does not redirect HTTP sources because that would create mixed content', () => {
    expect(shouldRedirectToSource(511, 'http:')).toBe(false);
  });

  it('does not redirect unrelated upstream errors', () => {
    expect(shouldRedirectToSource(403, 'https:')).toBe(false);
  });
});
