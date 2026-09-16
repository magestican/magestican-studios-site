










































import { draw } from '../economy/math.mjs';
import { fbm3, valueNoise2 } from '../noise.mjs';
import * as MOON from './moonLayout.mjs';

const U32 = 2 ** 32;
const TAU = Math.PI * 2;


export const GENERATED_COUNT = 6;

export const SYSTEM_SEED = 20260916;



export const HOME_NAME = 'Lunetta';
export const PLANET_NAMES = Object.freeze([
  'Mirtillo', 'Nocciola', 'Pesca', 'Fiorella', 'Brina', 'Castagna',
  'Zucchero', 'Cannella', 'Prugna', 'Maremma', 'Vaniglia', 'Melagrana',
]);

export const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);





export const WEATHERS = Object.freeze({
  clear: Object.freeze({ id: 'clear', label: 'clear', cover: 1, fog: 1, tint: null }),
  windy: Object.freeze({ id: 'windy', label: 'windy', cover: 0.85, fog: 1.1, tint: '#d9e6f2' }),
  misty: Object.freeze({ id: 'misty', label: 'misty', cover: 0.9, fog: 2.6, tint: '#e2dcef' }),
  rainy: Object.freeze({ id: 'rainy', label: 'rainy', cover: 1.15, fog: 1.9, tint: '#c8d4e8' }),
  snowy: Object.freeze({ id: 'snowy', label: 'snowy', cover: 1.1, fog: 1.7, tint: '#eef2fb' }),
});




const WEATHER_BY_SEASON = Object.freeze({
  spring: Object.freeze(['clear', 'rainy', 'misty', 'windy']),
  summer: Object.freeze(['clear', 'clear', 'windy', 'misty']),
  autumn: Object.freeze(['misty', 'windy', 'rainy', 'clear']),
  winter: Object.freeze(['snowy', 'snowy', 'snowy', 'misty']),
});










export const ELEMENTS = Object.freeze({
  orchard: Object.freeze({
    id: 'orchard', label: 'orchard', modules: Object.freeze(['tree', 'peachTree']), role: 'tree',
    stages: Object.freeze(['fruiting', 'fruiting', 'fruiting', 'young', 'young', 'sapling']),
    density: 0.055, minGap: 3.4,
  }),
  pines: Object.freeze({
    id: 'pines', label: 'pine forest', modules: Object.freeze(['pine']), role: 'tree',
    stages: Object.freeze(['mature', 'mature', 'mature', 'young']),
    density: 0.085, minGap: 2.6,
  }),
  boulders: Object.freeze({ id: 'boulders', label: 'boulders', modules: Object.freeze(['rock']), role: 'rock', density: 0.05, minGap: 2.2 }),
  meadow: Object.freeze({ id: 'meadow', label: 'meadow', modules: Object.freeze([]), role: 'forage', density: 0.045, minGap: 2.8 }),
});
export const ELEMENT_IDS = Object.freeze(Object.keys(ELEMENTS));



export const ROCK_SCALE = Object.freeze({ min: 0.65, max: 1.45 });

const FORAGE_KINDS = Object.freeze(['mushroom', 'berries', 'dig']);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const unit = (seed, ...keys) => draw(seed, ...keys) / U32;
const pickFrom = (list, seed, ...keys) => list[draw(seed, ...keys) % list.length];





export function makePlanet(id, systemSeed = SYSTEM_SEED) {
  const seed = draw(systemSeed, 'planet', id) >>> 0;
  
  
  
  const radius = Math.round((13 + unit(seed, 'radius') * 17) * 2) / 2;
  const season = pickFrom(SEASONS, seed, 'season');
  const weather = WEATHERS[pickFrom(WEATHER_BY_SEASON[season], seed, 'weather')];
  
  
  
  
  
  const first = ELEMENT_IDS[(id - 1 + ELEMENT_IDS.length) % ELEMENT_IDS.length];
  const rest = ELEMENT_IDS.filter((e) => e !== first);
  const second = pickFrom(rest, seed, 'element', 1);
  const elements = unit(seed, 'elementCount') < 0.65
    ? Object.freeze([first, second])
    : Object.freeze([first]);
  return Object.freeze({
    id,
    home: false,
    name: PLANET_NAMES[(id - 1 + PLANET_NAMES.length) % PLANET_NAMES.length],
    seed,
    radius,
    
    
    rimWidth: Math.round(radius * 0.11 * 10) / 10,
    
    
    undulation: Math.round((0.35 + unit(seed, 'hills') * 0.75) * 100) / 100,
    season,
    weather,
    elements,
  });
}


