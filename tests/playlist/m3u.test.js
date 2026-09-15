import { describe, expect, it } from 'vitest';
import { parseM3U } from '../../lib/playlist/m3u.js';

describe('parseM3U', () => {
  it('parses channels and normalizes common IPTV attributes', () => {
    const input = `#EXTM3U\n#EXTINF:-1 tvg-id="tf1.fr" tvg-logo="https://example.com/tf1.png" group-title="France",TF1\nhttps://example.com/live/tf1.m3u8\n#EXTINF:-1 group-title="Films",My Movie\nhttps://example.com/movie.mp4`;
    const items = parseM3U(input);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: 'TF1', type: 'live', group: 'France', logo: 'https://example.com/tf1.png' });
    expect(items[1]).toMatchObject({ title: 'My Movie', type: 'movie', group: 'Films' });
  });

  it('classifies series from group metadata', () => {
    const input = `#EXTM3U\n#EXTINF:-1 group-title="Series | Action",The Agency S01E01\nhttps://example.com/episode.m3u8`;
    expect(parseM3U(input)[0].type).toBe('series');
  });
});
