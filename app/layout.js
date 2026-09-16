import './globals.css';
import NativePlaybackBridge from './components/NativePlaybackBridge.js';

export const metadata = {
  title: 'StreamTV — Votre télévision, partout',
  description: 'Lecteur IPTV personnel pour vos playlists autorisées M3U, M3U8 et Xtream.',
};

export default function RootLayout({ children }) {
  return <html lang="fr"><body><NativePlaybackBridge />{children}</body></html>;
}
