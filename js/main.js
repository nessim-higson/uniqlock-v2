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

overlay.addEventListener('click', async () => {
  if (entered) return;
  entered = true;
  overlay.classList.add('leaving');

  await conductor.start();
  clips.begin(new Date().getHours());
  try {
    await musicReady;
    music.begin();
  } catch (err) {
    console.warn('[uq] music failed to load, running silent:', err);
  }

  setTimeout(() => overlay.remove(), 600);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'm' && entered) {
    document.getElementById('muteHint').textContent = music.toggleMute() ? 'muted — m to unmute' : '';
  }
});
