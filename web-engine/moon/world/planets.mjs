












































import { draw } from '../economy/math.mjs';
import { fbm3, valueNoise2 } from '../noise.mjs';
import * as MOON from './moonLayout.mjs';

const U32 = 2 ** 32;
const TAU = Math.PI * 2;


export const GENERATED_COUNT = 6;

export const SYSTEM_SEED = 20260916;




















export const PLANET_LAYOUT_VERSION = 3;



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









export const WASH_K = 0.22;
export function washCycle(cycle, weather) {
  if (!weather || (weather.fog === 1 && !weather.tint)) return cycle;
  const out = { ...cycle, fogDensity: cycle.fogDensity * weather.fog };
  if (weather.tint) {
    const t = linearOf(weather.tint);
    const wash = (c) => c.map((v, i) => v + (t[i] - v) * WASH_K);
    for (const k of ['skyZenith', 'skyHorizon', 'skyBelow', 'fogColor']) if (Array.isArray(cycle[k])) out[k] = wash(cycle[k]);
  }
  return out;
}
const linearOf = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
};










export const BIOMES = Object.freeze({
  rolling: Object.freeze({ id: 'rolling', label: 'rolling', tint: '#a8e0a0', tintK: 0.3 }),
  cratered: Object.freeze({ id: 'cratered', label: 'cratered', tint: '#b8aed6', tintK: 0.55 }),
  mesa: Object.freeze({ id: 'mesa', label: 'mesa', tint: '#e0a070', tintK: 0.55 }),
  ridged: Object.freeze({ id: 'ridged', label: 'ridged', tint: '#62c0b0', tintK: 0.5 }),
  dunes: Object.freeze({ id: 'dunes', label: 'dune', tint: '#ecd28a', tintK: 0.6 }),
  lakes: Object.freeze({ id: 'lakes', label: 'lake', tint: '#6cc8a8', tintK: 0.45 }),
});
export const BIOME_IDS = Object.freeze(Object.keys(BIOMES));










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









export const PROPS = Object.freeze({
  rolling: 'giantMushroom', lakes: 'giantMushroom', cratered: 'crystalCluster',
  ridged: 'iceSpike', dunes: 'cactus', mesa: 'deadTree',
});
export const PROP_MODULES = Object.freeze([...new Set(Object.values(PROPS))].sort());
export const PROP = Object.freeze({ density: 0.012, min: 5, max: 12, minGap: 2.0 });



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
  const biome = BIOME_IDS[(id - 1 + (draw(systemSeed, 'biomes') % BIOME_IDS.length)) % BIOME_IDS.length];
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
    
    
    
    biome,
    tint: BIOMES[biome].tint,
    tintK: BIOMES[biome].tintK,
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
  biome: null,            
  tint: null,
  tintK: 0,
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







export function flightsTo(from, to, count = GENERATED_COUNT) {
  const n = count + 1;
  return (((to - from) % n) + n) % n;
}


export const flightsHome = (id, count = GENERATED_COUNT) => flightsTo(id, 0, count);







export function ringView(id, systemSeed = SYSTEM_SEED, count = GENERATED_COUNT) {
  return planetSystem(systemSeed, count).map((planet) => ({
    id: planet.id,
    name: planet.name,
    home: planet.id === 0,
    here: planet.id === id,
    flightsOn: flightsTo(id, planet.id, count),
  }));
}





function rollingOf(planet) {
  const { seed, radius, undulation } = planet;
  const big = radius / 3.2;
  const fine = radius / 9;
  return (x, z) => (fbm3(x / big, seed % 97 / 13, z / big, { octaves: 3, seed: 400 + (seed % 1000) }) - 0.5) * 2 * undulation
    + (valueNoise2(x / fine, z / fine, 500 + (seed % 997)) - 0.5) * 0.22 * undulation;
}





function featuresOf(planet, kind, count, minR, maxR) {
  const { seed, radius } = planet;
  const inner = CLEARING_RADIUS_M + CLEARING_FEATHER_M;
  const outer = radius - planet.rimWidth - EDGE_MARGIN_M;
  const out = [];
  for (let k = 0; k < count * 30 && out.length < count; k++) {
    const r = Math.round((minR + unit(seed, kind, k, 'r') * (maxR - minR)) * 100) / 100;
    const lo = inner + r * 0.6, hi = outer - r * 0.4;
    if (hi <= lo) continue;
    const a = unit(seed, kind, k, 'a') * TAU;
    const d = lo + unit(seed, kind, k, 'd') * (hi - lo);
    const x = Math.round(Math.sin(a) * d * 100) / 100, z = Math.round(Math.cos(a) * d * 100) / 100;
    if (out.some((f) => Math.hypot(f.x - x, f.z - z) < f.r + r + 0.8)) continue;
    out.push(Object.freeze({ x, z, r }));
  }
  return Object.freeze(out);
}