export const HOME = Object.freeze({
  id: 0,
  home: true,
  name: HOME_NAME,
  seed: 1,
  radius: MOON.ISLAND_RADIUS,
  rimWidth: MOON.RIM_WIDTH,
  undulation: MOON.UNDULATION,
  season: null,          
  weather: WEATHERS.clear,
  elements: Object.freeze(['orchard', 'meadow']),
  layout: MOON,
});

const systems = new Map();


export function planetSystem(systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  const key = `${systemSeed}|${count}`;
  if (!systems.has(key)) {
    const list = [HOME];
    for (let i = 1; i <= count; i++) list.push(makePlanet(i, systemSeed));
    systems.set(key, Object.freeze(list));
  }
  return systems.get(key);
}


export function planetAt(id, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  const list = planetSystem(systemSeed, count);
  return list[id] || list[0];
}






export function nextPlanetId(id, step = 1, count = GENERATED_COUNT) {
  const n = count + 1;
  return (((id + step) % n) + n) % n;
}





function surfaceOf(planet) {
  const { seed, radius, undulation } = planet;
  const big = radius / 3.2;
  const fine = radius / 9;
  return (x, z) => (fbm3(x / big, seed % 97 / 13, z / big, { octaves: 3, seed: 400 + (seed % 1000) }) - 0.5) * 2 * undulation
    + (valueNoise2(x / fine, z / fine, 500 + (seed % 997)) - 0.5) * 0.22 * undulation;
}




export const CLEARING_RADIUS_M = 3.2;
const CLEARING_FEATHER_M = 2.6;






const layouts = new Map();
export function layoutOf(planet) {
  if (planet.home) return MOON;
  if (layouts.has(planet.id)) return layouts.get(planet.id);
  const built = buildLayout(planet);
  layouts.set(planet.id, built);
  return built;
}

function buildLayout(planet) {
  const R = planet.radius;
  const RIM = planet.rimWidth;
  const surface = surfaceOf(planet);

  const surfaceHeight = (x, z) => {
    const h = surface(x, z);
    
    const flat = smoothstep(0, CLEARING_FEATHER_M, Math.hypot(x, z) - CLEARING_RADIUS_M);
    return h * flat;
  };

  const rimDrop = (r) => {
    const t = (r - (R - RIM)) / RIM;
    if (t <= 0) return 0;
    const c = Math.min(1, t);
    return RIM * (1 - Math.sqrt(1 - c * c)) * 0.9;
  };

  const heightAt = (x, z) => {
    const r = Math.hypot(x, z);
    return surfaceHeight(x, z) * (1 - smoothstep(R - RIM * 1.4, R, r)) - rimDrop(r);
  };

  const normalAt = (x, z, e = 0.25) => {
    const dx = heightAt(x + e, z) - heightAt(x - e, z);
    const dz = heightAt(x, z + e) - heightAt(x, z - e);
    const nx = -dx, ny = 2 * e, nz = -dz;
    const l = Math.hypot(nx, ny, nz);
    return [nx / l, ny / l, nz / l];
  };

  let placed = null;
  const layout = {
    planet,
    ISLAND_RADIUS: R,
    RIM_WIDTH: RIM,
    UNDULATION: planet.undulation,
    
    FOCUS: Object.freeze({
      x: 0, z: 0,
      desktop: Object.freeze({ x: 0, z: 0, halfWidth: 7.4, yaw: 0 }),
      portrait: Object.freeze({ x: 0, z: 0, halfWidth: 3.4, yaw: 0 }),
    }),
    
    
    PATHS: Object.freeze([]),
    PATH_MAX_POINTS: MOON.PATH_MAX_POINTS,
    PATH_HALF_WIDTH: MOON.PATH_HALF_WIDTH,
    PARCEL: Object.freeze({ minX: 1e4, maxX: 1e4, minZ: 1e4, maxZ: 1e4, gateX: 1e4, gateWidth: 0 }),
    pathDistance: () => Infinity,
    parcelDistance: () => Infinity,
    surfaceHeight,
    rimDrop,
    heightAt,
    normalAt,
    placements: () => (placed || (placed = placementsOf(planet, heightAt))),
  };
  return layout;
}



