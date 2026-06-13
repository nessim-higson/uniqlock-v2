// The user's own video pieces. Currently the NEVVERLAND reel. Rather than
// slicing it into short shots (which had to loop to fill a hold and read as
// an "odd repeat"), we play CONTINUOUS segments — a clip starts somewhere in
// the reel and plays forward for its whole hold without ever looping, so the
// motion never visibly repeats. Drop more reels in assets/reel/ and add them
// to REELS to widen the pool.

import { ROOT } from './data.js';

export const REELS = [
  { url: ROOT + 'assets/reel/nevverland.m4v', dur: 14.18 },
];

export function makeReelVideo(reelIdx = 0) {
  const reel = REELS[reelIdx];
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = reel.url;
  v.dataset.dur = reel.dur;
  v.load();
  return v;
}

// Deterministic start time so a `holdSec`-long clip fits before the reel ends.
export function startFor(seedFloat, holdSec, reelIdx = 0) {
  const f = ((seedFloat % 1) + 1) % 1;
  return f * Math.max(0.1, REELS[reelIdx].dur - holdSec);
}

// Play forward from `start`, no looping. Only wraps if it runs off the very
// end of the reel (shouldn't happen if start was chosen with startFor).
export function playFrom(v, start) {
  const dur = +v.dataset.dur || 14;
  const s = Math.max(0, Math.min(dur - 0.2, start));
  v.dataset.s = s;
  const go = () => { try { v.currentTime = s; } catch (e) { /* not seekable yet */ } v.play().catch(() => {}); };
  if (v.readyState >= 1) go();
  else v.addEventListener('loadedmetadata', go, { once: true });
  v.ontimeupdate = () => { if (v.currentTime >= dur - 0.12) v.currentTime = +v.dataset.s; };
}
