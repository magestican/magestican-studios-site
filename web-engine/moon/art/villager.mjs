

























import { MeshData } from '../mesh/meshData.mjs';
import * as S from '../mesh/sdf.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { linear, SEASONS } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { createSkeleton, boneIndex } from '../rig/skeleton.mjs';
import { partWeights, rigidWeights, setSkin } from '../rig/skin.mjs';
import { smooth, mix, add, sub, mul, norm } from './kit/character.mjs';
import { strandWithMorphs, eyeVertexCount, eyeMorphs, blushMorph, cheekPoints } from './kit/face.mjs';



const DEFAULT_BLUSH = linear('#f2b4ae');
import { elephant } from './kit/villagers/elephant.mjs';
import { giraffe } from './kit/villagers/giraffe.mjs';
import { panda } from './kit/villagers/panda.mjs';
import { human, BUILDS } from './kit/villagers/human.mjs';
import { generate as generatePlayer } from './player.mjs';

export { BUILDS };





















































export const VILLAGER_VERSION = 12;

export const TIER = 'heroCharacter';



export const VILLAGER_SPECIES = Object.freeze(['elephant', 'giraffe', 'panda', 'human', 'pig']);
const BUILDERS = { elephant, giraffe, panda, human };
const SALT = { elephant: 11, giraffe: 23, panda: 37, human: 53 };

const EYE = linear('#1c1d42');
const EYE_LOW = linear('#36498f');
const HIGHLIGHT = linear('#fff8ec');




export const LODS = Object.freeze([
  Object.freeze({ body: 0.013, cloth: 0.0095, acc: 0.008, small: 0.0045, clothT: 1150, neckT: 400, accT: 440, noseT: 60, eyeT: 100, hiT: 16, sides: 4 }),
  Object.freeze({ body: 0.014, cloth: 0.01, acc: 0.009, small: 0.0055, clothT: 0, neckT: 0, accT: 220, noseT: 30, eyeT: 50, hiT: 10, sides: 3 }),
  Object.freeze({ body: 0.018, cloth: 0.013, acc: 0.012, small: 0.007, clothT: 0, neckT: 0, accT: 0, noseT: 12, eyeT: 18, hiT: 8, sides: 3 }),
]);



export const ROLES = Object.freeze(['villager', 'player']);





export function generate({ seed = 1, season = 'summer', lod = 0, species, role = 'villager', build } = {}) {
  if (!VILLAGER_SPECIES.includes(species)) throw new Error(`unknown villager species '${species}' (villagers: ${VILLAGER_SPECIES.join(', ')})`);
  if (!ROLES.includes(role)) throw new Error(`unknown role '${role}' (roles: ${ROLES.join(', ')})`);
  if (role === 'player' && species !== 'human') throw new Error(`role 'player' is the human's look only, not the ${species}'s`);
  if (build !== undefined && species !== 'human') throw new Error(`build is the human's only, not the ${species}'s`);
  if (build !== undefined && !BUILDS.includes(build)) throw new Error(`unknown build '${build}' (builds: ${BUILDS.join(', ')})`);
  if (species === 'pig') return pigVillager({ seed, season, lod });
  if (!BUILDERS[species]) throw new Error(`villager species '${species}' is not built yet`);
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const budget = budgetFor(TIER, lod);
  const variant = (((seed - 1) % 3) + 3) % 3;
  const humanBuild = species === 'human' ? build ?? (role === 'player' ? 'female' : seed % 2 === 1 ? 'male' : 'female') : undefined;
  const rng = new SeededRng(seed * 7919 + SALT[species] + (role === 'player' ? 101 : 0) + (humanBuild === 'male' ? 211 : 0));
  const fig = BUILDERS[species]({ seed, season, lod, L, variant, rng, fuse: lod > 0, role, build: humanBuild });
  return assemble(species, { seed, season, lod, L, budget, role, build: humanBuild }, fig);
}















