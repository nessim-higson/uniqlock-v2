// CLOCK FACES — faithful port of the Rewind wipe mechanism.
// Both faces always show the same time. Each beat rewrites the direction
// class on #viewContainer; because the animation-name changes every tick,
// the 300ms clip-path wipe on #time2 restarts without reflow hacks.

import { HOUR_COLORS, timeOfDay } from './data.js';

const DIRECTIONS = ['top-to-bottom', 'right-to-left', 'bottom-to-top', 'left-to-right'];

export function createClock(viewContainer) {
  const faces = ['time1', 'time2'].map((id) => {
    const el = document.getElementById(id);
    return {
      digits: ['h1', 'h2', 'm1', 'm2', 's1', 's2'].map((c) => el.querySelector(`.${c}`)),
    };
  });

  let count = 0;
  let currentHour = -1;

  function setColor(hours) {
    const [r, g, b] = HOUR_COLORS[hours];
    document.documentElement.style.setProperty('--color_1', `rgb(${r},${g},${b})`);
  }

  return {
    onBeat(beat) {
      const d = beat.date;
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      const vals = [h[0], h[1], m[0], m[1], s[0], s[1]];

      for (const face of faces) {
        face.digits.forEach((el, i) => {
          if (el.textContent !== vals[i]) el.textContent = vals[i];
        });
      }

      if (d.getHours() !== currentHour) {
        currentHour = d.getHours();
        setColor(currentHour);
      }

      viewContainer.className = `${timeOfDay(currentHour)} ${DIRECTIONS[count]}`;
      count = (count + 1) % 4;
    },
  };
}
