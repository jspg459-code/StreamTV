'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Home, Tv, Film, Clapperboard, Heart, ListVideo, Settings, Plus, Play, X, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase/client.js';
import { demoItems, hero } from '../../lib/demo-data.js';

const nav = [
  ['home','Accueil',Home], ['live','TV en direct',Tv], ['movie','Films',Film], ['series','Séries',Clapperboard], ['favorites','Favoris',Heart], ['playlists','Mes playlists',ListVideo], ['settings','Paramètres',Settings]
];

function Card({ item, favorite, onFavorite, onPlay }) {
  return <article className="media-card">
    <button className="poster" onClick={() => onPlay(item)} aria-label={`Lire ${item.title}`}>
      <img src={item.logo} alt="" /><span className="play"><Play size={17} fill="currentColor" /></span>
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    try { setFavorites(JSON.parse(localStorage.getItem('streamtv:favorites') || '[]')); } catch {}
    return () => listener.subscription.unsubscribe();
  }, []);

  const visible = useMemo(() => {
    let result = items;
    if (section === 'live' || section === 'movie' || section === 'series') result = result.filter(x => x.type === section);
    if (section === 'favorites') result = result.filter(x => favorites.includes(x.id));
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter(x => `${x.title} ${x.group} ${x.subtitle || ''}`.toLowerCase().includes(q)); }
    return result;
  }, [items, section, favorites, search]);

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next); localStorage.setItem('streamtv:favorites', JSON.stringify(next));
  }

  async function authSubmit(e) {
    e.preventDefault(); setLoading(true); setMessage('');
    const { error } = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setLoading(false); setMessage(error ? error.message : authMode === 'login' ? 'Connexion réussie.' : 'Compte créé. Vérifie ton email si nécessaire.');
  }

  async function importPlaylist(e) {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/playlist/parse', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ url: playlistUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const imported = data.items.map(x => ({ ...x, playlist: playlistName || 'Ma playlist', imported:true }));
      setItems(prev => [...prev.filter(x => !x.imported), ...imported]);
      setMessage(`${data.count} contenus importés.`); setPlaylistUrl(''); setPlaylistName('');
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
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
      {section === 'settings' ? <section className="settings-panel"><div><span className="eyebrow">COMPTE</span><h3>{user ? user.email : 'Mode découverte'}</h3><p>StreamTV V1 est gratuit. Vos playlists restent les vôtres.</p></div><button className="outline" onClick={()=>user ? logout() : setAuthModal(true)}>{user ? <><LogOut size={16}/> Déconnexion</> : <><LogIn size={16}/> Se connecter</>}</button></section> : section === 'playlists' ? <section className="playlist-panel"><div className="empty-icon"><ListVideo size={28}/></div><h3>Mes playlists</h3><p>Ajoute tes playlists M3U/M3U8 ou Xtream Codes pour remplir ton catalogue.</p><button className="primary" onClick={()=>setPlaylistModal(true)}><Plus size={18}/> Ajouter une playlist</button></section> : <section className="media-row"><div className="section-title"><h3>{search ? `${visible.length} résultat${visible.length>1?'s':''}` : 'Votre catalogue'}</h3>{!search && <span>Prêt à synchroniser <RefreshCw size={14}/></span>}</div>{visible.length ? <div className="grid">{visible.map(item=><Card key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={toggleFavorite} onPlay={setPlayItem}/>)}</div> : <div className="empty">Aucun contenu dans cette section.</div>}</section>}
      <footer><div className="brand"><span className="brand-mark">S</span><span>Stream<span>TV</span></span></div><span>Vos playlists. Votre expérience.</span><span>V1 • Gratuit</span></footer>
    </section>
    {playlistModal && <div className="modal-backdrop" onClick={()=>setPlaylistModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setPlaylistModal(false)}><X/></button><span className="eyebrow">NOUVELLE SOURCE</span><h3>Ajouter une playlist</h3><p>Importe uniquement des flux que tu es autorisé à utiliser.</p><div className="source-tabs"><b>M3U / M3U8</b><span>Xtream Codes bientôt</span></div><form onSubmit={importPlaylist}><input required value={playlistName} onChange={e=>setPlaylistName(e.target.value)} placeholder="Nom de la playlist"/><input required type="url" value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} placeholder="https://exemple.com/playlist.m3u"/><button className="primary full" disabled={loading}>{loading ? 'Import en cours...' : 'Importer la playlist'}</button></form>{message && <div className="notice">{message}</div>}</div></div>}
    {authModal && <div className="modal-backdrop" onClick={()=>setAuthModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAuthModal(false)}><X/></button><span className="eyebrow">STREAMTV</span><h3>{authMode === 'login' ? 'Bienvenue' : 'Créer mon compte'}</h3><p>Ton compte permet de retrouver tes playlists et préférences.</p><form onSubmit={authSubmit}><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Adresse email"/><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe"/><button className="primary full" disabled={loading}>{loading ? 'Patiente...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}</button></form>{message && <div className="notice">{message}</div>}<button className="switch" onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setMessage('')}}>{authMode==='login' ? 'Créer un compte gratuitement' : 'J’ai déjà un compte'}</button></div></div>}
    {playItem && <div className="modal-backdrop" onClick={()=>setPlayItem(null)}><div className="player-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setPlayItem(null)}><X/></button>{playItem.streamUrl ? <video controls autoPlay src={playItem.streamUrl}/> : <div className="demo-player"><Play size={42} fill="currentColor"/><h3>{playItem.title}</h3><p>Ajoute une playlist avec un flux autorisé pour lancer la lecture.</p></div>}</div></div>}
  </main>;
}