function assemble(species, { seed, season, lod, L, budget, role = 'villager', build }, fig) {
  const skeleton = createSkeleton(fig.joints, fig.tails, { extra: fig.extra || [], reparent: fig.reparent || {} });
  const B = (name) => boneIndex(skeleton, name);
  const skinParts = fig.parts.map(([bone, node, blend]) => ({ bone: B(bone), node, blend }));
  const partsFor = (exclude) => skinParts.filter((p) => !exclude.test(skeleton.bones[p.bone].name));
  const parents = skeleton.bones.map((b) => b.parent);
  const skinMaterial = fig.skinMaterial || 'fur';

  const md = new MeshData(`${role === 'player' ? 'player' : 'villager'}-${species}${build ? `-${build}` : ''}-${seed}-${season}-lod${lod}`);
  md.parts = [];
  const plan = [];
  const counts = (m) => new Map([...m.groups].map(([k, g]) => [k, g.positions.length / 3]));
  const track = (rule, emit, name) => {
    const before = counts(md);
    emit();
    plan.push({ before, after: counts(md), rule, name });
  };
  const part = (name, node, lo, hi, cell, target, opts, rule) => {
    if (!(target > 0)) return;
    track(rule, () => md.parts.push({ name, ...S.sdfPart(md, node, { min: lo, max: hi, cell, targetTris: target, ...opts }) }), name);
  };
  const around = (c, r) => [sub(c, [r, r, r]), add(c, [r, r, r])];

  
  
  const { skull } = fig;
  const ER = fig.eyes.ER, s0 = ER[0] / 0.037, s1 = ER[1] / 0.047;
  const eyeBone = { bone: fig.eyes.bone || 'head' };
  fig.eyes.at.forEach((onHead, i) => {
    const side = i === 0 ? 1 : -1;
    const n = norm(add(mul(S.normalAt(skull, ...onHead), 0.72), mul(fig.eyes.look || [0, 0, 1], 0.28)));
    const f = S.frameFromNormal(n, [0, 1, 0]);
    const lid = (o) => S.plane([side * 0.35, -1, 0], o);
    const eyeC = sub(onHead, mul(n, ER[2] * 0.42));
    const eyeFrom = eyeVertexCount(md);
    const lens =S.place(S.paint(S.intersect(0.007, S.ellipsoid([0, 0, 0], ER), lid(ER[1] * 0.77)), { material: 'eye', color: (x, y) => mix(EYE, EYE_LOW, smooth(-0.004, -ER[1] * 0.8, y) * 0.8) }), eyeC, f.X, f.Y, f.Z);
    const [lo, hi] = around(eyeC, ER[1] * 1.6);
    part('eye', lens, lo, hi, L.small, L.eyeT, { scene: skull, uvScale: 0.1, material: 'eye', aoMin: 0.7 }, eyeBone);
    const rimC = sub(eyeC, mul(n, ER[2] * 0.35));
    const rim = S.place(S.paint(S.intersect(0.007, S.ellipsoid([0, 0, 0], [ER[0] * 1.16, ER[1] * 1.15, ER[2] * 0.88]), lid(ER[1] * 0.9)), { material: 'eye', color: fig.eyes.rim || HIGHLIGHT }), rimC, f.X, f.Y, f.Z);
    if (lod < 2) part('eyeRim', rim, ...around(rimC, ER[1] * 1.6), L.small, L.eyeT >> 1, { scene: skull, uvScale: 0.1, material: 'eye', aoMin: 0.6 }, eyeBone);
    const his = [[0.01 * s0, 0.016 * s1, [0.013 * s0, 0.016 * s1, 0.005]], [-0.009 * s0, -0.018 * s1, [0.0065 * s0, 0.0065 * s1, 0.0035]]];
    for (const [hx, hy, r] of his.slice(0, lod === 2 ? 1 : 2)) {
      const hz = ER[2] * Math.sqrt(Math.max(0, 1 - (hx / ER[0]) ** 2 - (hy / ER[1]) ** 2)) - 0.0015;
      const c = add(eyeC, add(mul(f.X, hx), add(mul(f.Y, hy), mul(f.Z, hz))));
      const hiNode = S.place(S.paint(S.ellipsoid([0, 0, 0], r), { material: 'eye', color: HIGHLIGHT }), c, f.X, f.Y, f.Z);
      part('highlight', hiNode, ...around(c, 0.03), Math.min(L.small, 0.0035), L.hiT, { uvScale: 0.1, material: 'eye', aoMin: 1 }, eyeBone);
    }
    eyeMorphs(md, { from: eyeFrom, c: eyeC, X: f.X, Y: f.Y, ER }); 
  });

  for (const r of fig.rigid) {
    part(r.name, r.node, r.box[0], r.box[1], r.cell, r.tris, { scene: fig.scene, uvScale: 0.1, material: r.material, aoMin: r.aoMin ?? 0.6 }, { bone: r.bone });
  }
  for (const c of fig.cloth) {
    
    
    const soft = partsFor(c.exclude).map((p) => (c.soften ? { ...p, blend: (p.blend || 0.03) * c.soften } : p));
    part(c.name, c.node, c.box[0], c.box[1], L.cloth, c.tris, { scene: fig.scene, uvScale: 0.1, material: 'cloth' }, { soft });
  }
  for (const s of fig.strands) {
    const material = s.material || skinMaterial;
    track(s.soft ? { soft: partsFor(s.soft) } : { bone: s.bone || 'head' },
      () => strandWithMorphs(md, { pts: s.pts, radii: s.radii, color: s.color, sides: L.sides, material, morphs: s.morphs }),
      s.name || 'strand');
  }

  
  const wearer = fig.fused.length ? S.union(0.004, [fig.body, ...fig.fused]) : fig.body;
  const groundAO = (x, y, z, c) => mul(c, 0.72 + 0.28 * smooth(0.0, 0.08, y));
  
  
  part('body', wearer, fig.bodyBox[0], fig.bodyBox[1], fig.bodyCell ?? L.body, budget - md.triangleCount - 4, {
    scene: fig.scene, uvScale: 0.28, material: skinMaterial, tint: groundAO, ao: { reach: 0.12, strength: 1.1 }, aoMin: 0.55,
  }, { soft: skinParts });

  
  
  const bodyRun = plan[plan.length - 1];
  const cheeks = fig.blush || { ...cheekPoints(fig.eyes.at, ER), pink: DEFAULT_BLUSH };
  blushMorph(md, { group: skinMaterial, from: bodyRun.before.get(skinMaterial) || 0, to: bodyRun.after.get(skinMaterial), ...cheeks });

  
  for (const { before, after, rule } of plan) {
    for (const [mat, end] of after) {
      const start = before.get(mat) || 0;
      if (end <= start) continue;
      const g = md.groups.get(mat);
      setSkin(g, start, rule.soft ? partWeights(g.positions, rule.soft, { from: start, to: end, parents }) : rigidWeights(end - start, B(rule.bone)));
    }
  }

  
  const minY = md.bounds().min[1];
  
  
  
  const crown = Math.max(...fig.crown.map((p) => p[1]));
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  const lift = (p) => [p[0], p[1] - minY, p[2]];
  const round3 = (v) => Math.round(v * 1000) / 1000;
  md.rig = {
    species,
    bones: skeleton.bones.map((b) => ({ ...b, head: lift(b.head), ...(b.tail ? { tail: lift(b.tail) } : {}) })),
    contacts: fig.contacts,
    hold: lift(fig.hold),
    height_m: round3(crown - minY),
    
    
    top_m: round3(Math.max(md.bounds().max[1], crown - minY)),
    gait: fig.gait,
    
    stretch: fig.stretch,
    
    ...(build ? { build } : {}),
  };
  return md;
}



export function assembleFigure(species, opts, fig) {
  return assemble(species, opts, fig);
}



function pigVillager({ seed, season, lod }) {
  const md = generatePlayer({ seed, season, lod, species: 'pig' });
  const fur = md.groups.get('fur').positions;
  let crown = -Infinity;
  for (let i = 1; i < fur.length; i += 3) crown = Math.max(crown, fur[i]);
  md.rig.height_m = Math.round(crown * 1000) / 1000;
  md.rig.top_m = Math.round(md.bounds().max[1] * 1000) / 1000;
  return md;
}
