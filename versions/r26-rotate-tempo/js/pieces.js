// The user's own video pieces — the CLIPS folder (11 clips), transcoded to
// 720p in assets/clips/. Each clip is a whole piece; it loops while held.
// One cached <video> element per clip, reused and moved between cells.

import { ROOT } from './data.js';

export const CLIPS = Array.from({ length: 11 }, (_, i) =>
  ROOT + 'assets/clips/c' + String(i).padStart(2, '0') + '.mp4');

const els = new Map();
export function getClip(idx) {
  idx = ((idx % CLIPS.length) + CLIPS.length) % CLIPS.length;
  if (!els.has(idx)) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = 'auto';
    v.src = CLIPS[idx];
    v.load();
    els.set(idx, v);
  }
  return els.get(idx);
}

export function playClip(v) {
  try { v.currentTime = 0; } catch (e) { /* not seekable yet */ }
  v.play().catch(() => {});
}

export function pickClipIdx(seedFloat) {
  const f = ((seedFloat % 1) + 1) % 1;
  return Math.floor(f * CLIPS.length);
}

// warm a few clips ahead so the first plays are instant
export function warmClips(n = 4) {
  for (let i = 0; i < Math.min(n, CLIPS.length); i++) getClip(i);
}
