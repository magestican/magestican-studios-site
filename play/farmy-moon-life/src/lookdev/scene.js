









import * as THREE from 'three';
import { MeshData, compose, translate, rotateY, scale } from 'moon/mesh/meshData.mjs';
import * as MOON from 'moon/world/moonLayout.mjs';
import { generate as generateGround } from 'moon/art/moonGround.mjs';
import { toObject3D } from '../render/toMesh.js';
import { groundMaterial } from '../render/ground.js';
import { createGroundCover } from '../render/cover.js';


const COVER_COUNT = 1500;
const FAR_LOD_DISTANCE = 24;























const ART = Object.freeze({
  cat: () => import('moon/art/cat.mjs'),
  cottage: () => import('moon/art/cottage.mjs'),
  decor: () => import('moon/art/decor.mjs'),
  fence: () => import('moon/art/fence.mjs'),
  firepit: () => import('moon/art/firepit.mjs'),
  forageSpot: () => import('moon/art/forageSpot.mjs'),
  groundCover: () => import('moon/art/groundCover.mjs'),
  insect: () => import('moon/art/insect.mjs'),
  item: () => import('moon/art/item.mjs'),
  lamp: () => import('moon/art/lamp.mjs'),
  mole: () => import('moon/art/mole.mjs'),
  moonGround: () => import('moon/art/moonGround.mjs'),
  parcelSign: () => import('moon/art/parcelSign.mjs'),
  peachTree: () => import('moon/art/peachTree.mjs'),
  pine: () => import('moon/art/pine.mjs'),
  player: () => import('moon/art/player.mjs'),
  processor: () => import('moon/art/processor.mjs'),
  rock: () => import('moon/art/rock.mjs'),
  shop: () => import('moon/art/shop.mjs'),
  townBuilding: () => import('moon/art/townBuilding.mjs'),
  tree: () => import('moon/art/tree.mjs'),
  villager: () => import('moon/art/villager.mjs'),
  villagerHome: () => import('moon/art/villagerHome.mjs'),
  
  
  
  
  
  
  
  'kit/decor/fountain': () => import('moon/art/kit/decor/fountain.mjs'),
  'kit/decor/picnicTable': () => import('moon/art/kit/decor/picnicTable.mjs'),
  'kit/decor/signpost': () => import('moon/art/kit/decor/signpost.mjs'),
  'kit/decor/well': () => import('moon/art/kit/decor/well.mjs'),
});


export const ART_NAMES = Object.freeze(Object.keys(ART));

async function loadArt(name) {
  const load = ART[name];
  if (!load) return { missing: `${name} (not written yet)` };
  try {
    const mod = await load();
    if (typeof mod.generate !== 'function') return { missing: `${name} (no generate export)` };
    return { mod };
  } catch (e) {
    return { missing: `${name} (failed to load: ${e.message})` };
  }
}

const apply = (m, [x, y, z]) => [
  m[0] * x + m[1] * y + m[2] * z + m[3],
  m[4] * x + m[5] * y + m[6] * z + m[7],
  m[8] * x + m[9] * y + m[10] * z + m[11],
];



export function lightSourcesOf(data, m, kind) {
  const g = data.groups.get(kind === 'lamp' ? 'lamp-glow' : 'fire');
  let local;
  if (g && g.positions.length) {
    let x = 0, y = 0, z = 0;
    const n = g.positions.length / 3;
    for (let i = 0; i < g.positions.length; i += 3) { x += g.positions[i]; y += g.positions[i + 1]; z += g.positions[i + 2]; }
    local = [x / n, y / n, z / n];
  } else {
    const b = data.bounds();
    local = kind === 'lamp'
      ? [(b.min[0] + b.max[0]) / 2, b.max[1] - 0.35, (b.min[2] + b.max[2]) / 2]
      : [(b.min[0] + b.max[0]) / 2, b.min[1] + 0.45, (b.min[2] + b.max[2]) / 2];
  }
  const [x, y, z] = apply(m, local);
  return [{ x, y, z, kind }];
}











export async function buildMoonScene({
  scene, state, settings, fml, skipRoles = [], skipModules = [],
  layout = MOON, season = state.season, coverCount = COVER_COUNT, name = 'moon',
}) {
  const skip = new Set(skipRoles);
  const skipModule = new Set(skipModules);
  const FOCUS = layout.FOCUS;
  
  
  const P = layout.placements().filter((p) => p.module && !skip.has(p.role) && !skipModule.has(p.module));
  const names = [...new Set(P.map((p) => p.module))];
  const mods = {};
  await Promise.all(names.map(async (n) => {
    const r = await loadArt(n);
    if (r.mod) mods[n] = r.mod; else fml.missing.push(r.missing);
  }));

  const props = new MeshData('moon-props');
  const cache = new Map();
  const sources = [];
  const counts = {};
  for (const p of P) {
    const mod = mods[p.module];
    if (!mod) continue;
    const lod = Math.hypot(p.x - FOCUS.x, p.z - FOCUS.z) > FAR_LOD_DISTANCE ? 1 : 0;
    let stage = p.stage;
    if (stage && Array.isArray(mod.STAGES) && !mod.STAGES.includes(stage)) {
      fml.notes.push(`${p.module} has no stage '${stage}', used its default`);
      stage = undefined;
    }
    const key = `${p.module}|${p.seed}|${stage}|${lod}`;
    let data = cache.get(key);
    if (!data) {
      try {
        data = mod.generate({ seed: p.seed, season, stage, lod });
      } catch (e) {
        fml.missing.push(`${p.module} (generate threw: ${e.message})`);
        mods[p.module] = null;
        continue;
      }
      fml.problems.push(...data.validate());
      cache.set(key, data);
    }
    let rot = p.rotY;
    if (p.role === 'fence') {
      const b = data.bounds();
      if (b.max[2] - b.min[2] > b.max[0] - b.min[0]) rot += Math.PI / 2;
    }
    const s = p.scale ? Math.max(0.6, Math.min(1.5, p.scale)) : 1;
    const m = compose(translate(p.x, p.y, p.z), compose(rotateY(rot), scale(s)));
    props.append(data, m);
    counts[p.module] = (counts[p.module] || 0) + 1;
    if (p.role === 'lamp' || p.role === 'fire') sources.push(...lightSourcesOf(data, m, p.role === 'lamp' ? 'lamp' : 'fire'));
  }
  fml.problems = [...new Set(fml.problems)];
  fml.placed = counts;

  const root = new THREE.Group();
  root.name = name;
  if (props.triangleCount) {
    const obj = await toObject3D(props);
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    root.add(obj);
  }

  const ground = generateGround({ seed: 1, season, lod: settings.effects >= 0.6 ? 0 : 1, layout });
  fml.problems.push(...ground.validate());
  const groundObj = await toObject3D(ground, { materials: { grass: groundMaterial({ season, layout }) }, castShadow: false });
  groundObj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  root.add(groundObj);

  const cover = await createGroundCover({ season, count: Math.round(coverCount * settings.effects), layout });
  fml.problems.push(...cover.problems);
  root.add(cover.group);

  fml.triangles += props.triangleCount + ground.triangleCount + cover.triangles;
  fml.breakdown = { props: props.triangleCount, ground: ground.triangleCount, cover: cover.triangles, coverInstances: cover.count };
  scene.add(root);
  
  
  
  
  return { root, sources, focus: FOCUS, layout, cover, coverEffects: settings.effects };
}
