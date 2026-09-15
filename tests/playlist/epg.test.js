import { describe, expect, it } from 'vitest';
import { extractEpgUrl, parseXmltv } from '../../lib/playlist/epg.js';

describe('EPG helpers', () => {
  it('extracts url-tvg from an M3U header', () => {
    expect(extractEpgUrl('#EXTM3U url-tvg="https://guide.example/epg.xml"')).toBe('https://guide.example/epg.xml');
  });

  it('parses XMLTV programmes and groups them by channel', () => {
    const xml = `<tv><channel id="tf1"><display-name>TF1</display-name></channel><programme start="20260915200000 +0200" stop="20260915210000 +0200" channel="tf1"><title>Journal</title><desc>Actualités</desc></programme></tv>`;
    expect(parseXmltv(xml)).toEqual([{ channelId: 'tf1', start: '2026-09-15T18:00:00.000Z', stop: '2026-09-15T19:00:00.000Z', title: 'Journal', description: 'Actualités' }]);
  });
});
