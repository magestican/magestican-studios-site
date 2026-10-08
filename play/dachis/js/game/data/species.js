

import { U } from '../../engine/core/util.js';
import { familySizeClass, rollSize } from './sizes.js';
import { rollTemper } from './temper.js';


export const MAX_LEVEL = 66;
export const MAX_DAMAGE = 9999;
export const LEVEL_CEILING = 264;

export function capsFor(cycle = 1) {
  if (cycle <= 1) return { maxLevel: 66, maxDamage: 9999, enemyFloor: 0 };
  if (cycle === 2) return { maxLevel: 132, maxDamage: 99999, enemyFloor: 66 };
  return { maxLevel: 264, maxDamage: 99999, enemyFloor: 132 };   
}
export const FAMILY_COUNT = 41;

export const TYPES = {
  Ember: '#ff6a3d', Tide: '#3d9dff', Leaf: '#4fc45a', Spark: '#ffd23d',
  Stone: '#b08b5a', Gale: '#7fd8d2', Frost: '#a9dcff', Shadow: '#7a55b0',
  Light: '#ffe98a', Metal: '#9aa7b5', Beast: '#d98e5b', Spirit: '#e98ad8',
};
export const TYPE_LIST = Object.keys(TYPES);
export const STRONG = {
  Ember: ['Leaf', 'Frost', 'Metal'], Tide: ['Ember', 'Stone'], Leaf: ['Tide', 'Stone'],
  Spark: ['Tide', 'Gale', 'Metal'], Stone: ['Ember', 'Spark', 'Gale'], Gale: ['Leaf', 'Beast'],
  Frost: ['Leaf', 'Gale'], Shadow: ['Spirit', 'Light'], Light: ['Shadow'],
  Metal: ['Frost', 'Stone'], Beast: ['Frost', 'Light'], Spirit: ['Beast', 'Metal'],
};
export function typeMult(atkType, defTypes) {
  let m = 1;
  for (const d of defTypes) {
    if (STRONG[atkType].includes(d)) m *= 2;
    else if (STRONG[d].includes(atkType)) m *= 0.5;
  }
  return m;
}









export const CD = { dash: 4, bolt: 3.5, burst: 7, heal: 12, guard: 10, rage: 12,
  beam: 7, flurry: 6, slam: 7, trap: 8, drain: 6, hex: 6, shield: 11 };
export const MOVE_POOL = {
  Ember: [['Ember Bite', 'dash', 70], ['Cinder Bolt', 'hex', 55], ['Flame Burst', 'burst', 80], ['Magma Roar', 'rage'], ['Blaze Rush', 'flurry', 85]],
  Tide: [['Aqua Jet', 'beam', 65], ['Bubble Shot', 'bolt', 60], ['Tidal Crash', 'slam', 85], ['Mist Veil', 'shield'], ['Rain Mend', 'heal']],
  Leaf: [['Vine Lash', 'dash', 65], ['Seed Shot', 'trap', 70], ['Petal Storm', 'flurry', 75], ['Sap Heal', 'heal'], ['Thorn Guard', 'guard']],
  Spark: [['Volt Tackle', 'dash', 80], ['Zap Bolt', 'hex', 60], ['Thunder Ring', 'trap', 80], ['Overcharge', 'rage']],
  Stone: [['Rock Slam', 'slam', 80], ['Pebble Blast', 'bolt', 60], ['Quake', 'burst', 90], ['Granite Wall', 'guard']],
  Gale: [['Wing Cut', 'flurry', 70], ['Wind Blade', 'bolt', 65], ['Cyclone', 'burst', 80], ['Tailwind', 'rage']],
  Frost: [['Ice Fang', 'dash', 70], ['Frost Needle', 'hex', 55], ['Blizzard', 'burst', 85], ['Frozen Shell', 'shield']],
  Shadow: [['Shade Claw', 'flurry', 75], ['Hex Orb', 'drain', 65], ['Night Bloom', 'trap', 80], ['Dark Pact', 'rage']],
  Light: [['Radiant Rush', 'flurry', 70], ['Prism Ray', 'beam', 75], ['Halo Flash', 'burst', 80], ['Dawn Prayer', 'heal']],
  Metal: [['Gear Crush', 'dash', 75], ['Rivet Gun', 'bolt', 70], ['Servo Slam', 'slam', 85], ['Reboot', 'heal'], ['Plating', 'shield']],
  Beast: [['Pounce', 'dash', 70], ['Roar Wave', 'beam', 60], ['Stampede', 'slam', 85], ['Feral Rage', 'rage']],
  Spirit: [['Soul Tap', 'drain', 65], ['Wisp', 'bolt', 70], ['Spirit Ring', 'burst', 80], ["Friend's Wish", 'heal']],
};
const mkMove = (type, m) => ({ name: m[0], kind: m[1], power: m[2] || 0, type, cd: CD[m[1]] });

export const RARITY = ['common', 'uncommon', 'rare', 'legendary'];


