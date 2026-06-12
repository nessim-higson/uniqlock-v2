// THE CONDUCTOR — single timebase for the whole piece.
//
// Maps wall-clock seconds onto the Web Audio clock once ("anchor"), then
// derives every event from that epoch:
//   beat n  ↔  wall second (epochWallSec + n)  ↔  audio time (epochAudio + n)
//
// Audio events (music starts) are scheduled sample-accurately via
// source.start(audioTime). Visual events fire from a rAF loop the moment
// ctx.currentTime crosses the beat's audio time — worst case error ≈ 1 frame.
//
// A Web Worker timer (250ms) backstops the rAF loop: in a hidden tab rAF
// stops entirely, but worker timers keep running, so beats — and with them
// music scheduling — survive backgrounding. Same trick the Rewind uses.

export function createConductor() {
  const ctx = new AudioContext();
  const listeners = [];

  let epochAudio = 0;   // ctx.currentTime at which epochWallSec began
  let epochWallSec = 0; // integer wall-clock seconds (Unix)
  let nextBeat = 0;     // next beat index to fire
  let running = false;
  let rafId = 0;

  // Phase-lock instrumentation: ms error per fired beat, split by tab
  // visibility — hidden-tab beats fire off the 25ms worker poll, not rAF,
  // so they'd unfairly pollute the visible-frame accuracy gate.
  const errors = { visible: [], hidden: [] };
  const ERR_CAP = 1200;

  function sampleAnchor() {
    // Take 5 paired samples of (Date.now, ctx.currentTime); keep the pair
    // captured fastest to minimize cross-clock jitter.
    let best = null;
    for (let i = 0; i < 5; i++) {
      const a0 = ctx.currentTime;
      const w = Date.now();
      const a1 = ctx.currentTime;
      const spread = a1 - a0;
      if (!best || spread < best.spread) best = { w, a: (a0 + a1) / 2, spread };
    }
    return best;
  }

  function anchor() {
    const { w, a } = sampleAnchor();
    const msInto = w % 1000;
    epochWallSec = Math.floor(w / 1000) + 1;
    epochAudio = a + (1000 - msInto) / 1000;
    nextBeat = 0;
  }

  // Gentle re-anchor (called each minute): correct audio-clock vs wall-clock
  // skew without disturbing the beat counter. Returns correction in ms.
  function reAnchor() {
    const { w, a } = sampleAnchor();
    const wallSecNow = w / 1000;
    const beatPos = wallSecNow - epochWallSec;          // beats since epoch, fractional
    const idealAudio = epochAudio + beatPos;            // where the audio clock "should" be
    const driftMs = (a - idealAudio) * 1000;
    if (Math.abs(driftMs) < 100) epochAudio += driftMs / 1000;
    return driftMs;
  }

  function processBeats() {
    if (!running) return;
    const now = ctx.currentTime;

    // If we slept (background tab), jump to the latest pending beat instead
    // of replaying a burst of wipes. Listeners recover their own state.
    const pending = Math.floor(now - (epochAudio + nextBeat));
    if (pending > 1) nextBeat += pending;

    const scheduled = epochAudio + nextBeat;
    if (now >= scheduled) {
      const errMs = (now - scheduled) * 1000;
      const stream = document.hidden ? errors.hidden : errors.visible;
      stream.push(errMs);
      if (stream.length > ERR_CAP) stream.shift();

      const wallSec = epochWallSec + nextBeat;
      const date = new Date(wallSec * 1000);
      const beat = {
        n: nextBeat,
        wallSec,
        date,
        audioTime: scheduled,
        errMs,
      };
      nextBeat++;
      for (const fn of listeners) fn(beat);
      if (date.getSeconds() === 0) reAnchor();
    }
  }

  function loop() {
    if (!running) return;
    processBeats();
    rafId = requestAnimationFrame(loop);
  }

  // Background safety net: worker timers keep firing when rAF is frozen.
  const worker = new Worker(URL.createObjectURL(new Blob(
    ['setInterval(() => postMessage(0), 25);'],
    { type: 'application/javascript' }
  )));
  worker.onmessage = () => processBeats();

  return {
    ctx,

    async start() {
      await ctx.resume();
      anchor();
      running = true;
      rafId = requestAnimationFrame(loop);
    },

    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },

    // After an AudioContext suspension (iOS lock/interruption) the audio
    // clock has paused while wall time kept going — the old epoch is a lie.
    // Re-anchor from scratch.
    resync() {
      anchor();
    },

    onBeat(fn) {
      listeners.push(fn);
    },

    // Audio time at which a given wall-clock second begins.
    audioTimeForWallSec(wallSec) {
      return epochAudio + (wallSec - epochWallSec);
    },

    // Continuous wall-clock seconds (fractional, Unix-based), derived from
    // the audio clock — sub-frame smooth, for sweeps and eased motion.
    phase() {
      return epochWallSec + (ctx.currentTime - epochAudio);
    },

    // Next wall-clock second strictly after "now" plus a safety margin,
    // so audio scheduled against it is always in the future.
    nextSchedulableWallSec(marginSec = 0.05) {
      const beatPos = ctx.currentTime - epochAudio + marginSec;
      return epochWallSec + Math.max(0, Math.ceil(beatPos));
    },

    metrics() {
      const summarize = (arr) => {
        if (arr.length === 0) return { count: 0 };
        const sorted = [...arr].sort((x, y) => x - y);
        const pick = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
        return {
          count: arr.length,
          last: arr[arr.length - 1],
          p50: pick(0.5),
          p95: pick(0.95),
          max: sorted[sorted.length - 1],
        };
      };
      return { visible: summarize(errors.visible), hidden: summarize(errors.hidden) };
    },
  };
}
