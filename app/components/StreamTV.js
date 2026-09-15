'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Home, Tv, Film, Clapperboard, Heart, ListVideo, Settings, Plus, Play, X, LogIn, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client.js';
import { demoItems, hero } from '../../lib/demo-data.js';

const nav = [
  ['home','Accueil',Home], ['live','TV en direct',Tv], ['movie','Films',Film], ['series','Séries',Clapperboard], ['favorites','Favoris',Heart], ['playlists','Mes playlists',ListVideo], ['settings','Paramètres',Settings]
];

function Card({ item, favorite, onFavorite, onPlay }) {
  return <article className="media-card">
    <button className="poster" onClick={() => onPlay(item)} aria-label={`Lire ${item.title}`}>
      <img src={item.logo || hero.image} alt="" /><span className="play"><Play size={17} fill="currentColor" /></span>
    </button>
    <button className={`heart ${favorite ? 'selected' : ''}`} onClick={() => onFavorite(item.id)} aria-label="Ajouter aux favoris"><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button>
    <div className="card-copy"><strong>{item.title}</strong><span>{item.subtitle || item.group}</span></div>
  </article>;
}

export default function StreamTV() {
  const [section, setSection] = useState('home');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(demoItems);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistModal, setPlaylistModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [playItem, setPlayItem] = useState(null);

  async function loadAccount(account) {
    if (!account) { setPlaylists([]); setItems(demoItems); setFavorites([]); return; }
    const [{ data: pls }, { data: favs }] = await Promise.all([
      supabase.from('playlists').select('*').eq('user_id', account.id).order('created_at', { ascending: false }),
      supabase.from('favorites').select('media_item_id').eq('user_id', account.id)
    ]);
    const ownedPlaylists = pls || [];
    setPlaylists(ownedPlaylists);
    const ids = (favs || []).map(x => x.media_item_id);
    setFavorites(ids);
    if (ownedPlaylists.length) {
      const { data: media } = await supabase.from('media_items').select('*').in('playlist_id', ownedPlaylists.map(x => x.id)).limit(10000);
      setItems((media || []).map(x => ({ id:x.id, title:x.title, group:x.group_name, logo:x.logo_url || hero.image, tvgId:x.tvg_id, streamUrl:x.stream_url, type:x.type, playlistId:x.playlist_id })));
    } else setItems(demoItems);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { const account = data.user || null; setUser(account); loadAccount(account); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { const account = session?.user || null; setUser(account); loadAccount(account); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const visible = useMemo(() => {
    let result = items;
    if (section === 'live' || section === 'movie' || section === 'series') result = result.filter(x => x.type === section);
    if (section === 'favorites') result = result.filter(x => favorites.includes(x.id));
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter(x => `${x.title} ${x.group} ${x.subtitle || ''}`.toLowerCase().includes(q)); }
    return result;
  }, [items, section, favorites, search]);

  async function toggleFavorite(id) {
    if (!user) { setAuthModal(true); return; }
    if (favorites.includes(id)) await supabase.from('favorites').delete().eq('user_id', user.id).eq('media_item_id', id);
    else await supabase.from('favorites').insert({ user_id:user.id, media_item_id:id });
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function authSubmit(e) {
    e.preventDefault(); setLoading(true); setMessage('');
    const { error } = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setLoading(false); setMessage(error ? error.message : authMode === 'login' ? 'Connexion réussie.' : 'Compte créé. Vérifie ton email si nécessaire.');
  }

  async function importPlaylist(e) {
    e.preventDefault();
    if (!user) { setAuthModal(true); setMessage('Connecte-toi pour enregistrer ta playlist.'); return; }
    setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/playlist/parse', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ url: playlistUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const sourceType = playlistUrl.toLowerCase().includes('.m3u8') ? 'm3u8' : 'm3u';
      const { data: playlist, error: playlistError } = await supabase.from('playlists').insert({ user_id:user.id, name:playlistName || 'Ma playlist', source_type:sourceType, source_url:playlistUrl, last_synced_at:new Date().toISOString() }).select().single();
      if (playlistError) throw playlistError;
      const rows = data.items.filter(x => x.streamUrl).map(x => ({ playlist_id:playlist.id, type:x.type, title:x.title, group_name:x.group || null, stream_url:x.streamUrl, logo_url:x.logo || null, tvg_id:x.tvgId || null, metadata:x }));
      for (let i=0; i<rows.length; i+=500) { const { error } = await supabase.from('media_items').insert(rows.slice(i,i+500)); if (error) throw error; }
      await loadAccount(user);
      setMessage(`${data.count} contenus importés et enregistrés.`); setPlaylistUrl(''); setPlaylistName(''); setPlaylistModal(false);
    } catch (error) { setMessage(error.message || 'Import impossible.'); }
    finally { setLoading(false); }
  }

  async function deletePlaylist(id) {
    if (!user || !confirm('Supprimer cette playlist et son catalogue ?')) return;
    const { error } = await supabase.from('playlists').delete().eq('id', id).eq('user_id', user.id);
    if (!error) await loadAccount(user);
    else setMessage(error.message);
  }

  async function recordHistory(item, position = 0) {
    if (!user || !item?.playlistId) return;
    await supabase.from('watch_history').upsert({ user_id:user.id, media_item_id:item.id, position_seconds:Math.max(0, Math.floor(position)), watched_at:new Date().toISOString() }, { onConflict:'user_id,media_item_id' });
  }

  async function logout() { await supabase.auth.signOut(); setUser(null); }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>Stream<span>TV</span></span></div>
      <nav>{nav.map(([id,label,Icon]) => <button key={id} className={section === id ? 'nav-active' : ''} onClick={() => setSection(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><button className="add-side" onClick={() => setPlaylistModal(true)}><Plus size={18}/> <span>Ajouter une playlist</span></button><button onClick={() => setSection('settings')}><Settings size={18}/> <span>Paramètres</span></button></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">S</span>Stream<span>TV</span></div><div className="search"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une chaîne, un film, une série..." /></div><button className="profile" onClick={() => setAuthModal(true)}>{user ? <><span>{(user.email || 'U')[0].toUpperCase()}</span><div><b>{user.email?.split('@')[0]}</b><small>Compte gratuit</small></div><LogOut size={15} onClick={(e)=>{e.stopPropagation();logout()}}/></> : <><span><LogIn size={16}/></span><div><b>Mon compte</b><small>Se connecter</small></div></>}</button></header>
      {section === 'home' && <div className="hero"><img src={hero.image} alt=""/><div className="hero-gradient"/><div className="hero-copy"><span className="eyebrow">STREAMTV</span><h1>{hero.title}<br/><em>{hero.accent}</em></h1><p>{hero.text}</p><div className="hero-actions"><button className="primary" onClick={() => setPlaylistModal(true)}><Plus size={18}/> Ajouter une playlist</button><button className="secondary" onClick={() => setSection('live')}><Play size={17}/> Explorer le direct</button></div></div></div>}
      <div className="page-head"><div><span className="eyebrow">VOTRE ESPACE</span><h2>{nav.find(x=>x[0]===section)?.[1] || 'Accueil'}</h2></div>{section !== 'settings' && <button className="outline" onClick={()=>setPlaylistModal(true)}>Gérer mes playlists</button>}</div>
      {section === 'settings' ? <section className="settings-panel"><div><span className="eyebrow">COMPTE</span><h3>{user ? user.email : 'Mode découverte'}</h3><p>StreamTV V1 est gratuit. Vos playlists restent les vôtres.</p></div><button className="outline" onClick={()=>user ? logout() : setAuthModal(true)}>{user ? <><LogOut size={16}/> Déconnexion</> : <><LogIn size={16}/> Se connecter</>}</button></section> : section === 'playlists' ? <section className="playlist-panel"><div className="empty-icon"><ListVideo size={28}/></div><h3>Mes playlists</h3><p>{playlists.length ? 'Tes playlists enregistrées sont disponibles sur ton compte.' : 'Ajoute tes playlists M3U/M3U8 ou Xtream Codes pour remplir ton catalogue.'}</p>{playlists.map(p=><div className="playlist-line" key={p.id}><div><strong>{p.name}</strong><span>{p.source_type.toUpperCase()}</span></div><button className="outline" onClick={()=>deletePlaylist(p.id)}><Trash2 size={16}/> Supprimer</button></div>)}<button className="primary" onClick={()=>setPlaylistModal(true)}><Plus size={18}/> Ajouter une playlist</button></section> : <section className="media-row"><div className="section-title"><h3>{search ? `${visible.length} résultat${visible.length>1?'s':''}` : 'Votre catalogue'}</h3>{!search && <span>Synchronisé <RefreshCw size={14}/></span>}</div>{visible.length ? <div className="grid">{visible.map(item=><Card key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={toggleFavorite} onPlay={item=>{recordHistory(item);setPlayItem(item)}}/>)}</div> : <div className="empty">Aucun contenu dans cette section.</div>}</section>}
      <footer><div className="brand"><span className="brand-mark">S</span><span>Stream<span>TV</span></span></div><span>Vos playlists. Votre expérience.</span><span>V1 • Gratuit</span></footer>
    </section>
    {playlistModal && <div className="modal-backdrop" onClick={()=>setPlaylistModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setPlaylistModal(false)}><X/></button><span className="eyebrow">NOUVELLE SOURCE</span><h3>Ajouter une playlist</h3><p>Importe uniquement des flux que tu es autorisé à utiliser.</p><div className="source-tabs"><b>M3U / M3U8</b><span>Xtream Codes bientôt</span></div><form onSubmit={importPlaylist}><input required value={playlistName} onChange={e=>setPlaylistName(e.target.value)} placeholder="Nom de la playlist"/><input required type="url" value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} placeholder="https://exemple.com/playlist.m3u"/><button className="primary full" disabled={loading}>{loading ? 'Import en cours...' : 'Importer la playlist'}</button></form>{message && <div className="notice">{message}</div>}</div></div>}
    {authModal && <div className="modal-backdrop" onClick={()=>setAuthModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAuthModal(false)}><X/></button><span className="eyebrow">STREAMTV</span><h3>{authMode === 'login' ? 'Bienvenue' : 'Créer mon compte'}</h3><p>Ton compte permet de retrouver tes playlists et préférences.</p><form onSubmit={authSubmit}><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Adresse email"/><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe"/><button className="primary full" disabled={loading}>{loading ? 'Patiente...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}</button></form>{message && <div className="notice">{message}</div>}<button className="switch" onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setMessage('')}}>{authMode==='login' ? 'Créer un compte gratuitement' : 'J’ai déjà un compte'}</button></div></div>}
    {playItem && <div className="modal-backdrop" onClick={()=>setPlayItem(null)}><div className="player-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setPlayItem(null)}><X/></button>{playItem.streamUrl ? <video controls autoPlay src={playItem.streamUrl} onTimeUpdate={e=>{if(Math.floor(e.currentTime)%10===0) recordHistory(playItem,e.currentTime)}}/> : <div className="demo-player"><Play size={42} fill="currentColor"/><h3>{playItem.title}</h3><p>Ajoute une playlist avec un flux autorisé pour lancer la lecture.</p></div>}</div></div>}
  </main>;
}
