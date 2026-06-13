// The user's own video pieces. Currently the NEVVERLAND reel, sliced into
// its measured shots (frame-difference analysis). Each shot is a clip;
// a reel-backed <video> loops within its shot so it keeps moving for as
// long as it's held on screen. Drop more reels in assets/reel/ and add
// them here to widen the pool.

import { ROOT } from './data.js';

export const REEL = ROOT + 'assets/reel/nevverland.m4v';

// [start, duration] — the reel's real cuts (stutter shots dropped)
export const SHOTS = [
  [0.00, 1.30], [1.30, 2.33], [3.63, 1.37], [5.80, 1.63],
  [7.43, 1.64], [9.07, 1.30], [10.37, 2.50], [12.87, 1.31],
];

export function makeReelVideo() {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = REEL;
  v.load();
  return v;
}

// Play a shot and loop within its bounds (so a 1.3s shot still fills an
// 8-beat hold without ever cutting to the next shot).
export function playShot(v, shotIdx) {
  const shot = SHOTS[((shotIdx % SHOTS.length) + SHOTS.length) % SHOTS.length];
  const start = shot[0] + 0.03;
  const end = shot[0] + shot[1] - 0.06;
  v.dataset.s = start;
  v.dataset.e = end;
  const seek = () => { v.currentTime = start; v.play().catch(() => {}); };
  if (v.readyState >= 1) seek();
  else v.addEventListener('loadedmetadata', seek, { once: true });
  v.ontimeupdate = () => {
    if (v.currentTime >= +v.dataset.e || v.currentTime < +v.dataset.s - 0.15) {
      v.currentTime = +v.dataset.s;
    }
  };
}
