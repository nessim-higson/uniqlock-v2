// DANCE CLIPS — in at :x6, out at :x1 (5 seconds), every 10 seconds.
// Class choreography matches the Rewind: `.show` plays the 300ms reveal wipe
// (direction inherited from #viewContainer), then `.on` holds it visible;
// `.hide` plays the exit wipe. While the player is on, the clock's own wipe
// is suppressed in CSS via :has().

import { VIDEOS, timeOfDay } from './data.js';

export function createClips(player) {
  const videos = [...player.querySelectorAll('video')];
  let active = 0;          // which <video> is front
  let pools = { day: [], night: [] };
  let isOn = false;

  function refill(pool) {
    const list = [...VIDEOS[pool]];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    pools[pool] = list;
  }

  function nextUrl(pool) {
    if (pools[pool].length === 0) refill(pool);
    return pools[pool].pop();
  }

  function preload(pool) {
    const standby = videos[1 - active];
    standby.src = nextUrl(pool);
    standby.load();
  }

  // Run after the 300ms wipe ends. animationend never fires in a hidden tab
  // (CSS animations pause), so a timeout fallback keeps state coherent.
  function afterWipe(fn) {
    let done = false;
    const run = () => { if (!done) { done = true; fn(); } };
    player.addEventListener('animationend', run, { once: true });
    setTimeout(run, 400);
  }

  function show() {
    active = 1 - active;
    const v = videos[active];
    if (v.readyState < 2) { active = 1 - active; return; } // not ready: skip slot
    videos[active].style.display = 'block';
    videos[1 - active].style.display = 'none';
    v.currentTime = 0;
    v.play().catch(() => {});
    isOn = true;
    player.classList.remove('hide');
    player.classList.add('show');
    afterWipe(() => {
      player.classList.add('on');
      player.classList.remove('show');
    });
  }

  function hide(pool) {
    isOn = false;
    player.classList.remove('on');
    player.classList.add('hide');
    afterWipe(() => {
      player.classList.remove('hide');
      videos[active].pause();
      preload(pool);
    });
  }

  return {
    begin(hours) {
      preload(timeOfDay(hours));
    },

    onBeat(beat) {
      const pool = timeOfDay(beat.date.getHours());
      const sec = beat.date.getSeconds() % 10;
      if (sec === 6 && !isOn) show();
      // :x1 is the canonical hide tick; :x2–:x5 catches a clip left on
      // after beats were skipped in a background tab.
      else if (isOn && sec >= 1 && sec <= 5) hide(pool);
    },
  };
}
