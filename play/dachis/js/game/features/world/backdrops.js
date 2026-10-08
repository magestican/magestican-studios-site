




import { BACKDROPS } from './backdropIndex.js';
import { lookName } from '../../art/look/celRules.js';
import { createBackdrop } from '../../../engine/iso/backdrop.js';

const OFF = typeof location !== 'undefined' && (/[?&]backdrop=0\b/.test(location.search) || lookName(location.search) !== 'cel');
export const backdropOf = (region) => (OFF ? null : BACKDROPS[region] || null);

let bd = null, want = null, ready = true, token = 0, job = Promise.resolve();
export function initBackdrops(stage) { if (!bd) bd = createBackdrop(stage); return bd; }



export function enterBackdrop(region, section) {
  const b = bd && backdropOf(region), meta = b && b.sections[section];
  const key = meta ? region + '/' + section : null;
  if (key === want) return job;
  want = key;
  return (job = swap(meta, region, ++token));
}
async function swap(meta, region, mine) {
  if (!meta) { if (bd) bd.show(null); ready = true; return; }
  ready = false;
  try {
    const loaded = await bd.load(`assets/maps/${region}/`, meta);
    if (mine !== token) return; 
    bd.show(loaded);
  } catch (e) {
    console.error(e);
    if (mine === token) bd.show(null);
  }
  if (mine === token) ready = true;
}

export const backdropWaiting = () => !ready;
