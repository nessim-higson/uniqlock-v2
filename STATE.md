# UNIQLOCK V2 — STATE

*Living status doc — last updated 2026-06-15. Companion to [SPEC.md](SPEC.md):
SPEC is the design-time intent; STATE is where the build actually is. When they
disagree, STATE wins (and note the divergence here).*

---

## TL;DR

The conductor core from the spec is built and solid. The bulk of the work since
has been a long **comp slate** (live sketches, killed-or-kept together) and,
most recently, a deep dive on **audio direction** and a new **"orchestration of
sound + image"** direction (the `orchestra` comp). The destination IAAH piece is
not yet assembled — we're still choosing the sound, the transition, and the
core mechanic before wiring the final thing.

**Current focus:** `orchestra` — a grid where each voice of a track drives a
region of the screen. First probe shipped (Strata on a grayscale block grid).

**Live:**
- Slate / all comps → https://nessim-higson.github.io/uniqlock-v2/comps/
- Latest (orchestra) → https://nessim-higson.github.io/uniqlock-v2/comps/orchestra/
- Sound sampler → https://nessim-higson.github.io/uniqlock-v2/comps/sound/
- Versions index → https://nessim-higson.github.io/uniqlock-v2/versions/
- Repo → https://github.com/nessim-higson/uniqlock-v2

---

## What's built vs. the spec

| Spec area | State |
|---|---|
| The Conductor (single audio timebase, 1 beat = 1 real second) | **Built** — `js/conductor.js`. rAF + 25ms Worker backstop so beats survive hidden tabs. Still the sacred identity of the *main* piece. |
| Phase-1 faithful clock (clip-path wipes, offset-locked 60s music) | Superseded by the comp exploration; the rhythm lessons were learned, the literal Rewind rebuild was not the end goal. |
| Phase-1.5 live comps | **This is where most work happened** — 20 comps, see inventory below. |
| Imagery harvest | **Done** — `assets/imagery/` (40-image pool from iamalwayshungry.com, `manifest.json`). |
| User video pieces | **Done** — `assets/clips/` (11 CLIPS, 720p). |
| Tempo as a *density dial* at fixed 60 BPM (spec decision) | **Diverged in branches.** The `tempo`/`sound`/`orchestra` comps run a *free-tempo* engine (real BPM mutation, 60–130) because the audio there is fully generative — no pre-rendered track to break. The 1s heartbeat stays sacred only for the eventual main clock piece. |
| Audio = pre-rendered FPM tracks | **Diverged.** Now fully **generative Web Audio** (see Audio below). |
| Phase 2 (permutation engine, drawer, movements) | Not started as such; pieces of it exist (mark-as-door drawer in `landmark-01`, seeded permutations in several comps). |

---

## Two timebases in play (important)

1. **Conductor** (`js/conductor.js`) — wall-clock anchored, 1 beat = 1 second,
   sample-accurate, Worker-backed. Used by the clock-faithful comps (solo, fold,
   masonry, etc.). This is the spec's heartbeat.
2. **Free-tempo engine** — a plain rAF accumulator (`phase += dt/(60/bpm)`, beat
   on integer crossing) with a BPM fader. Used by `tempo`, `sound`, `orchestra`
   because their audio is generative and can run at any BPM. Decoupled from wall
   time on purpose.

These are not yet unified. A decision for the final piece: does the main work
use the sacred 1s conductor, or the musical free-tempo engine? (Leaning: the
clock piece keeps the conductor; the "album/track" pieces like orchestra use
free-tempo.)

---

## Comp inventory (the slate)

Newest first. All under `comps/`, served at port 4191, listed on the slate page.

| # | Comp | What it is | Standing |
|---|---|---|---|
| 20 | **orchestra** | Sound+image: each voice of a track lights a grid block | **Active direction** ([landmark-02](versions/landmark-02-orchestra/)) |
| 19 | **sound** | Generative audio sampler — ARC + 3 Tectonic forks | Active (the sound lab) |
| 18 | fold | Silent-house 4-side 3D hinge transition | Kept |
| 17 | tempo | You hold the metronome; work changes per beat; crna 4-side pull transition | **Favored transition** |
| 16 | rotate | 3D carousel, ring steps one work/beat | Kept |
| 15 | solo | One work at a time, swipe per beat, video hangs | Source of landmark-01 |
| 14 | duet | Two works, one in/one out per beat | Kept |
| 13 | masonry | Vertical grid, blocks on own clocks | Kept |
| 12 | swipe | Original UNIQLOCK mechanic on the archive | Kept |
| 11 | dial | 20 works ring the clock, displacement shader flood | Kept |
| 01–10 | sweep / zrush / type / hands / beatcut / ztunnel / channel / zrushb | Early rhythm/imagery probes | Reference |
| — | shows/katla | First *authored* fixed edit (not generative) | The authorship experiment |

**Landmarks (the keepers):**
- `landmark-01-the-door` — the solo + crna 4-side transition + mark-as-door drawer (click logo → pause everything + slide open a nav drawer).
- `landmark-02-orchestra` — the orchestra sound+image probe.
- `landmark-03-fold-ribbon` — **the fold transition (R28)**: a joined ribbon / prism that rotates a face toward you per beat, neighbours folding into black. User's pick — "the smoothest." This is THE transition to use going forward (a per-block, all-sides version of it is wired into the orchestra build).
- `landmark-04-tempo-melody` — the tempo comp (R31): you hold the metronome (BPM 30–180), work changes per beat via the crna pull, persistent generative melody + reverb + humanized audio.