const HAND_FAMILIES = [
  null,
  { names: ['Emberpup', 'Blazhound', 'Infernox'], types: ['Ember'], color: '#ff7a3d', accent: '#ffd23d',
    look: { shape: 'long', ears: 'cat', tail: 'flame', eyes: 'fierce', cyborg: false, pattern: 'belly', wings: false },
    base: { hp: 55, atk: 72, def: 50, spd: 68 }, evo: [16, 36],
    moves: [['Ember', 'Ember Bite'], ['Ember', 'Cinder Bolt'], ['Beast', 'Feral Rage']],
    blurb: 'Its tail flame burns brighter when it is proud of you.' },
  { names: ['Splashkit', 'Tidecat', 'Maelynx'], types: ['Tide'], color: '#3d9dff', accent: '#bff4ff',
    look: { shape: 'round', ears: 'fins', tail: 'lizard', eyes: 'cute', cyborg: false, pattern: 'spots', wings: false },
    base: { hp: 66, atk: 58, def: 64, spd: 58 }, evo: [16, 36],
    moves: [['Tide', 'Aqua Jet'], ['Tide', 'Bubble Shot'], ['Tide', 'Rain Mend']],
    blurb: 'Plays in tide pools. Sings when the moon is full.' },
  { names: ['Sproutle', 'Bramblet', 'Verdragon'], types: ['Leaf'], color: '#5bd16a', accent: '#ff9fd0',
    look: { shape: 'pear', ears: 'leaf', tail: 'leaf', eyes: 'sleepy', cyborg: false, pattern: 'belly', wings: false },
    base: { hp: 70, atk: 60, def: 66, spd: 50 }, evo: [16, 36],
    moves: [['Leaf', 'Vine Lash'], ['Leaf', 'Seed Shot'], ['Leaf', 'Thorn Guard']],
    blurb: 'Naps in sunbeams. The bud on its head blooms when it evolves.' },
];

const SYL_A = ['Mo', 'Ku', 'Pi', 'Ra', 'Zu', 'Ki', 'No', 'Ba', 'Te', 'Gi', 'Lu', 'Fu', 'Do', 'Sa', 'Chi', 'Ya', 'Ro', 'Po', 'Ne', 'Wa', 'Ha', 'Mi', 'Ta', 'Bo', 'Ze', 'Ri', 'Ko', 'Yu', 'Gu', 'Me'];
const SYL_B = ['mo', 'chi', 'pi', 'bu', 'ko', 'ru', 'nya', 'mi', 'ppo', 'ton', 'kin', 'pan', 'rin', 'zo', 'mu', 'la', 'dori', 'pyo', 'ga', 'fi'];
const SUF_2 = ['ron', 'gar', 'dra', 'zor', 'rix', 'mon', 'lith', 'wing', 'dax', 'rok', 'vel', 'thor'];
const SUF_3 = ['ox', 'aurus', 'king', 'nova', 'goth', 'tron', 'dain', 'ragon', 'lord', 'mech', 'zilla', 'seraph'];
const TYPE_LOOK = {
  Ember: { ears: ['cat', 'horns'], tail: ['flame', 'lizard'] }, Tide: { ears: ['fins', 'none'], tail: ['lizard', 'fins'] },
  Leaf: { ears: ['leaf', 'bunny'], tail: ['leaf', 'fluffy'] }, Spark: { ears: ['antenna', 'cat'], tail: ['bolt'] },
  Stone: { ears: ['horns', 'bear'], tail: ['lizard', 'none'] }, Gale: { ears: ['bunny', 'cat'], tail: ['fluffy'] },
  Frost: { ears: ['cat', 'bunny'], tail: ['fluffy', 'lizard'] }, Shadow: { ears: ['horns', 'cat'], tail: ['lizard', 'bolt'] },
  Light: { ears: ['bunny', 'antenna'], tail: ['fluffy'] }, Metal: { ears: ['antenna', 'bear'], tail: ['bolt', 'none'] },
  Beast: { ears: ['bear', 'cat'], tail: ['fluffy', 'lizard'] }, Spirit: { ears: ['bunny', 'antenna'], tail: ['fluffy', 'none'] },
};



function eyeLook(fam) {
  const e = U.rng(U.hash('dachi-eyes-' + fam))();
  return e < 0.2 ? 'visor' : e < 0.6 ? 'cute' : e < 0.8 ? 'sleepy' : 'fierce';
}








export const SPLIT_MODES = ['vertical', 'horizontal', 'diagonal', 'part'];
export const SPLIT_MATS = ['bone', 'metal', 'lamp-glow'];
export const SPLIT_PARTS = ['arm', 'tail', 'ear', 'eye', 'mask', 'wing'];
const PAIRED_EARS = ['cat', 'bunny', 'bear', 'mouse', 'horns', 'fins', 'antenna'];

export function splitParts(look) {
  const out = ['arm', 'mask'];
  if (look.eyes !== 'visor') out.push('eye');
  if (look.tail && look.tail !== 'none') out.push('tail');
  if (PAIRED_EARS.includes(look.ears)) out.push('ear');
  if (look.wings) out.push('wing');
  return out;
}

