




import { SPECIES } from '../../data/species.js';
import { byRegion } from './manifests.js';

export const HANDY = SPECIES.filter((s) => s.stage >= 2 && s.look && s.look.plan === 'biped');
export const WORK_KINDS = ['washline', 'well', 'cookfire', 'fishrack', 'tools', 'crates', 'pots'];

export const HANDS = byRegion('hands'); 


export function workSpot(W) {
  for (const k of WORK_KINDS) { const o = W.objects.find((q) => q.kind === k); if (o) return { x: o.x, y: o.y, kind: k }; }
  return null;
}
