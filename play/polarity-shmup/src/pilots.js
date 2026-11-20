









import { ENDING } from './ending.js';


export const PILOTS = ENDING.slice(0, 4).map(({ id, name, img }) => Object.freeze({ id, name, img }));


export function pilotOf(seat) {
  return PILOTS[seat >= 0 && seat < PILOTS.length ? seat : 0];
}


export function bustImg(doc, seat, px, cls = 'bust') {
  const p = pilotOf(seat);
  const img = doc.createElement('img');
  img.className = cls;
  img.src = p.img;
  img.alt = p.name;
  img.width = px;
  img.height = px;
  img.decoding = 'async';
  return img;
}