export function splitLook(fam, look, t1) {
  const r = U.rng(U.hash('dachi-cut-' + fam));
  
  
  
  r(); r(); r();
  const m = r(), q = r(), sd = r() < 0.5 ? -1 : 1;
  const mode = m < 0.24 ? 'vertical' : m < 0.46 ? 'horizontal' : m < 0.7 ? 'diagonal' : 'part';
  const mat = t1 === 'Metal' ? 'metal' : q < 0.45 ? 'metal' : q < 0.84 ? 'bone' : 'lamp-glow';
  if (mode !== 'part') return { mode, mat, side: sd };
  return { mode, mat, side: sd, part: U.pick(r, splitParts(look)) };
}



export function buildLook(fam) {
  const r = U.rng(U.hash('dachi-build-' + fam));
  r(); r(); r();
  const q = (v) => Math.round(v * 100) / 100;
  return { w: q(0.88 + r() * 0.3), t: q(0.88 + r() * 0.32), e: q(0.9 + r() * 0.5) };
}




export const METAL_TINTS = { brass: '#f2c25a', copper: '#f39a66', 'rose gold': '#ffb6bc', 'chrome blue': '#92c2ff',
  gunmetal: '#8190a6', gold: '#ffd84a', 'jade steel': '#74e2bb', 'violet titanium': '#bda4ff', silver: '#e2e8f0' };
export function metalLook(fam, color) {
  const r = U.rng(U.hash('dachi-metal-' + fam)); r(); r(); r();
  
  const ranked = Object.keys(METAL_TINTS).filter((k) => k !== 'silver' && k !== 'gunmetal')
    .sort((a, b) => colourDistance(METAL_TINTS[b], color) - colourDistance(METAL_TINTS[a], color));
  return ranked[Math.floor(r() * 3)];
}



export const TOPPERS = ['floppy', 'lop', 'fennec', 'sprig', 'bobble', 'wingears', 'petals'];





export const BODY_PLANS = ['round', 'quadruped', 'fish', 'bird', 'serpent', 'bug', 'biped', 'plant', 'ghost', 'crab', 'jelly'];
const PLAN_BY_TYPE = {
  Tide: ['fish', 'serpent'], Gale: ['bird'], Leaf: ['plant', 'bug'], Spark: ['bug', 'biped'], Stone: ['quadruped', 'bug'],
  Frost: ['fish', 'quadruped'], Shadow: ['ghost', 'serpent'], Light: ['bird', 'ghost'], Metal: ['biped', 'bug'],
  Beast: ['quadruped', 'biped'], Spirit: ['ghost', 'round'], Ember: ['quadruped', 'serpent'],
};
const HAND_PLAN = { 1: 'quadruped', 2: 'fish', 3: 'plant' };



export const PLAN_OVERRIDE = { 17: 'crab', 38: 'crab', 26: 'jelly', 25: 'jelly' };
function planLook(fam, look, t1, used) {
  if (HAND_PLAN[fam]) return HAND_PLAN[fam];
  if (PLAN_OVERRIDE[fam]) { 
    const old = planLook0(fam, look, t1, used); used[old] = (used[old] || 0) + 1;
    return PLAN_OVERRIDE[fam];
  }
  return planLook0(fam, look, t1, used);
}
function planLook0(fam, look, t1, used) {
  let cands = PLAN_BY_TYPE[t1];
  if (look.wings && t1 !== 'Tide') cands = ['bird', ...cands.filter((p) => p === 'bug' || p === 'ghost')]; 
  const r = U.rng(U.hash('dachi-plan-' + fam)); r(); r(); r();
  const least = Math.min(...cands.map((p) => used[p] || 0));
  const pool = cands.filter((p) => (used[p] || 0) === least);
  return pool[Math.floor(r() * pool.length)];
}










export const EYE_STYLES = ['glossy', 'sleepy', 'beady', 'cyclops', 'fierce', 'compound', 'button', 'visor', 'hidden'];
const EYE_FAVOURITES = {
  ghost: ['hidden', 'cyclops', 'sleepy'], fish: ['beady', 'button', 'glossy'], bird: ['beady', 'fierce', 'sleepy'],
  serpent: ['sleepy', 'fierce', 'beady'], quadruped: ['glossy', 'fierce', 'button'], biped: ['hidden', 'button', 'cyclops', 'glossy'],
  plant: ['sleepy', 'button', 'cyclops'], round: ['glossy', 'button', 'sleepy'],
};
const HAND_EYES = { 1: 'fierce', 2: 'glossy', 3: 'sleepy' };
export function eyeStyleLook(fam, look, used = {}) {
  if (look.eyes === 'visor') return 'visor';
  if (HAND_EYES[fam]) return HAND_EYES[fam];
  if (look.plan === 'bug') return 'compound';
  let cands = EYE_STYLES.filter((s) => s !== 'visor' && s !== 'compound');
  if (look.split && look.split.part === 'eye') cands = cands.filter((s) => s !== 'cyclops' && s !== 'hidden');
  const n = (s) => used[s] || 0, least = Math.min(...cands.map(n));
  let pool = cands.filter((s) => n(s) <= least + 1);
  const fav = pool.filter((s) => (EYE_FAVOURITES[look.plan] || []).includes(s));
  if (fav.length) pool = fav;
  const low = Math.min(...pool.map(n));
  pool = pool.filter((s) => n(s) === low);
  const r = U.rng(U.hash('dachi-eyestyle-' + fam)); r(); r(); r();
  return pool[Math.floor(r() * pool.length)];
}


