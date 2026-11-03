



export const ART_ROOT = 'art/';


export const BUDGET = { stageBytes: 15 * 1024 * 1024, textureEdge: 1024, modelTris: 6000, loadTimeoutMs: 8000 };





export const FOLIAGE = {
  jungle_tree: { h: 13, share: 0.3, near: 10, far: 40 },
  tall_jungle_tree: { h: 19, share: 0.15, near: 16, far: 45 },
  palm: { h: 10, share: 0.2, near: 9, far: 34 },
  bush: { h: 2.2, share: 0.2, near: 5.5, far: 20 },
  fern: { h: 1.3, share: 0.15, near: 4.5, far: 14 },
};


export const PROPS = {
  boulder: { s: [0.8, 1.6], per100: 1.2, near: 6, far: 26 },
  rock: { s: [0.6, 1.4], per100: 2.5, near: 4.6, far: 18 },
  crate: { s: [1, 1], per100: 0.25, near: 4.6, far: 7 },
  barrel: { s: [1, 1], per100: 0.3, near: 4.6, far: 7 },
  basalt: { s: [0.8, 1.8], per100: 2, near: 6, far: 30 },
};


export const THEME_ART = {
  jungle: {
    ground: { tex: 'jungle_floor', tile: 9, tint: 0xc8d4b8 }, 
    road: { tex: 'dirt_road', tile: 7 },
    sky: 'sky_jungle',
    foliage: ['jungle_tree', 'tall_jungle_tree', 'palm', 'bush', 'fern'],
    props: ['boulder', 'rock', 'crate', 'barrel'],
    vehicles: ['jeep'],
  },
  
  
  
  sea: {
    ground: { tex: 'river_water', tile: 14 },
    road: null,
    sky: 'sky_sea',
    foliage: [],
    props: [],
    vehicles: ['heli', 'jeep'],
    surfaces: { rock: { tex: 'canyon_rock', repeat: [2, 4] } },
  },
  interior: {
    ground: { tex: 'concrete_floor', tile: 4 },
    road: { tex: 'concrete_floor', tile: 4 },
    sky: null,
    foliage: [],
    props: ['crate', 'barrel'],
    vehicles: [],
    surfaces: { wall: { tex: 'visitor_wall', repeat: [1, 1] }, ceiling: { tex: 'concrete_floor', repeat: [4, 1] } },
  },
  river: {
    ground: { tex: 'river_water', tile: 12 },
    road: { tex: 'river_water', tile: 12 }, 
    sky: 'sky_canyon',
    foliage: [],
    props: ['boulder', 'rock'],
    vehicles: ['boat', 'heli'],
    surfaces: { rock: { tex: 'canyon_rock', repeat: [1, 3], tile: 14 } },
  },
  volcano: {
    ground: { tex: 'lava_crust', tile: 8 },
    road: { tex: 'dirt_road', tile: 7 },
    sky: 'sky_volcano',
    skyTint: 0xff8a66, 
    foliage: [],
    props: ['basalt', 'boulder'],
    vehicles: ['cart', 'tank'],
    surfaces: { rock: { tex: 'basalt_rock', repeat: [2, 2] } },
  },
  stadium: {
    ground: { tex: 'stadium_turf', tile: 10 },
    road: null,
    sky: 'sky_stadium',
    foliage: [],
    props: [],
    vehicles: [],
    surfaces: { stands: { tex: 'stadium_stands', repeat: [3, 3] } },
  },
};






export const SEATS = {
  
  jeep: { file: 'vehicles/jeep/jeep.glb', eye: [0.15, 1.85, 0.45], hide: /glass|frame/ },
  
  boat: { file: 'vehicles/river_boat/river_boat.glb', eye: [1.1, 2.0, 0], hide: /window/ },
  
  heli: { file: 'vehicles/helicopter_rescue/helicopter_rescue.glb', eye: [3.0, 2.5, 0], hide: /glass|rotor/ },
  
  cart: { file: 'vehicles/mine_cart/mine_cart.glb', eye: [-0.1, 1.75, 0], hide: null },
  
  tank: { file: 'vehicles/tank/tank.glb', eye: [-0.4, 3.05, 0], hide: null },
};

export const SEAT_TURN = -Math.PI / 2;






export function seatPoint(seat, p) {
  const [ex, ey, ez] = seat.eye;
  const [x, y, z] = p;
  return [-(z - ez), y - ey + 1.62, x - ex];
}

export const GUN_FILE = 'vehicles/light_gun/light_gun.glb';


export function themeFiles(theme) {
  const a = THEME_ART[theme];
  if (!a) return { textures: [], normals: [], surfaces: [], sprites: [], sky: null, models: [GUN_FILE] };
  
  const all = [a.ground.tex, ...(a.road ? [a.road.tex] : [])];
  return {
    textures: all.map((t) => `textures/${t}/texture.png`),
    normals: all.map((t) => `textures/${t}/normal.png`),
    surfaces: Object.values(a.surfaces ?? {}).map((s) => `textures/${s.tex}/texture.png`),
    sprites: a.foliage.map((f) => `foliage/${f}/sheet.png`),
    sky: a.sky ? `skies/${a.sky}/background.png` : null,
    models: [...a.props.map((p) => `props/${p}/${p}.glb`), ...a.vehicles.map((v) => SEATS[v].file), GUN_FILE],
  };
}


export function allFiles(theme) {
  const f = themeFiles(theme);
  return [...new Set([...f.textures, ...f.normals, ...f.surfaces, ...f.sprites, ...(f.sky ? [f.sky] : []), ...f.models])];
}


export function foliageCounts(kinds, slots) {
  const total = kinds.reduce((s, k) => s + FOLIAGE[k].share, 0) || 1;
  const raw = kinds.map((k) => (FOLIAGE[k].share / total) * slots);
  const out = raw.map(Math.floor);
  let left = slots - out.reduce((s, n) => s + n, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  for (let j = 0; left > 0; j++, left--) out[order[j % order.length][1]]++;
  return Object.fromEntries(kinds.map((k, i) => [k, out[i]]));
}





export function groundOffset(pos, tile) {
  const wrap = (n) => n - Math.floor(n);
  return { x: wrap(pos.x / tile), y: wrap(-pos.z / tile) };
}