function surfaceOf(planet) {
  const rolling = rollingOf(planet);
  const { seed, radius, undulation } = planet;
  switch (planet.biome) {
    case 'cratered': {
      const craters = featuresOf(planet, 'crater', Math.max(2, Math.round(radius / 6)), 1.6, Math.min(3.6, radius / 5));
      const depth = 0.45 + undulation * 0.4;
      return (x, z) => {
        let h = rolling(x, z) * 0.55;
        for (const c of craters) {
          const q = Math.hypot(x - c.x, z - c.z) / c.r;
          if (q < 1) h -= depth * (1 - q * q) ** 1.5;
          h += depth * 0.4 * Math.exp(-(((q - 1) / 0.28) ** 2));
        }
        return h;
      };
    }
    case 'mesa': {
      
      const step = 0.5 + undulation * 0.2;
      return (x, z) => {
        const t = (rolling(x, z) * 1.7 + undulation) / step;
        const f = Math.floor(t);
        return (f + smoothstep(0.78, 1, t - f)) * step - undulation;
      };
    }
    case 'ridged': {
      const big = radius / 2.6;
      return (x, z) => {
        const n = fbm3(x / big, seed % 89 / 11, z / big, { octaves: 3, seed: 600 + (seed % 1000) });
        const r = 1 - Math.abs(2 * n - 1);
        return (r * r - 0.45) * 2.2 * undulation;
      };
    }
    case 'dunes': {
      const a = unit(seed, 'wind') * Math.PI;
      const ca = Math.cos(a), sa = Math.sin(a);
      const wave = 3.4;
      const amp = 0.25 + undulation * 0.45;
      return (x, z) => {
        const u = x * ca + z * sa;
        const warp = valueNoise2(x / 4, z / 4, 700 + (seed % 991)) * 2.6;
        const s = Math.sin((u / wave) * TAU + warp) * 0.5 + 0.5;
        return (s ** 1.6 - 0.4) * amp + rolling(x, z) * 0.35;
      };
    }
    case 'lakes': {
      const basins = lakeBasinsOf(planet);
      return (x, z) => {
        let h = rolling(x, z) * 0.7;
        for (const b of basins) {
          const k = smoothstep(b.r, b.r * 0.5, Math.hypot(x - b.x, z - b.z));
          h = h * (1 - k) - b.depth * k;
        }
        return h;
      };
    }
    default:
      return rolling;
  }
}

const lakeBasinsOf = (planet) => featuresOf(planet, 'lake', Math.max(1, Math.round(planet.radius / 9)), 2.2, Math.min(4.2, planet.radius / 4.5))
  .map((b) => Object.freeze({ ...b, depth: 0.7 + planet.undulation * 0.3 }));




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

  
  
  
  
  const LAKES = Object.freeze((planet.biome === 'lakes' ? lakeBasinsOf(planet) : []).map((b) => {
    const r = Math.round(b.r * 0.78 * 100) / 100;
    let y = Infinity;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      y = Math.min(y, heightAt(b.x + Math.sin(a) * r, b.z + Math.cos(a) * r));
    }
    return Object.freeze({ x: b.x, z: b.z, r, y: Math.round(y * 1000) / 1000 });
  }));

  let placed = null;
  const layout = {
    planet,
    LAKES,
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
  
  
  const basins = planet.biome === 'lakes' ? lakeBasinsOf(planet) : [];
  
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
      if (basins.some((b) => Math.hypot(b.x - x, b.z - z) < b.r * 0.9)) continue;
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
  
  const module = planet.biome ? PROPS[planet.biome] : null;
  if (module) {
    const want = Math.max(PROP.min, Math.min(PROP.max, Math.round(area * PROP.density)));
    let found = 0;
    for (let k = 0; k < want * 40 && found < want; k++) {
      const a = unit(seed, 'prop', k, 'angle') * TAU;
      const u = unit(seed, 'prop', k, 'radius');
      const d = Math.sqrt((CLEARING_RADIUS_M + 1) ** 2 + u * (maxR ** 2 - (CLEARING_RADIUS_M + 1) ** 2));
      const x = Math.round(Math.sin(a) * d * 100) / 100;
      const z = Math.round(Math.cos(a) * d * 100) / 100;
      if (out.some((p) => Math.hypot(p.x - x, p.z - z) < PROP.minGap)) continue;
      if (basins.some((b) => Math.hypot(b.x - x, b.z - z) < b.r + 0.8)) continue;
      out.push(Object.freeze({
        module, role: 'prop', x, z, y: heightAt(x, z),
        rotY: Math.round(unit(seed, 'prop', k, 'rotY') * TAU * 1000) / 1000,
        seed: 1 + (draw(seed, 'prop', k, 'variant') % 3),
        minGap: PROP.minGap,
      }));
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
