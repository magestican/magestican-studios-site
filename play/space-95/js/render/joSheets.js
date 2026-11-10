

import { v } from '../site/assetUrl.js';
import { paintedSheet } from './paintedSheet.js';

export const LIVE_DIR = 'assets/art/jo/';

export const PAINTED_SHEETS = { woman: 'assets/art/jo-painted/woman/', man: 'assets/art/jo-painted/man/' };


const cache = new Map();
const json = ( url) => fetch(v(url)).then((r) => r.json());


export function loadJoSheet(variant) {
  const dir = PAINTED_SHEETS[ (variant)] ?? null;
  const key = dir ?? LIVE_DIR;
  if (!cache.has(key)) {
    const live = json(`${LIVE_DIR}jo.sprites.json`);
    cache.set(
      key,
      dir
        ? Promise.all([live, json(`${dir}sheet.json`)]).then(([l, p]) => ({ sheet: paintedSheet(l, p), dir }))
        : live.then((sheet) => ({ sheet, dir: LIVE_DIR })),
    );
  }
  return  (cache.get(key));
}


export const currentVariant = () => (document.documentElement.dataset.variant === 'man' ? 'man' : 'woman');
