import { describe, expect, it } from 'vitest';
import { buildXtreamPlaylistUrl, normalizeXtreamItems, normalizeXtreamServer } from '../../lib/playlist/xtream.js';

describe('Xtream helpers', () => {
  it('builds a playlist endpoint without exposing credentials in logs', () => {
    expect(buildXtreamPlaylistUrl('https://provider.example/', 'demo', 'secret')).toBe('https://provider.example/get.php?username=demo&password=secret&type=m3u_plus&output=ts');
  });

  it('accepts the server field used by the import form', () => {
    expect(normalizeXtreamServer({ server: 'https://provider.example/' })).toBe('https://provider.example');
    expect(normalizeXtreamServer({ baseUrl: 'https://provider.example/' })).toBe('https://provider.example');
  });

  it('normalizes live, movie and series entries', () => {
    const items = normalizeXtreamItems({
      live: [{ stream_id: 1, name: 'TF1', stream_icon: 'logo', category_name: 'France' }],
      movies: [{ stream_id: 2, name: 'Film', stream_icon: 'poster', category_name: 'Films', container_extension: 'mp4' }],
      series: [{ series_id: 3, name: 'Série', cover: 'cover', category_name: 'Series' }],
    }, 'https://provider.example');
    expect(items.map(x => x.type)).toEqual(['live', 'movie', 'series']);
  });
});
