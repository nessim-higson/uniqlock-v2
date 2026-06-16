// Z-DRIFT — stills from the archive floating subtly toward the viewer
// while the clock ticks. One at a time, every 24 seconds, an 18-second
// drift from deep in Z to near the glass. Deterministic per serial, like
// everything else. They live above the clock faces and below the dance
// clips, so the dancers always interrupt them.

import { loadImageryManifest } from './data.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const PERIOD = 24; // a new drift every 24s
const ANCHORS = [
  { left: '9%', top: '16%' },
  { right: '9%', top: '13%' },
  { left: '13%', bottom: '13%' },
  { right: '12%', bottom: '17%' },
];

export function createDrift(layerEl) {
  let manifest = [];
  loadImageryManifest()
    .then((m) => { manifest = m; })
    .catch((err) => console.warn('[drift] imagery unavailable:', err));

  return {
    onBeat(beat) {
      if (!manifest.length) return;
      if (beat.wallSec % PERIOD !== 0) return;
      const D = Math.floor(beat.wallSec / PERIOD);
      const rng = mulberry32((D * 2654435761) >>> 0);
      const item = document.createElement('div');
      item.className = 'driftItem';
      Object.assign(item.style, ANCHORS[D % ANCHORS.length]);
      const im = new Image();
      im.src = manifest[Math.floor(rng() * manifest.length)];
      item.appendChild(im);
      layerEl.appendChild(item);
      setTimeout(() => item.remove(), 19000);
    },
  };
}
