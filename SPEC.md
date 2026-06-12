# UNIQLOCK V2 — "The Living Clock"

*Spec v1 — 2026-06-12. Built from the questionnaire answers + frame-study of the
Uniqlock Rewind source (megajerk.github.io/Uniqlock). Sign-off required before code.*

## North star

A website that feels **alive** — every visit a different permutation of the same
organism. A **lean-back** experience: you arrive into it, you don't operate it.
Potentially the next iamalwayshungry site.

The soul to protect (user's words): the original felt alive because the clock,
the music's melody/rhythm, and the dancers all echoed each other. Nothing was
decorative; everything was *on the beat*.

Strategy: **nail it first, then deviate.** Phase 1 earns the right to Phase 2.

---

## The Conductor (the fix for everything that was wrong before)

The old builds ran three unsynced clocks (rAF wall-clock wipes, `setInterval`
beat engine, free-running audio). V2 has exactly **one timebase**.

```
        wall clock (truth for displayed time)
              │  anchored once per minute
              ▼
   ┌─────────────────────┐
   │      CONDUCTOR      │   epoch: audioCtx.currentTime ↔ wall-clock second
   │  (Web Audio clock)  │   lookahead scheduler (~100ms horizon, 25ms poll)
   └─────────┬───────────┘
       sample-accurate events
   ┌─────────┼───────────┬─────────────┐
   ▼         ▼           ▼             ▼
 music     wipes      clip in/out   movements (Phase 2)
```

- On entry (click-to-enter), compute `epoch = audioCtx.currentTime` at the next
  wall-clock second boundary (measured via `performance.now()` correlation).
  Every event thereafter is scheduled in **audio time**: `epoch + n × 1.0s`.
- Music: the Rewind trick, done sample-accurately. Tracks are exactly 60s,
  one per minute, chosen randomly from the time-of-day pool. Start each track
  with `source.start(when, offset)` where `when` is the scheduled minute
  boundary in audio time and `offset` is the seconds-into-minute — never
  "start now and hope."
- Visuals: the scheduler queues visual events with their audio-time deadline;
  an rAF loop fires each one when `audioCtx.currentTime` crosses it. Worst-case
  visual error = 1 frame (~16ms). No `setInterval` anywhere.
- Re-anchor the epoch at each minute boundary so displayed time can never
  drift from true time by more than ~1ms/minute of audio-clock skew.
- **Sound is essential**: sound ON by default after click-to-enter. Mute
  exists but the conductor keeps running off the audio clock even when muted
  (gain = 0, never suspend).

## Phase 1 — Nail it (the rhythm core)

Scoped to what teaches us the timing: conductor + clock wipes + clip slots +
offset-locked music. The original's long-tail features (hour videos, seasons,
night digit glow) are documented below for reference but NOT built — they're
content variety, not rhythm, and Phase 2 replaces their content anyway.

Canonical behavior, verified against the Rewind source:

| Element | Canonical value |
|---|---|
| Tick | 1/sec, exactly on the second |
| Wipe | 300ms, `cubic-bezier(.1,1,.2,1)`, clip-path inset |
| Wipe cycle | top-to-bottom (exit) → right-to-left (enter) → bottom-to-top (exit) → left-to-right (enter) |
| Both faces | always show the SAME time; time2 (colored) clips over time1 (white) |
| Dance clips | in at sec `:x6`, out at sec `:x1` (5s), every 10s |
| Music | 60s tracks, random per minute from day/night pool, offset-locked |
| Hour colors | 24 colors, change at hour boundary |
| Day/night | separate music + cosmetic modes |
| Entry | click-to-enter arms audio, sound on |

*Reference-only (not built in Phase 1): hour videos at minute-59 boundary
(15.056s / 30.056s with own music), seasons, 900ms night digit glow.*

Assets: Rewind CDN (fonts, FPM tracks, Season 1 clips) — placeholder license-wise,
replaced in Phase 2.

**Phase 1 acceptance tests:**
1. **Phase lock**: instrumented log of (scheduled audio time − actual visual fire
   time) for every wipe over 10 minutes: p95 ≤ 1 frame (16.7ms). Music tick to
   wipe onset audibly simultaneous.
2. **Soak**: 60 minutes running — no drift vs. true time, clip cadence intact,
   flat memory, no missed ticks after tab background/foreground.
