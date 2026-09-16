import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streamtv.player',
  appName: 'StreamTV',
  webDir: '.next',
  server: {
    url: 'https://stream-tv-sigma.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
