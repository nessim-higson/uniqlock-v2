// MUSIC — the Rewind trick, done sample-accurately.
// Tracks are exactly one minute long. Each minute gets a random track from
// the time-of-day pool (no immediate repeats); playback offset within the
// track always equals seconds-into-minute, so the embedded tick sounds are
// the clock. Starts are scheduled on the audio clock, never "now".

import { MUSIC, timeOfDay } from './data.js';

export function createMusic(conductor) {
  const { ctx } = conductor;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  const buffers = { day: [], night: [] };
  let lastIndex = -1;
  let scheduledForMinute = -1; // wall-clock minute index already scheduled
  let currentSource = null;
  let muted = false;

  async function load() {
    for (const pool of ['day', 'night']) {
      buffers[pool] = await Promise.all(
        MUSIC[pool].map(async (url) => {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          return ctx.decodeAudioData(buf);
        })
      );
    }
  }

  function pickBuffer(pool) {
    const list = buffers[pool];
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];
    let i;
    do { i = Math.floor(Math.random() * list.length); } while (i === lastIndex);
    lastIndex = i;
    return list[i];
  }

  // Schedule playback covering the minute that contains `wallSec`,
  // starting at `wallSec` (offset = seconds-into-minute), ending at the
  // minute boundary.
  function scheduleFrom(wallSec) {
    const date = new Date(wallSec * 1000);
    const minuteIndex = Math.floor(wallSec / 60);
    if (minuteIndex === scheduledForMinute) return;

    const pool = timeOfDay(date.getHours());
    const buffer = pickBuffer(pool);
    if (!buffer) return;

    const offset = wallSec % 60;
    const when = conductor.audioTimeForWallSec(wallSec);
    const duration = Math.min(60 - offset, buffer.duration - offset);
    if (duration <= 0) return;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    src.start(when, offset, duration);
    currentSource = { src, when, offset, wallSec };
    scheduledForMinute = minuteIndex;
  }

  return {
    load,

    // Call once on entry: cover the current (partial) minute.
    begin() {
      const wallSec = conductor.nextSchedulableWallSec();
      scheduleFrom(wallSec);
    },

    // Call every beat: from :55 each minute, schedule the next minute's
    // track ahead, sample-accurate (5s margin survives throttled timers).
    // If a beat lands in a minute with no music scheduled (we slept through
    // the boundary in a background tab), recover mid-minute.
    onBeat(beat) {
      const sec = beat.date.getSeconds();
      const thisMinute = Math.floor(beat.wallSec / 60);
      if (sec >= 55) {
        scheduleFrom((thisMinute + 1) * 60);
      } else if (scheduledForMinute < thisMinute) {
        scheduleFrom(conductor.nextSchedulableWallSec());
      }
    },

    // Partner to conductor.resync(): kill any source scheduled against the
    // stale epoch; the next beat's recovery path reschedules cleanly.
    resync() {
      if (currentSource) {
        try { currentSource.src.stop(); } catch { /* already ended */ }
        currentSource = null;
      }
      scheduledForMinute = -1;
    },

    toggleMute() {
      muted = !muted;
      gain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
      return muted;
    },

    // Drift diagnostic: playing buffer position vs TRUE wall-clock
    // seconds-into-minute. Should sit near 0 ms.
    driftMs() {
      if (!currentSource) return null;
      const { when, offset } = currentSource;
      const elapsed = ctx.currentTime - when;
      if (elapsed < 0 || elapsed > 60) return null;
      const bufferPos = offset + elapsed;
      const wallPos = (Date.now() / 1000) % 60;
      let d = bufferPos - wallPos;
      if (d > 30) d -= 60;
      if (d < -30) d += 60;
      return d * 1000;
    },
  };
}
