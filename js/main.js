import { createConductor } from './conductor.js';
import { createMusic } from './music.js';
import { createClock } from './clock.js';
import { createClips } from './clips.js';
import { createMetrics } from './metrics.js';

const overlay = document.getElementById('overlay');
const viewContainer = document.getElementById('viewContainer');
const player = document.getElementById('videoPlayer');

const conductor = createConductor();
const music = createMusic(conductor);
const clock = createClock(viewContainer);
const clips = createClips(player);
const metrics = createMetrics(conductor, music);

conductor.onBeat((beat) => {
  clock.onBeat(beat);
  clips.onBeat(beat);
  music.onBeat(beat);
  metrics.onBeat(beat);
});

let entered = false;
const musicReady = music.load();

// iOS: route Web Audio as media playback so the hardware silent switch
// doesn't mute it (Safari 16.4+; harmless elsewhere).
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* optional */ }

overlay.addEventListener('click', async () => {
  if (entered) return;
  entered = true;
  overlay.classList.add('leaving');

  await conductor.start();
  clips.begin(new Date().getHours());
  setTimeout(() => overlay.remove(), 600);

  // never block the clock on the soundtrack download — it joins when ready
  musicReady.then(() => music.begin()).catch((err) => {
    console.warn('[uq] music failed to load, running silent:', err);
    document.getElementById('muteHint').textContent = 'music failed — running silent';
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'm' && entered) {
    document.getElementById('muteHint').textContent = music.toggleMute() ? 'muted — m to unmute' : '';
  }
});

// iOS suspends the AudioContext on lock/interruption; revive it when the
// page comes back (and on any tap, as a belt-and-braces fallback).
function revive() {
  if (!entered || conductor.ctx.state === 'running') return;
  conductor.ctx.resume().then(() => {
    conductor.resync();
    music.resync();
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') revive();
});
document.addEventListener('touchend', revive, { passive: true });
