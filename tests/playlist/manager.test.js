import { describe, expect, it } from 'vitest';
import { playlistPatch, mapPlaylistForDisplay } from '../../lib/playlist/manager.js';

describe('playlist manager', () => {
  it('toggles enabled state without changing unrelated fields', () => {
    expect(playlistPatch({ id: 'p1', enabled: true })).toEqual({ enabled: false });
    expect(playlistPatch({ id: 'p1', enabled: false })).toEqual({ enabled: true });
  });

  it('maps playlist metadata for the UI', () => {
    expect(mapPlaylistForDisplay({ id:'p1', name:'Maison', source_type:'m3u', enabled:true, last_synced_at:'2026-09-15T20:00:00Z' })).toEqual({
      id:'p1', name:'Maison', sourceType:'M3U', enabled:true, lastSyncedAt:'2026-09-15T20:00:00Z'
    });
  });
});
