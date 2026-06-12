// Canonical data extracted from the Uniqlock Rewind source
// (megajerk.github.io/Uniqlock, js/modules/defaultData.js).

export const ASSETS = 'https://megajerk.github.io/Uniqlock/assets';

// Repo root, derived from this module's location — keeps local asset URLs
// correct when a page lives in a subdirectory (comps/*). Frozen snapshots
// under versions/ override this so they share the live assets instead of
// duplicating them.
export const ROOT = (typeof window !== 'undefined' && window.UQ_ASSET_ROOT)
  ? window.UQ_ASSET_ROOT
  : new URL('..', import.meta.url).href;

// colorBySeason["1"] — 24 hour colors, index = hour of day
export const HOUR_COLORS = [
  [125, 0, 34], [23, 23, 156], [190, 27, 190], [19, 206, 164],
  [129, 81, 28], [42, 126, 0], [82, 207, 226], [255, 153, 0],
  [107, 0, 189], [255, 90, 0], [146, 6, 131], [153, 216, 19],
  [228, 0, 127], [255, 187, 0], [0, 115, 109], [0, 160, 233],
  [241, 145, 73], [138, 128, 0], [238, 120, 212], [127, 229, 107],
  [96, 35, 61], [29, 69, 162], [106, 57, 5], [231, 63, 178],
];

// Season 1 is day-only; night clips/music come from Season 2,
// exactly as the Rewind merges its pools.
const seq = (n) => Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, '0'));

export const VIDEOS = {
  day: seq(56).map((n) => `${ASSETS}/videos/Season 1/Season 1 - Day - ${n}.webm`),
  night: seq(42).map((n) => `${ASSETS}/videos/Season 2/Season 2 - Night - ${n}.webm`),
};

// Self-hosted AAC transcodes of the FPM tracks — the CDN originals are
// OGG/Vorbis, which iOS Safari cannot decode (decodeAudioData rejects and
// the piece would run silent on iPhone).
export const MUSIC = {
  day: ['00 - Season 1', '01 - Season 1', '02 - Season 1']
    .map((f) => `${ROOT}assets/music/${f}.m4a`),
  night: [`${ROOT}assets/music/Night - 01 - Season 2.m4a`],
};

// Starter imagery pool harvested from iamalwayshungry.com (DatoCMS).
export async function loadImageryManifest() {
  const res = await fetch(`${ROOT}assets/imagery/manifest.json`);
  const names = await res.json();
  return names.map((n) => `${ROOT}assets/imagery/${n}`);
}

// Rewind default custom config: night 21:00–06:00 (midnight folded into night
// for the Phase 1 rhythm core), day 06:00–21:00.
export function timeOfDay(hours) {
  return (hours >= 21 || hours < 6) ? 'night' : 'day';
}
