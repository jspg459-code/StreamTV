import { describe, expect, it } from 'vitest';
import { normalizeXtreamServer } from '../../lib/playlist/xtream.js';

describe('Xtream server normalization', () => {
  it('adds HTTP when the provider gives only a hostname', () => {
    expect(normalizeXtreamServer({ server: 'line.example.com:80/' }))
      .toBe('http://line.example.com:80');
  });

  it('preserves HTTPS and removes trailing slashes', () => {
    expect(normalizeXtreamServer({ server: 'https://line.example.com///' }))
      .toBe('https://line.example.com');
  });
});
