












import { BOSSES, bossSpecies } from '../../data/species.js';
import { nextLair } from '../world/lairs.js';





export const POCKETS = {
  1: { sec: 'ember-b', name: 'the Magma Hall' },
  2: { sec: 'kelp-maze', name: 'the Kelp Maze' },
  3: { sec: 'tree-roots', name: 'the Roots' },
  4: { sec: 'gale-ledges', name: 'the Gale Ledges' },
  5: { sec: 'mine-workings', name: 'the Old Workings' },
  6: { sec: 'steam-vents', name: 'the Steam Vents' },
  7: { sec: 'cinder-cistern', name: 'the Cinder Cistern' },
};

const bossRow = (boss) => BOSSES.find((b) => b.id === boss) || null;

export const pocketFor = (boss) => { const b = bossRow(boss); return (b && POCKETS[b.region]) || null; };


export const bossLevel = (boss, floor = 0) => { const s = bossSpecies(boss); return s ? Math.max(s.level, floor) : 0; };

export const topLevel = (party) => Math.max(0, ...(party || []).map((d) => d.lvl || 0));



export function recordLoss(flags, boss) {
  const lost = { ...(flags.bossLost || {}) };
  lost[boss] = (lost[boss] || 0) + 1;
  flags.bossLost = lost;
  return lost[boss];
}







export function lossHelp({ boss, losses, party, lead = '', floor = 0 }) {
  const row = bossRow(boss);
  if (!row) return [];
  const name = row.name.split(',')[0], bl = bossLevel(boss, floor), top = topLevel(party), pocket = pocketFor(boss);
  if (top < bl) {
    return [`(${name} is level ${bl}. My best one's only ${top}.)`,
      pocket ? `(The wild ones in ${pocket.name} are tougher. We train there first.)` : '(We gotta train first.)'];
  }
  if (losses < 2) return [];
  const vax = (party || []).find((d) => d.attr === 'vaccine');
  if (vax && vax.name === lead) return []; 
  return [`(${name} fights like a virus, and vaccines clobber viruses.)`,
    vax ? `(${vax.name} is a vaccine. Swap ${vax.name} in, quick.)` : '(We need a vaccine dachi.)'];
}



export function trainGoal(flags, party, floor = 0) {
  const l = nextLair(flags || {});
  if (!l || !(flags.bossLost && flags.bossLost[l.boss])) return null;
  const bl = bossLevel(l.boss, floor);
  if (topLevel(party) >= bl) return null;
  const pocket = pocketFor(l.boss);
  return pocket ? `Train to level ${bl} in ${pocket.name}` : `Train to level ${bl}`;
}



export const cameBack = (flags) => Object.keys((flags && flags.bossLost) || {}).some((id) => !!flags['boss_' + id]);
