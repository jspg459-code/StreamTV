export function playlistPatch(playlist) {
  return { enabled: !Boolean(playlist?.enabled) };
}

export function mapPlaylistForDisplay(playlist) {
  return {
    id: playlist.id,
    name: playlist.name,
    sourceType: String(playlist.source_type || '').toUpperCase(),
    enabled: Boolean(playlist.enabled),
    lastSyncedAt: playlist.last_synced_at || null,
  };
}