const SPLIT_OVERRIDE = { 22: { mode: 'part', mat: 'metal', side: -1, part: 'wing' } };


const SIG_OVERRIDE = { 36: 'lamp', 40: 'halo' };


export const SIGNATURES = ['unihorn', 'antlers', 'crest', 'lamp', 'shell', 'spikes', 'mane', 'tuft', 'cheeks',
  'trunk', 'halo', 'scarf', 'gear', 'crystal', 'mushroom', 'bow', 'fin', 'ramhorns'];

export const silhouetteKey = (look) => [look.shape, look.ears, look.tail, look.wings ? 'w' : '-', look.signature].join('|');




export const PALETTE_MIN = 0.07;
export const PALETTE = ['#ff7a3d', '#3d9dff', '#5bd16a', '#ff5a5f', '#ff8fa3', '#e0457b', '#ffb3c6', '#ffa24c', '#ffc27a',
  '#ffd23d', '#fff07a', '#cf970d', '#a8e05f', '#2fb58a', '#8fd9a8', '#9bb04a', '#3fc6c9', '#7fe0e6', '#1e8f96', '#8cc4ff',
  '#4a6fe3', '#2e4a9e', '#9b6bff', '#c9a6ff', '#6a3fb5', '#e878f0', '#b07a4a', '#7a4a30', '#cfb08a', '#f4efe6', '#9aa7b5',
  '#5a5f70', '#34303f', '#c8c2d6', '#a6fffc', '#c0392b', '#2f7d3a', '#ffe0a8', '#8a2be2', '#7b1e3a', '#0e6b5c',
  '#0b1680'];
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function oklab(hex) {
  const s = hex.replace('#', ''), [r, g, b] = [0, 2, 4].map((i) => toLin(parseInt(s.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q];
}
export const colourDistance = (a, b) => { const p = oklab(a), q = oklab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

function proceduralFamily(fam, r, used) {
  const t1 = TYPE_LIST[(fam * 5 + 3) % 12];
  const t2 = r() < 0.45 ? U.pick(r, TYPE_LIST.filter(t => t !== t1)) : null;
  let root;
  do { root = U.pick(r, SYL_A) + U.pick(r, SYL_B); } while (used.has(root));
  const names = [root, root + U.pick(r, SUF_2), root.slice(0, Math.max(2, root.length - 1)) + U.pick(r, SUF_3)];
  const tl = TYPE_LOOK[t1];
  const tot = 220 + Math.floor(r() * 60);
  const w = [r() + 0.6, r() + 0.6, r() + 0.6, r() + 0.6], ws = w[0] + w[1] + w[2] + w[3];
  
  const own = U.shuffle(r, MOVE_POOL[t1]);
  own.sort((a, b) => (b[2] ? 1 : 0) - (a[2] ? 1 : 0));
  const t3 = t2 || U.pick(r, TYPE_LIST.filter(t => t !== t1));
  const third = U.pick(r, MOVE_POOL[t3]);
  return {
    names, types: t2 ? [t1, t2] : [t1],
    color: U.tint(TYPES[t1], (r() - 0.5) * 50, (r() - 0.5) * 20, (r() - 0.5) * 16),
    accent: U.tint(TYPES[t2 || U.pick(r, TYPE_LIST)], 0, 10, 10),
    look: {
      shape: U.pick(r, ['round', 'pear', 'long', 'blob']),
      ears: U.pick(r, tl.ears.concat(['bear', 'cat', 'bunny', 'none'])),
      tail: U.pick(r, tl.tail.concat(['none'])),
      eyes: (r(), eyeLook(fam)), 
      cyborg: t1 === 'Metal' || r() < 0.4,
      pattern: U.pick(r, ['belly', 'spots', 'stripes', 'none', 'belly']),
      wings: t1 === 'Gale' || r() < 0.2,
    },
    base: { hp: Math.round(tot * w[0] / ws), atk: Math.round(tot * w[1] / ws), def: Math.round(tot * w[2] / ws), spd: Math.round(tot * w[3] / ws) },
    evo: [12 + (fam % 9), 30 + (fam % 13)],
    moves: [[t1, own[0][0]], [t1, own[1][0]], [t3, third[0]]],
    blurb: 'A wild dachi of the island. Little is known about it yet.',
  };
}







export const ATTRIBUTES = ['vaccine', 'virus', 'program'];
export const ATTR_COLOR = { vaccine: '#4fc3ff', virus: '#c05ae8', program: '#5ad68d' };
export const ATTR_STRONG = 1.5;   
export const ATTR_REVERSE = 1;    
export const CORRUPT_ATTR = 'virus'; 
export function attrLook(fam, used = {}) {
  const r = U.rng(U.hash('dachi-attr-' + fam)); r(); r(); r();
  const n = (a) => used[a] || 0, least = Math.min(...ATTRIBUTES.map(n));
  const pool = ATTRIBUTES.filter((a) => n(a) <= least + 1);
  return pool[Math.floor(r() * pool.length)];
}
export function attrMult(atk, def) {
  if (atk === 'vaccine' && def === 'virus') return ATTR_STRONG;
  if (atk === 'virus' && def === 'program') return ATTR_STRONG;
  if (atk === 'virus' && def === 'vaccine') return ATTR_REVERSE;
  return 1;   
}
export const attrOf = (d) => (d.corrupt ? CORRUPT_ATTR : speciesById(d.sp).attribute);


const HAND_SIGNATURE = { 1: 'mane', 2: 'fin', 3: 'cheeks' };

export const SPECIES = []; 
(function build() {
  const used = new Set();
  const takenCol = new Set(HAND_FAMILIES.filter(Boolean).map((F) => F.color));
  const evolved = (c) => U.tint(c, 0, 8, -6); 
  const taken3 = [...takenCol].map(evolved);
  const keys = new Set(), sigCount = {};
  const deck = U.shuffle(U.rng(U.hash('dachi-signatures')), SIGNATURES);
  const toppers = U.shuffle(U.rng(U.hash('dachi-toppers')), TOPPERS.concat(TOPPERS));
  let deal = 0, dealTop = 0;
  const planUsed = {}, eyeUsed = {}, attrUsed = {};
  for (let fam = 0; fam < FAMILY_COUNT; fam++) {
    const r = U.rng(U.hash('dachi-family-' + fam));
    const F = HAND_FAMILIES[fam] || proceduralFamily(fam, r, used);
    const t1 = F.types[0];
    if (!F.look.split) F.look.split = SPLIT_OVERRIDE[fam] || splitLook(fam, F.look, t1);
    if (F.look.ears === 'none') F.look.topper = toppers[dealTop++ % toppers.length];
    F.look.plan = planLook(fam, F.look, t1, planUsed); planUsed[F.look.plan] = (planUsed[F.look.plan] || 0) + 1;
    F.look.build = buildLook(fam);
    F.look.eyeStyle = eyeStyleLook(fam, F.look, eyeUsed); eyeUsed[F.look.eyeStyle] = (eyeUsed[F.look.eyeStyle] || 0) + 1;
    if (HAND_FAMILIES[fam]) F.look.signature = HAND_SIGNATURE[fam];
    else {
      
      
      let best = null, bd = 1e9;
      for (const c of PALETTE) {
        if (takenCol.has(c) || taken3.some((t) => colourDistance(evolved(c), t) < PALETTE_MIN)) continue;
        const d = colourDistance(c, F.color); if (d < bd) { bd = d; best = c; }
      }
      if (!best) best = PALETTE.find((c) => !takenCol.has(c)); 
      takenCol.add(best); taken3.push(evolved(best)); F.color = best;
      
      for (let k = 0; k < SIGNATURES.length; k++) {
        const sig = deck[(deal + k) % deck.length];
        if ((sigCount[sig] || 0) >= 3 || keys.has(silhouetteKey({ ...F.look, signature: sig }))) continue;
        F.look.signature = sig; deal += k + 1; break;
      }
    }
    if (SIG_OVERRIDE[fam]) F.look.signature = SIG_OVERRIDE[fam];
    F.look.metal = F.look.metal || metalLook(fam, F.color);
    F.attribute = attrLook(fam, attrUsed); attrUsed[F.attribute] = (attrUsed[F.attribute] || 0) + 1;
    keys.add(silhouetteKey(F.look));
    sigCount[F.look.signature] = (sigCount[F.look.signature] || 0) + 1;
    const rareFamily = fam <= 3 || fam % 10 === 9;
    for (let st = 0; st < 3; st++) {
      used.add(F.names[st]);
      const mult = [1, 1.35, 1.7][st];
      const alt = TYPE_LIST[(fam * 7) % 12];
      const types = st === 2 && F.types.length === 1 && fam >= 4 ? [F.types[0], alt === F.types[0] ? 'Spirit' : alt] : F.types;
      SPECIES.push({
        id: fam * 3 + st + 1, fam, stage: st + 1, name: F.names[st], types, sizeClass: familySizeClass(fam, F.look.plan), 
        color: st === 2 ? U.tint(F.color, 0, 8, -6) : F.color, accent: F.accent, look: F.look,
        base: { hp: Math.round(F.base.hp * mult), atk: Math.round(F.base.atk * mult), def: Math.round(F.base.def * mult), spd: Math.round(F.base.spd * Math.min(mult, 1.4)) },
        evolveAt: st < 2 ? F.evo[st] : null,
        evolvesTo: st < 2 ? fam * 3 + st + 2 : null,
        moves: F.moves.map(([t, n]) => mkMove(t, MOVE_POOL[t].find(m => m[0] === n))),
        rarity: RARITY[Math.min(3, st + (rareFamily ? 1 : 0))], attribute: F.attribute,
        blurb: F.blurb,
      });
    }
  }
})();



const M = (type, name, kind, power) => ({ name, kind, power: power || 0, type, cd: CD[kind] });
export const EXTRA = [];
function extraLine(firstId, names, types, color, accent, look, base, evo, moves, blurb, rarity = 'rare') {
  names.forEach((name, st) => {
    const mult = [1, 1.35, 1.7][st];
    EXTRA.push({
      id: firstId + st, fam: 100 + firstId, stage: st + 1, name, types, color: st === 2 ? U.tint(color, 0, 8, -6) : color, accent, look,
      base: { hp: Math.round(base.hp * mult), atk: Math.round(base.atk * mult), def: Math.round(base.def * mult), spd: Math.round(base.spd * Math.min(mult, 1.4)) },
      evolveAt: st < names.length - 1 ? evo[st] : null, evolvesTo: st < names.length - 1 ? firstId + st + 1 : null,
      moves, rarity, blurb, story: true,
    });
  });
}
extraLine(201, ['Hibone'], ['Ember', 'Spirit'], '#ff8a2a', '#fff3d6',
  { shape: 'long', ears: 'horns', tail: 'lizard', eyes: 'cute', eyeStyle: 'glossy', cyborg: false, skeleton: true, pattern: 'belly', wings: true,
    split: { mode: 'vertical', mat: 'bone', side: -1 }, signature: null, metal: 'silver', plan: 'quadruped' },
  { hp: 120, atk: 140, def: 110, spd: 90 }, [], [M('Ember', 'Bone Blaze', 'dash', 250), M('Ember', 'Guardian Flame', 'bolt', 250), M('Spirit', 'Skyfall Roar', 'burst', 300)],
  'Half dragon, half skeleton, all heart. "I am your guardian."', 'legendary');
extraLine(202, ['Drakobit', 'Drakoborg', 'Drakonaught'], ['Ember', 'Metal'], '#ff5a3a', '#ffd23d',
  { shape: 'long', ears: 'horns', tail: 'flame', eyes: 'fierce', eyeStyle: 'fierce', cyborg: true, pattern: 'belly', wings: true,
    split: { mode: 'diagonal', mat: 'metal', side: 1 }, signature: 'spikes', metal: 'chrome blue', plan: 'quadruped' },
  { hp: 58, atk: 74, def: 58, spd: 62 }, [16, 36], [M('Ember', 'Fire Breath', 'beam', 75), M('Metal', 'Gear Crush', 'dash', 75), M('Ember', 'Magma Roar', 'rage')],
  'POWER. A baby dragon with a cyborg heart. It breathes fire when it hiccups.');
extraLine(205, ['Mimochi', 'Mimosage', 'Mimoracle'], ['Spirit', 'Light'], '#6fb8ff', '#fff3a0',
  { shape: 'round', ears: 'mouse', tail: 'lizard', eyes: 'cute', eyeStyle: 'glossy', cyborg: false, pattern: 'belly', wings: false,
    split: { mode: 'part', mat: 'metal', side: 1, part: 'ear' }, signature: 'goggles', metal: 'brass', plan: 'biped' },
  { hp: 66, atk: 60, def: 60, spd: 66 }, [16, 36], [M('Light', 'Prism Ray', 'beam', 75), M('Spirit', 'Spirit Ring', 'burst', 80), M('Light', 'Dawn Prayer', 'heal')],
  'WISDOM. A round blue mouse that remembers everything it has ever read.');
extraLine(208, ['Sarumage', 'Sarupaladin', 'Sarugallant'], ['Beast', 'Spirit'], '#c98a4a', '#6a5acd',
  { shape: 'pear', ears: 'bear', tail: 'fluffy', eyes: 'cute', eyeStyle: 'glossy', cyborg: false, pattern: 'belly', wings: false, wizardHat: true, armor: true,
    split: { mode: 'part', mat: 'metal', side: -1, part: 'arm' }, signature: null, metal: 'silver', plan: 'biped' }, 
  { hp: 62, atk: 68, def: 64, spd: 62 }, [16, 36], [M('Beast', 'Pounce', 'dash', 70), M('Spirit', 'Soul Tap', 'drain', 65), M('Beast', 'Feral Rage', 'rage')],
  'ADVENTURE. Half monkey, half wizard knight. Always first through the door.');

export const speciesById = id => (id > 300 ? BOSS_SPECIES[id - 301] : id > 200 ? EXTRA.find(s => s.id === id) : SPECIES[id - 1]);








export const BOSSES = [
  { id: 'ashlo', name: 'Cinderwarden Ashlo', region: 1, scale: 0.62, types: ['Ember', 'Beast'], color: '#6d6674', accent: '#ff8a2a',
    look: { shape: 'pear', plan: 'biped', ears: 'cat', tail: 'fluffy', eyes: 'fierce', eyeStyle: 'fierce', pattern: 'belly', wings: false,
      split: { mode: 'vertical', mat: 'bone', side: -1 }, signature: 'mane', metal: 'copper' },
    moves: [['Beast', 'Furnace Charge', 'dash', 85], ['Ember', 'Ash Maw', 'beam', 80], ['Ember', 'Cinder Snare', 'trap', 70]],
    creed: 'Everything that burns ends in ash. Better to burn toward something than to smoulder here forever.' },
  { id: 'leviathrum', name: 'Leviathrum', region: 2, scale: 0.6, types: ['Tide', 'Metal'], color: '#2f5478', accent: '#39e6ff',
    look: { shape: 'long', plan: 'fish', ears: 'fins', tail: 'fins', eyes: 'visor', eyeStyle: 'visor', pattern: 'belly', wings: false,
      split: { mode: 'horizontal', mat: 'metal', side: 1 }, signature: 'fin', metal: 'gunmetal' },
    moves: [['Metal', 'Sonar Lance', 'beam', 85], ['Tide', 'Depth Charge', 'trap', 80], ['Tide', 'Ballast Slam', 'slam', 90]],
    creed: 'The tide erases every footprint. Only those who leave are remembered.' },
  { id: 'bramble', name: 'Mother Bramble', region: 3, scale: 0.6, types: ['Leaf', 'Spirit'], color: '#5a7a3a', accent: '#ffcf40',
    look: { shape: 'pear', plan: 'biped', ears: 'none', tail: 'leaf', eyes: 'sleepy', eyeStyle: 'sleepy', pattern: 'belly', wings: false,
      split: { mode: 'part', mat: 'bone', side: 1, part: 'mask' }, signature: 'antlers', metal: 'jade steel' },
    moves: [['Leaf', 'Root Snare', 'trap', 75], ['Spirit', 'Rot Bloom', 'hex', 70], ['Leaf', 'Sap Drain', 'drain', 75]],
    creed: 'Growth needs rot. Your world is our soil; the new world will be our garden.' },
  { id: 'kingshade', name: 'Kingshade', region: 4, scale: 0.64, types: ['Beast', 'Shadow'], color: '#4a4058', accent: '#9a6cff',
    look: { shape: 'pear', plan: 'biped', ears: 'bear', tail: 'none', eyes: 'fierce', eyeStyle: 'fierce', pattern: 'belly', wings: false, armor: true,
      split: { mode: 'part', mat: 'metal', side: 1, part: 'arm' }, signature: null, metal: 'violet titanium' },
    moves: [['Beast', 'Obsidian Fists', 'flurry', 85], ['Shadow', 'Throne Slam', 'slam', 90], ['Shadow', "Knight's Oath", 'shield']],
    creed: 'A ruler protects his people by leading them out. Staying is cowardice dressed as loyalty.' },
  { id: 'quartz', name: 'The Quartz Hermit', region: 5, scale: 0.58, types: ['Stone', 'Light'], color: '#7a6a8c', accent: '#a8f0ff',
    look: { shape: 'pear', plan: 'biped', ears: 'none', tail: 'none', eyes: 'beady', eyeStyle: 'beady', pattern: 'belly', wings: false,
      split: { mode: 'horizontal', mat: 'bone', side: -1 }, signature: 'goggles', metal: 'brass' },
    moves: [['Light', 'Lens Ray', 'beam', 85], ['Stone', 'Crystal Mine', 'trap', 80], ['Light', 'Glare', 'hex', 70]],
    creed: 'Light is a story told to those afraid of the dark. The god shows us the true dark, and it is peaceful.' },
  { id: 'glacius', name: 'Glacius Rex', region: 6, scale: 0.56, types: ['Frost', 'Metal'], color: '#a8bfd6', accent: '#5fe8ff',
    look: { shape: 'long', plan: 'quadruped', ears: 'none', topper: 'floppy', tail: 'lizard', eyes: 'beady', eyeStyle: 'beady', pattern: 'belly', wings: false,
      split: { mode: 'horizontal', mat: 'metal', side: 1 }, signature: 'trunk', metal: 'chrome blue' },
    moves: [['Metal', 'Tusk Charge', 'dash', 90], ['Frost', 'Frozen Roar', 'burst', 85], ['Frost', 'Permafrost', 'hex', 70]],
    creed: 'Preservation. Freeze the world before it decays; what cannot change cannot suffer.' },
  { id: 'pyrecrown', name: 'Pyrecrown', region: 7, scale: 0.6, types: ['Ember', 'Spirit'], color: '#ff6a2a', accent: '#ffd070',
    look: { shape: 'pear', plan: 'bird', ears: 'none', tail: 'flame', eyes: 'fierce', eyeStyle: 'fierce', pattern: 'belly', wings: false,
      split: { mode: 'vertical', mat: 'bone', side: -1 }, signature: null, metal: 'gold' },
    moves: [['Ember', 'Phoenix Dive', 'slam', 95], ['Ember', "Herald's Pyre", 'burst', 90], ['Spirit', 'Soul Toll', 'drain', 80]],
    creed: 'Suffering is the price of passage. Every dachi that fades pays our fare to paradise.' },
  { id: 'oblivar', name: 'Oblivar, the Hollow Sky', region: 8, scale: 0.66, types: ['Shadow', 'Spirit'], color: '#3a2450', accent: '#ff2a3a',
    look: { shape: 'round', plan: 'ghost', ears: 'horns', tail: 'none', eyes: 'cute', eyeStyle: 'cyclops', pattern: 'belly', wings: false,
      split: { mode: 'vertical', mat: 'metal', side: 1 }, signature: null, metal: 'gunmetal' },
    moves: [['Shadow', 'Hollow Beam', 'beam', 95], ['Spirit', 'Void Hex', 'hex', 80], ['Shadow', 'Promised Land', 'shield']],
    creed: 'Your world had you. Ours had only each other, and it was not enough. Let me in.' },
];


export const BOSS_LEVEL = [18, 25, 31, 39, 44, 50, 56, 64];
export const BOSS_BASE = { hp: 100, atk: 84, def: 78, spd: 62 };
export const BOSS_HP_MUL = 3;
export const BOSS_SPECIES = BOSSES.map((b, i) => ({
  id: 301 + i, fam: 300 + i, stage: 3, name: b.name, types: b.types, color: b.color, accent: b.accent, look: b.look,
  base: { ...BOSS_BASE }, hpMul: BOSS_HP_MUL, evolveAt: null, evolvesTo: null, attribute: 'virus',
  moves: b.moves.map(([type, name, kind, power]) => M(type, name, kind, power)), rarity: 'boss', blurb: b.creed, boss: b.id, level: BOSS_LEVEL[b.region - 1],
}));
export const bossSpecies = (bossId) => BOSS_SPECIES.find((s) => s.boss === bossId);
export const isBoss = (d) => !!speciesById(d.sp).boss;


export const wildFamiliesOf = (types) => [0, ...Array.from({ length: FAMILY_COUNT - 4 }, (_, i) => i + 4)].filter((f) => SPECIES[f * 3].types.some((t) => types.includes(t)));
export const GUARDIAN = 201;
export const STARTERS = { power: 202, wisdom: 205, adventure: 208 };

extraLine(211, ['Kumabo'], ['Metal', 'Spirit'], '#ff9fc8', '#ffe066',
  { shape: 'round', ears: 'bear', tail: 'none', eyes: 'cute', eyeStyle: 'glossy', cyborg: true, pattern: 'heart', wings: false,
    split: { mode: 'vertical', mat: 'metal', side: 1 }, signature: 'bow', metal: 'chrome blue', plan: 'round' },
  { hp: 72, atk: 58, def: 62, spd: 56 }, [], [M('Metal', 'Gear Crush', 'dash', 75), M('Spirit', 'Wisp', 'bolt', 70), M('Spirit', "Friend's Wish", 'heal')],
  'Half teddy bear, half machine. Hugs harder than it looks.');
EXTRA[EXTRA.length - 1].storyOnly = true;
export const KUMABO = 211;



export const STORY_ATTR = { 201: 'vaccine', 202: 'virus', 205: 'program', 208: 'vaccine', 211: 'program' };
for (const s of EXTRA) s.attribute = STORY_ATTR[s.fam - 100];





export const SHINY = { white: { odds: 1 / 100, stat: 1.15 }, gold: { odds: 1 / 500, stat: 1.3 } };
export const rollShiny = (r) => (r < SHINY.gold.odds ? 'gold' : r < SHINY.gold.odds + SHINY.white.odds ? 'white' : null);
export const shinyMul = (d) => (d && SHINY[d.shiny] ? SHINY[d.shiny].stat : 1);
export function statsOf(d) {
  const s = speciesById(d.sp), L = d.lvl, k = shinyMul(d);
  return {
    
    maxHp: d.maxHpOverride || Math.floor((Math.floor(s.base.hp * 2 * L / 100) + L * 2 + 30) * (s.hpMul || 1) * k), 
    atk: Math.floor((Math.floor(s.base.atk * 2 * L / 100) + 5) * k),
    def: Math.floor((Math.floor(s.base.def * 2 * L / 100) + 5) * k),
    spd: Math.floor((Math.floor(s.base.spd * 2 * L / 100) + 5) * k),
  };
}


let UID_SEQ = 1;
export function makeDachi(sp, lvl) {
  const d = { uid: Date.now().toString(36) + '-' + (UID_SEQ++) + '-' + Math.floor(Math.random() * 1e6).toString(36), sp, lvl: U.clamp(lvl, 1, LEVEL_CEILING), xp: 0, hp: 0 };
  d.hp = statsOf(d).maxHp;
  d.size = rollSize(Math.random); 
  d.temper = rollTemper(Math.random); 
  return d;
}
