






































import { CREATURE_ATLAS_PARTS } from './tools/creatureAtlas.mjs';

















export const CREATURE_UV_MAP = Object.freeze({
  chicken: Object.freeze({
    torso: 'torso',
    wingL: 'wing',
    wingR: 'wing',
    tail: 'tail',
    neck: 'neck',
    head: 'head',
    beak: 'head',
    comb: 'comb',
    eyeL: 'head',
    eyeR: 'head',
    legL: 'leg',
    legR: 'leg',
  }),
  porker: Object.freeze({
    torso: 'torso',
    armL: 'arm',
    armR: 'arm',
    head: 'head',
    earL: 'ear',
    earR: 'ear',
    eyeL: 'head',
    eyeR: 'head',
    snout: 'snout',
    legL: 'leg',
    legR: 'leg',
  }),
  cow: Object.freeze({
    torso: 'torso',
    udder: 'udder',
    tentacleL: 'tentacle',
    tentacleL1: 'tentacle',
    tentacleL2: 'tentacle',
    tentacleR: 'tentacle',
    tentacleR1: 'tentacle',
    tentacleR2: 'tentacle',
    head: 'head',
    hornL: 'horn',
    hornR: 'horn',
    earL: 'head',
    earR: 'head',
    eyeL: 'head',
    eyeR: 'head',
    legL: 'leg',
    legR: 'leg',
    tail: 'tail',
  }),
  horse: Object.freeze({
    barrel: 'barrel',
    tail: 'tail',
    neckC: 'neck',
    neckL: 'neck',
    neckR: 'neck',
    legFL: 'leg',
    legFR: 'leg',
    legHL: 'leg',
    legHR: 'leg',
    eyeCa: 'neck',
    eyeCb: 'neck',
    eyeLa: 'neck',
    eyeLb: 'neck',
    eyeRa: 'neck',
    eyeRb: 'neck',
  }),
});



export function unmappedCreatureParts(species, parts) {
  const map = CREATURE_UV_MAP[species] || {};
  return parts.map((p) => p.name).filter((n) => !map[n]);
}


export function danglingAtlasParts(species) {
  const map = CREATURE_UV_MAP[species] || {};
  const have = new Set(CREATURE_ATLAS_PARTS[species] || []);
  return [...new Set(Object.values(map))].filter((p) => !have.has(p));
}






export function zoneOf(mesh) {
  let lo = Infinity; let hi = -Infinity;
  for (let i = 1; i < mesh.uvs.length; i += 2) {
    const v = mesh.uvs[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!(hi > lo)) return [lo || 0, (lo || 0) + 0.02];
  return [lo, Math.max(hi, lo + 0.02)];
}









export function remapCreatureUvs(species, name, mesh, rects) {
  const partName = (CREATURE_UV_MAP[species] || {})[name];
  if (!partName) throw new Error(`creatureUv: ${species} has no atlas mapping for part "${name}"`);
  const rect = rects[partName];
  if (!rect) throw new Error(`creatureUv: the ${species} atlas has no part "${partName}" (for "${name}")`);
  const [z0, z1] = zoneOf(mesh);
  const zh = (z1 - z0) || 1;
  const out = mesh.uvs.slice();
  const I = mesh.indices;
  const u = [0, 0, 0]; const v = [0, 0, 0]; const ids = [0, 0, 0];
  for (let t = 0; t + 2 < I.length; t += 3) {
    for (let k = 0; k < 3; k += 1) {
      ids[k] = I[t + k];
      u[k] = mesh.uvs[ids[k] * 2];
      v[k] = (mesh.uvs[ids[k] * 2 + 1] - z0) / zh;
    }
    const lo = Math.min(u[0], u[1], u[2]); const hi = Math.max(u[0], u[1], u[2]);
    const flatV = Math.abs(v[0] - v[1]) < 1e-9 && Math.abs(v[1] - v[2]) < 1e-9;
    const distinct = new Set([u[0].toFixed(6), u[1].toFixed(6), u[2].toFixed(6)]).size;
    let collapse = false;
    if (flatV) collapse = true;                              
    else if (distinct === 2 && hi - lo > 0.5) {              
      for (let k = 0; k < 3; k += 1) if (u[k] < 0.5) u[k] += 1;
    } else if (hi - lo > 0.5) collapse = true;               
    for (let k = 0; k < 3; k += 1) {
      const uu = collapse ? 0.5 : u[k];
      const vv = collapse ? 0.5 : Math.max(0, Math.min(1, v[k]));
      out[ids[k] * 2] = rect.u0 + uu * (rect.u1 - rect.u0);
      out[ids[k] * 2 + 1] = rect.v0 + vv * (rect.v1 - rect.v0);
    }
  }
  return out;
}





export function creatureAtlasUvs(species, parts, rects) {
  return parts.map((p) => ({ ...p, mesh: { ...p.mesh, uvs: remapCreatureUvs(species, p.name, p.mesh, rects) } }));
}
