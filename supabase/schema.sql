create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('m3u','m3u8','xtream')),
  source_url text,
  enabled boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  type text not null check (type in ('live','movie','series')),
  title text not null,
  group_name text,
  stream_url text not null,
  logo_url text,
  tvg_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (playlist_id, stream_url)
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, media_item_id)
);

create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  position_seconds integer not null default 0,
  watched_at timestamptz not null default now(),
  primary key (user_id, media_item_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.playlists enable row level security;
alter table public.media_items enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;
alter table public.user_preferences enable row level security;

create policy "Users manage own playlists" on public.playlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read media from own playlists" on public.media_items for select using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()));
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own history" on public.watch_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists media_items_playlist_idx on public.media_items(playlist_id);
create index if not exists media_items_type_idx on public.media_items(type);
create index if not exists media_items_title_idx on public.media_items using gin (to_tsvector('simple', title));