---

## Audio (the recent deep dive)

All generative Web Audio (AudioContext / oscillators / filters / convolver
reverb). No Tone.js, no pre-rendered stems. The journey: FPM tracks → generative
kit → lo-fi house → "too playful" → darker palettes → bass-instrument metronome
→ developing track → orchestration. Current state lives in `comps/sound/`:

- **ARC** — a full Kiasmos-style track that **develops over time**: a 4-bar
  D-minor loop (Dm–Bb–F–C), punchy `kick()` + sustained sub, and an arrangement
  that cycles `intro → groove → melody → full → breakdown → climax` in ~8s
  sections (at 118 BPM default). Built in response to "more developed track as it
  plays, like Kiasmos."
- **TECTONIC forks** — three variants of a heavy bass-instrument metronome
  (`subThud`) that **build with tempo** (a `tiers()` gate adds a layer roughly
  every 14 BPM):
  - **I — STRATA**: pulse → groans → shimmer → off-beat drive → top tick.
  - **II — MAGMA**: warmer; bass melody → pad swell → high bells.
  - **III — FAULT**: darker; syncopated sub → rim → dissonant cluster → sweep+hats.

Killed along the way (in version history): dub chamber, nocturne, sonar, respire,
grain.

**Constraint:** I (Claude) can't audition audio or read a Spotify link — sound
is interpreted from artist/title + description; the user is the ear. Reference
artists named: The Books, Efterklang, DJ Seinfeld, Ross from Friends, **Kiasmos**.

---

## Orchestra — the current direction

*"The orchestration of sound and image."* The screen is subdivided into a grid;
each **voice** of a track owns a **region**, and that region reacts when its
voice plays. Because our music is generative, we know exactly which voice fires
when (sample-accurate, ahead of time) — no FFT guessing.

**`comps/orchestra/` (probe 01 — Strata, color = grayscale blocks):**
- Gapless, square-cornered, **responsive** grid (desktop / tablet / mobile, via
  `grid-template-areas` per breakpoint). Six blocks rest at dark→light greys.
- Strata's 5 voices each flash a block when they sound (visual scheduled at the
  audio event time): PULSE (every beat, center), GROAN A/B (slow swells), SHIMMER
  (bright bar accent), DRIVE (off-beats), TICK (fast top-strip).
- **BPM fills the grid in** — at 60 only PULSE is alive; crossing 74/88/102/116
  lights the rest (the Tectonic tier gate, made visual).
- **Section reassignment ON** — every 8 bars the voice→block binding rotates one
  step (a verified permutation); PULSE walks all six blocks over time, so the
  composition keeps recomposing.

**Built as an engine, not a one-off:** a track exposes named voice-events; a
mapping binds event-names → regions → block behaviors. So the planned **suite**
swaps the track + mapping — Strata is Orchestra 01; ARC / Magma / Fault each
become their own project later with their own grid character. Imagery (instead of
color blocks) is the obvious next axis: same bindings, blocks become image/clip
cells.

---

## Workflow

- **Versioning:** `./snapshot.sh <name> [commit]` freezes HTML+JS into
  `versions/<name>/`, sharing the live asset pool via a `UQ_ASSET_ROOT` override
  (kilobytes per snapshot, not 30MB). `landmark-*` names are featured in gold on
  the versions index; iterations are newest-first. **Snapshot every round.**
- **Deploy:** GitHub Pages from `main`/root. After a deploying push, reply with
  the cache-busted live link (`?v=<sha>`).
- **Dev server:** `comps/` etc. served at **port 4191** (`uniqlock-v2` launch
  config). Note: 1 beat = 1 second comps can't be screenshot-verified in a hidden
  preview tab (rAF pauses); conductor comps survive via the Worker backstop.

## Assets

- `assets/imagery/` — 40 IAAH stills + `manifest.json`.
- `assets/clips/` — 11 user CLIPS (c00–c10, 720p mp4).
- `assets/music/` — AAC `.m4a` transcodes of FPM tracks (OGG was undecodable on
  iOS). Largely unused now that audio is generative.
- Uniqlo woff fonts loaded from the Rewind CDN for the faithful clock baseline.

---

## Open decisions / next steps

1. **Which sound is *the* IAAH sound** — ARC (developing track) vs. a Tectonic
   fork vs. a hybrid. User is auditioning.
2. **Orchestra tuning** — flash intensities/decays, the grey ramp, rotation
   cadence (8 bars vs. slower), block proportions. Then: imagery instead of color
   blocks; build the suite (ARC/Magma/Fault orchestras).
3. **Which comp becomes the main piece**, and which timebase it uses (sacred
   conductor vs. free-tempo).
4. **Transition** — DECIDED (2026-06-16): the **fold** (R28 / `landmark-03-fold-ribbon`)
   is the chosen transition — user called it the smoothest. The orchestra build now
   uses a per-block, all-sides version of it (`kind: 'fold'` on PULSE: the old image
   hinges back on a cycling edge revealing the new one held behind). The crna pull is
   retired as the default (kept in code as an alternate `kind: 'pull'`).
5. **Drawer / nav** — wire real destinations into the mark-as-door drawer
   (`landmark-01`).
6. Carry-overs from SPEC: shareable `?seed=` permutation URL; what the "hourly
   special" is once dancers are gone.
