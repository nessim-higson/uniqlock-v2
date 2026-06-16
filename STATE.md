# UNIQLOCK V2 — STATE

*Living status doc — last updated 2026-06-16 (build r50-crna-css). Companion to [SPEC.md](SPEC.md):
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
region of the screen.

**Current build:** `r56-repack-masonry` (commit `876117f`, 2026-06-16) — REPACK is a
**staggered native-AR masonry that fills the viewport, and whose layouts APPEAR (fade) rather
than slide**. This is the r55 feedback addressed: r55's FIT was one flat centred row and its
imagery slid around the canvas (re-rolled + morphed every bar). Now:
- **Staggered masonry** — `rollStruct` gives each column a varied **width** + vertical
  **offset**; `packMasonry` stacks native-AR images per column (height = colWidth / AR) then
  **CONTAIN-fits** the whole arrangement to the viewport, so it fills the dominant dimension
  and staggers (varied scales, ragged edges), black in the negative space. r52-style 2D
  unique layouts. Boxes are **exact native AR** (dAR = 0) — gaps come from the packer's
  natural gutter (`gN`), no inset distortion.
- **No sliding** — structural re-rolls happen only every **4 bars** (`STRUCT_PERIOD = 16`) and
  **fade in** (a fresh unique layout *appears*). In-place image swaps crossfade (`swapImage`);
  an AR change reflows **only that column** locally (`reflowColumn`) — nothing else moves.
- **FIT / FILL** toggle retained (chip + `f`): FIT = native AR + black; FILL = stretch
  edge-to-edge, crop.
