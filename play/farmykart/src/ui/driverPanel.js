













import { statBars } from 'arbelo/kartTuning';
import { hex } from '../palette.js';

const bar = (label, v) => `<span class="stat"><i>${label}</i><b><u style="width:${
  Math.round(Math.max(0.06, v) * 100)}%"></u></b></span>`;





export function driverPanelHtml(c) {
  const bars = statBars(c);
  return `
    <div>
      <span class="char-swatch" style="background:${hex(c.tint)}"></span>
      <span class="char-name">${c.name}</span>
      <span class="char-species">${c.species}</span>
      <span class="char-blurb">${c.blurb}</span>
    </div>
    <span class="stats">
      ${bar('Speed', bars.speed)}
      ${bar('Accel', bars.accel)}
      ${bar('Turn', bars.handling)}
      ${bar('Grip', bars.grip)}
      ${bar('Weight', bars.weight)}
    </span>`;
}
