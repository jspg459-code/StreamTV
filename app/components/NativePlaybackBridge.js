'use client';

import { useEffect } from 'react';
import { getNativePlaybackUrl } from '../../lib/player/runtime.js';

function isCapacitorRuntime() {
  return typeof window !== 'undefined' && Boolean(window.Capacitor);
}

function unwrapVideo(video) {
  const current = video.getAttribute('src');
  if (!current) return;
  const nativeUrl = getNativePlaybackUrl(current);
  if (/^http:\/\//i.test(nativeUrl) && nativeUrl !== current) {
    video.setAttribute('data-streamtv-native-src', nativeUrl);
    video.setAttribute('src', nativeUrl);
    video.load();
  }
}

export default function NativePlaybackBridge() {
  useEffect(() => {
    if (!isCapacitorRuntime()) return undefined;

    const scan = () => document.querySelectorAll('video').forEach(unwrapVideo);
    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    return () => observer.disconnect();
  }, []);

  return null;
}
