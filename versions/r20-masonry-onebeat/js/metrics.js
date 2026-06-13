// PHASE-LOCK INSTRUMENTATION — press `d` to toggle the HUD.
// Acceptance gate (SPEC Phase 1): p95 beat error ≤ 16.7ms over 10 minutes.

export function createMetrics(conductor, music) {
  const hud = document.getElementById('hud');
  let visible = false;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'd') {
      visible = !visible;
      hud.style.display = visible ? 'block' : 'none';
    }
  });

  // Machine-readable handle for automated verification.
  window.__uq = {
    beat: () => conductor.metrics(),
    musicDriftMs: () => music.driftMs(),
  };

  function render(beat) {
    if (!visible) return;
    const { visible: m } = conductor.metrics();
    const drift = music.driftMs();
    hud.textContent = [
      `beat   #${beat.n}  ${beat.date.toTimeString().slice(0, 8)}`,
      m.count
        ? `error  last ${m.last.toFixed(1)}ms  p50 ${m.p50.toFixed(1)}ms  p95 ${m.p95.toFixed(1)}ms  max ${m.max.toFixed(1)}ms  (${m.count} beats)`
        : 'error  warming up…',
      `music  drift ${drift === null ? '—' : drift.toFixed(1) + 'ms'}`,
      m.count ? `gate   p95 ≤ 16.7ms → ${m.p95 <= 16.7 ? 'PASS' : 'FAIL'}` : '',
    ].join('\n');
  }

  return {
    onBeat(beat) {
      render(beat);
      if (beat.n > 0 && beat.n % 60 === 0) {
        const { visible: v, hidden: h } = conductor.metrics();
        const fmt = (m) => m.count ? `p50 ${m.p50.toFixed(1)} p95 ${m.p95.toFixed(1)} max ${m.max.toFixed(1)}ms (${m.count})` : '—';
        console.log(`[uq] beat ${beat.n} | visible ${fmt(v)} | hidden ${fmt(h)} | music drift ${music.driftMs()?.toFixed(1)}ms`);
      }
    },
  };
}
