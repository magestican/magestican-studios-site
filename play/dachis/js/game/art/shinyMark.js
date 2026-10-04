


import { icon } from '../../engine/ui/icons.js';

export const shinyTag = (d) => (d && (d.shiny === 'white' || d.shiny === 'gold') ? `<span class="shinyMark ${d.shiny}" title="Shiny">${icon('shiny')}</span>` : '');
export function shinySprite(canvas, d) {
  if (d && d.shiny) canvas.classList.add('shinySprite', d.shiny);
  return canvas;
}