const EDGE_MARGIN_M = 2.2;










export function placementsOf(planet, heightAt = layoutOf(planet).heightAt) {
  const { seed, radius } = planet;
  const maxR = radius - planet.rimWidth - EDGE_MARGIN_M;
  const out = [];
  
  const area = Math.PI * (maxR * maxR - CLEARING_RADIUS_M * CLEARING_RADIUS_M);
  for (const id of planet.elements) {
    const el = ELEMENTS[id];
    const want = Math.max(1, Math.round(area * el.density / planet.elements.length));
    let found = 0;
    for (let k = 0; k < want * 40 && found < want; k++) {
      const a = unit(seed, id, k, 'angle') * TAU;
      const u = unit(seed, id, k, 'radius');
      
      const d = Math.sqrt(CLEARING_RADIUS_M ** 2 + u * (maxR ** 2 - CLEARING_RADIUS_M ** 2));
      const x = Math.round(Math.sin(a) * d * 100) / 100;
      const z = Math.round(Math.cos(a) * d * 100) / 100;
      if (out.some((p) => Math.hypot(p.x - x, p.z - z) < Math.max(el.minGap, p.minGap || 0))) continue;
      if (el.role === 'forage') {
        out.push(Object.freeze({
          module: null, role: 'forage', kind: FORAGE_KINDS[draw(seed, id, k, 'kind') % FORAGE_KINDS.length],
          x, z, y: heightAt(x, z), rotY: 0, seed: 1, minGap: el.minGap,
        }));
      } else {
        const module = pickFrom(el.modules, seed, id, k, 'module');
        const stage = el.stages ? pickFrom(el.stages, seed, id, k, 'stage') : undefined;
        const scale = el.role === 'rock'
          ? Math.round((ROCK_SCALE.min + unit(seed, id, k, 'scale') * (ROCK_SCALE.max - ROCK_SCALE.min)) * 100) / 100
          : undefined;
        out.push(Object.freeze({
          module, role: el.role, x, z, y: heightAt(x, z),
          rotY: Math.round(unit(seed, id, k, 'rotY') * TAU * 1000) / 1000,
          seed: 1 + (draw(seed, id, k, 'variant') % 3),
          ...(stage ? { stage } : {}),
          ...(scale ? { scale } : {}),
          minGap: el.minGap,
        }));
      }
      found += 1;
    }
  }
  return Object.freeze(out);
}


export function forageOn(planet) {
  const spots = [];
  for (const p of layoutOf(planet).placements()) {
    if (p.role !== 'forage') continue;
    spots.push(Object.freeze({
      id: spots.length, type: p.kind, x: p.x, z: p.z,
      r: p.kind === 'berries' ? 0.5 : 0.4,
    }));
  }
  return Object.freeze(spots);
}


export function landingOn(planet) {
  const layout = layoutOf(planet);
  return Object.freeze({ x: 0, z: 0, y: layout.heightAt(0, 0), heading: 0 });
}





export function describe(planet) {
  if (planet.home) return `${planet.name} - home`;
  const names = planet.elements.map((e) => ELEMENTS[e].label);
  const of = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `${planet.name} - a ${planet.weather.label} ${planet.season} world of ${of}`;
}