3. **Side-by-side**: v2 next to the Rewind build — rhythm indistinguishable
   (user's eye is the judge).

## Phase 1.5 — Live comps (align before building)

Motion is the soul, so comps are live, not static: each comp is a small
self-contained sketch running on the real conductor — 30–60s of looped
performance, no chrome, no controls. We review them together, kill or keep,
and only what survives gets engineered properly in Phase 2. First slate:

1. **Sweep reveal** — second hand swipes the viewport, trailing edge is a
   shader mask revealing the next image.
2. **Z-rush** (user idea) — static IAAH imagery dollying toward camera in Z
   space with a lens-distortion pass on top (we already have the recovered
   Vincent Lowe lens GLSL in `prototypes/vincent-lowe-style.html` to seed this).
3. **Type performance** — Helvetica letterforms snapping on the beat grid.

Plus one **drawer comp** ("back of the watch") once a movement direction wins.

### Imagery source
Pull from **iaah.work** (Cargo, client-rendered) and **iamalwayshungry.com**
(Nuxt + DatoCMS, assets on datocms-assets.com) for now — harvest a starter
pool of 30–60 images via headless browser into `assets/imagery/`. Placeholder
status: fine, it's the user's own work.

## Phase 2 — Make it alive (the deviation)

Only starts after Phase 1 + comps sign-off. The conductor stays; everything
above the conductor becomes swappable.

### Movements
The 5-second clip slot generalizes into a **movement**: any performance that
subscribes to the conductor (beat number, phase, bar position) and renders for
N beats. The original dance clip is just movement #1. Planned movements to riff on:

- **Sweep reveal** (user's idea): a clock hand sweeps like a second hand across
  the viewport in WebGL; its trailing edge is a shader mask revealing a new
  image/scene each rotation. The reveal technique itself is the craft.
- **Z-rush** (user's idea): static imagery traveling at the camera in Z space,
  distortion shader on top — stills made kinetic.
- **Type performance**: Helvetica letterforms as the dancers — kerning,
  weight, scale snapping on beats.
- Generative WebGL choreography (instanced geometry on the beat grid).

### Permutation engine
A per-visit seed (date + entropy) deterministically selects: movement lineup,
clip slot rhythm, type scale variant, drawer position, palette derivation off
the hour color. Two visits read as the same site, never the same permutation.
Permutations are **structural, not random noise** — like the original choosing
different dancers, not like a screensaver.

### Malleability grammar — staged (user decision 2026-06-12)
Order of operations: nail all other mechanics in motion tests FIRST. The
UI/drawer starts **simple** and is advanced toward malleable later. Quantized
interaction (gestures resolving on the beat) is explicitly **parked** — revisit
after the comp slate. Candidate grammar when we return: clock-as-handle,
wipe-as-only-verb, seeded drawer edge, type reflexes, idle breath, glass press.

### Malleable UI — "the back of the watch"
No floating transport bar (deemed generic). Instead a **drawer**: an edge pull
that slides open to expose the machinery — tempo, movement selector, seed,
sound, hour-color override. Closed = pure lean-back ambient. Open = you're
looking inside the watch. The drawer's own position/form is part of the
permutation. (Direction to push on together; nternet.company's tempo-reactive
site is the reference for tempo affecting everything.)

### Tempo (nternet riff) — REFRAMED, deferred
Decision: the 1-second heartbeat is **sacred** — 60 BPM = real seconds is what
makes it a clock, and mutating true BPM would require synthesizing the music
from scratch (big cost, breaks the conceit). Instead, the nternet-style "site
reacts to a dial" survives as a **density control**: the heartbeat stays at
60, but a drawer dial multiplies visual subdivision — 1× (one wipe/sec) → 2×,
4× (movements add eighth/sixteenth-note flourishes between ticks, music
untouched). Same feel of the site reacting, no architectural debt. True
BPM mutation parked as a possible Phase 3 experiment.

## Aesthetic

Minimal. Simple. **Helvetica** (drop the Uniqlo woffs in Phase 2; keep them in
Phase 1 for the faithful baseline). Minimal UI — nothing on screen but the
piece. Keep: 24 hour colors, day/night modes.

## Tech

- **Stack**: vanilla JS + Three.js (WebGL) for movements; DOM/CSS clip-path for
  the clock faces in Phase 1 (it IS the original technique — crisp text, exact
  easing). Conductor is a standalone module (`conductor.js`) both layers
  subscribe to — this is the seam that makes Phase 2 swappable.
- **Form**: small ES-module project (no build step), `index.html` +
  `js/` modules. Dev server port **4190**.
- **Home**: `prototypes/uniqlock-v2/` now; destination IAAH site/repo when it
  graduates.
- Must run for hours without leaks; degrade gracefully on mobile (clock +
  music always work; heavy movements feature-detect).

## Done (overall)

"I can leave it running and it never breaks the spell" — plus Phase 1 tests
above pass, and at least two movements + the drawer + the permutation engine
exist so two visits feel like two performances by the same band.

## Open questions (riff list, not blockers)

1. ~~Sweep-reveal imagery~~ → answered: harvest from iaah.work + iamalwayshungry.com.
2. Does the drawer expose the permutation seed as a shareable URL? (`?seed=`)
3. Hour videos in Phase 2: what's the "hourly special" when dancers are gone?
4. ~~Tempo~~ → answered: density dial at fixed 60 BPM heartbeat; true BPM = Phase 3 maybe.
