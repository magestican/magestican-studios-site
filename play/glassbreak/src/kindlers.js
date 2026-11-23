





import { CAST } from './story.js';

const seat = (id, who, colour) => Object.freeze({ id, who, name: CAST.name[who], bio: CAST.message[`${who}-bio`], colour });

export const PILOTS = Object.freeze([
  seat('amber', 'juno', 0xffb347),
  seat('rose', 'pell', 0xff5f8f),
  seat('teal', 'tam', 0x3fe0c5),
  seat('violet', 'ivy', 0xa98bff),
]);


export const SEAT_COLOURS = Object.freeze(PILOTS.map((p) => Object.freeze([(p.colour >> 16) / 255, ((p.colour >> 8) & 255) / 255, (p.colour & 255) / 255])));
export const SEAT_CSS = Object.freeze(PILOTS.map((p) => `#${p.colour.toString(16).padStart(6, '0')}`));


export const SPEAKER_CSS = Object.freeze({
  ...Object.fromEntries(PILOTS.map((p, i) => [p.who, SEAT_CSS[i]])),
  maud: '#ffe2a8',
  vesper: '#9fc4ff',
});