Tempo = image count (1 parent at 60 BPM → 6 at max). **Repack history:** r51 slice-grid → r52
fixed-AR tiles+gaps (cropped, user's favourite feel) → r53 native-AR shelves → r54 native-AR
columns (butted, too static) → r55 dynamic columns (slid too much) → **r56 staggered masonry,
fills viewport, layouts appear** (current). SUBDIVIDE unchanged; BREATHE tabled.

**Older — r55:** `r55-repack-dynamic` (commit `7f6acf8`) — dynamic columns synthesis (gaps +
in/out + seamless morph + FIT/FILL); superseded by r56 (it slid imagery around too much).
Engine was:
- **Dynamic structure** — `rollStruct(N)` re-rolls the column grouping AND order **every bar**
  (varied 1/2/3-stacks, shuffled so the **parent** can sit anywhere). Slot 0 stays a single
  parent column (its image persists; it just moves). The layout keeps changing — not a fixed
  structure (that was r54's limit, the "not genuinely dynamic" complaint).
- **Seamless morph** — every re-roll relayouts and all cells animate (left/top/width/height)
  to the new fit; the whole structure flows.
- **Gaps** — a gutter inset opens black gaps between every work (both modes).
- **In/out** — per-slot image swaps on a cadence (parents slowest, `periodFor`) + the
  structural re-rolls move imagery to new places; leaving cells fade, new ones fade in.
- **FIT/FILL toggle** (chip + `f` key) — **FIT** = each image at native AR, no crop, big
  black negative space; **FILL** = the same column proportions stretched to fill the width,
  images crop. Lets the user see both image-shape approaches live (they asked to "see both").

Tempo = image count (1 parent at 60 BPM → 6 at max). SUBDIVIDE unchanged; BREATHE tabled.
**Repack rework history:** r51 moving slice-grid → r52 fixed-AR tiles+gaps+relocate (cropped)
→ r53 native-AR shelves (uniform) → r54 native-AR columns (butted, structure too static) →
**r55 dynamic columns + gaps + in/out + seamless morph + FIT/FILL** (current).

**Older:** `r52-repack-collage` (commit `dbaacee`, 2026-06-16) — the orchestra
on Strata imagery, with the **R25 crna four-side pull-back** as PULSE's transition
(pure CSS, GSAP removed — see Open decisions #4), the IAAH metronome box keeping
time, **two modes** (subdivide / repack), tempo fader, accent + warm-black design pass.

**This round (r52)** reworked both modes again + tabled the third, per user direction
("images shouldn't move; replace them in different places; fixed AR's; don't cover
100%; black opens up"):
- **REPACK → a STILL fixed-AR collage** (replacing r51's moving slice-grid). Boxes no
  longer slide. A stable scaffold of fixed-aspect-ratio tiles is packed onto a fine
  module grid (14×9 / portrait 9×14) with a **render-time gutter** (the black gaps)
  and a **coverage cap (~0.84)** so it never fills 100% — empty areas read as negative
  space. **Tempo = how many tiles are LIT** (1 image at 60 BPM → ~5 at 104 → 6 at max).
  Periodically (every bar) the system **relocates one image to a free tile by fading it
  out here and in over there — never translating** ("appears in a different place it
  sees fit"), so black opens and closes. Per-voice swaps still change the image inside a
  lit tile in place. Identity voice→tile binding (the per-section rebind is skipped in
  repack so tiles stay put). Spare scaffold positions (= voices+3 built, voices lit) are
  the relocation targets.
- **SUBDIVIDE → in/out black.** Keeps the favored tiled layout (untouched mechanic), but
  now fades cells to black and back on a per-bar cadence (`.veil`) — images come in and
  out, black areas open up in the grid.
- **BREATHE → TABLED.** Two attempts (r50 global track-swell = jitter; r51 local
  image-scale = inert) — neither landed. Chip + key removed, logic parked. The `.inner`
  + `.veil` cell layers it introduced stay (the collage/in-out use `.veil`).

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
| 20 | **orchestra** | Sound+image: each voice changes a grid block, R25 crna on PULSE | **Active direction** — current `r50-crna-css` (`landmark-02` is the early probe) |
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

**`comps/orchestra/` (Orchestra 01 — Strata, on IAAH imagery) — current at r50:**
- Gapless, square-cornered, **responsive** grid, JS-driven placement (six blocks,
  each an IAAH image cell with a two-layer crossfade from the imagery manifest).
- Strata's 6 voices each change their block when they sound, each with its own
  transition: **PULSE = the R25 crna four-side pull-back** (the chosen hero
  transition); GROANS = slow zoom; SHIMMER = dissolve; DRIVE = wipe; TICK = hard
  cut. Visuals scheduled at the audio event time.
- **Three modes** (chips / keys 1-3): SUBDIVIDE (layout count + composition vary
  by tempo, PULSE not always hero), REPACK (recomposes each section), BREATHE
  (seams swell on the beat). `L` toggles instrument labels.
- **BPM fills the grid in** — at 60 only PULSE is alive; crossing 74/88/102/116
  brings in the other voices (the Tectonic tier gate, made visual).
- **Section reassignment** — every 8 bars the voice→block binding rotates; the
  visible blocks are always the live voices' blocks (so nothing freezes).
- IAAH metronome box keeps time; warm-black + IAAH-yellow accent; reduced-motion
  + focus-visible a11y. A per-cell transaction token guards transition cleanup so
  a stale cleanup can't freeze a block.

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
4. **Transition** — DECIDED (2026-06-16): the **R25 crna four-side pull-back**
   (`landmark-01-the-door` / R25 `comps/solo/`) is THE transition. Ported verbatim
   into orchestra PULSE as `kind: 'crna'` — pure CSS (clip-path + transform/opacity
   transitions, ease `cubic-bezier(.45,.05,.2,1)` ≈ the `pageTransition` CustomEase):
   incoming clip-reveals from an edge on top while the outgoing pulls back 30% + scale
   .8 + opacity .4, 0.7s (capped to <1 beat), cycling all four sides. NOTE: tried GSAP
   first (r49) to match the ease exactly — it would NOT tween clip-path reliably here
   and fought the CSS transitions the other voices use, leaving layers stuck at their
   start clips. CSS-only fixed it. Earlier fold/pull attempts kept as unused alternates
   (`kind: 'fold'`/`'pull'`). `landmark-03-fold-ribbon` kept as reference, not chosen.
5. **Drawer / nav** — wire real destinations into the mark-as-door drawer
   (`landmark-01`).
6. Carry-overs from SPEC: shareable `?seed=` permutation URL; what the "hourly
   special" is once dancers are gone.
