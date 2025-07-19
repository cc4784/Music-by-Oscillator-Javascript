import { audioCtx } from './audioContext.js';
import { currentKey } from './scheduler.js';
import { render } from './visuals.js';
import { scheduleFixedChordLoop } from './scheduler.js';

document.body.style.transition = "background-color 2s ease";
document.body.style.backgroundColor = `hsl(${Math.floor(Math.random() * 360)}, 20%, 5%)`;

window.addEventListener("keydown", () => {
  if (audioCtx.state !== 'running') audioCtx.resume();
  scheduleFixedChordLoop();
}, { once: true });

render(currentKey);
