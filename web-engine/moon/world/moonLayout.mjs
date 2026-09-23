
















import { fbm3, valueNoise2 } from '../noise.mjs';

export const ISLAND_RADIUS = 48;

export const RIM_WIDTH = 5;
export const UNDULATION = 0.75;







export const FOCUS = Object.freeze({
  x: -0.3,
  z: -6.6,
  desktop: Object.freeze({ x: -0.3, z: -6.6, halfWidth: 7.4, yaw: 0 }),
  portrait: Object.freeze({ x: -1.6, z: -6.5, halfWidth: 3.4, yaw: 0.84 }),
});


export const PARCEL = Object.freeze({ minX: -10.5, maxX: 1.5, minZ: -15.5, maxZ: -5.5, gateX: -1.0, gateWidth: 2.0 });







export const COTTAGE_SPOT = Object.freeze({ x: -4.6, z: -11.2, rotY: 0, seed: 1 });




export const PATH_MAX_POINTS = 96;
export const PATH_HALF_WIDTH = 1.05;























export const PATHS = Object.freeze([
  Object.freeze([[-1.0, -5.2], [-0.6, -2.0], [0.8, 1.2], [3.6, 3.6], [7.8, 4.6], [12.5, 3.2], [17.5, -0.5], [22, -6]]),
  Object.freeze([[3.6, 3.6], [2.2, 8.5], [0.4, 14], [-2.5, 21]]),
  Object.freeze([[-0.6, -2.0], [-5.2, 0.4], [-11, 0.2], [-17, -3.5], [-23, -5], [-25.4, -5.4], [-27.4, -5.7]]),
  Object.freeze([[-27.4, -5.7], [-24.25, -4.25], [-24.35, -8.67]]),
  
  
  
  
  
  Object.freeze([[-30, -3.9], [-29.456, -3.972], [-28.95, -4.181], [-28.515, -4.515], [-28.181, -4.95], [-27.972, -5.456], [-27.9, -6], [-27.972, -6.544], [-28.181, -7.05], [-28.515, -7.485], [-28.95, -7.819], [-29.456, -8.028], [-30, -8.1], [-30.544, -8.028], [-31.05, -7.819], [-31.485, -7.485], [-31.819, -7.05], [-32.028, -6.544], [-32.1, -6], [-32.028, -5.456], [-31.819, -4.95], [-31.485, -4.515], [-31.05, -4.181], [-30.544, -3.972], [-30, -3.9]]),
  
  Object.freeze([[-6.655, 0.35], [-6.64, -1.69]]), 
  Object.freeze([[2.245, 2.438], [3.63, 1.022], [4.03, 0.422]]), 
  Object.freeze([[-1, -5.2], [-3, -6.645], [-4.6, -6.845]]), 
  Object.freeze([[-24.25, -4.25], [-23.38, -2.79], [-23.38, -1.79], [-25.58, 3.21], [-26.38, 3.81], [-33.78, 3.81], [-35.58, 3.21], [-36.18, 2.61], [-37.98, -0.19], [-38.18, -1.19], [-37.78, -1.99], [-36.78, -2.99], [-35.58, -2.99], [-35.58, -2.79]]), 
  Object.freeze([[-27.55, 3.81], [-27.55, 3.045]]), 
  Object.freeze([[-29.602, -8.047], [-29.533, -8.965]]), 
  
]);




const PATH_BOXES = PATHS.map((line) => {
  const xs = line.map((p) => p[0]), zs = line.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
});











export const PLAZA = Object.freeze({ x: -30, z: -6, radius: 10.0, feather: 3.4, level: 0.12 });


export const plazaDistance = (x, z) => Math.hypot(x - PLAZA.x, z - PLAZA.z) - PLAZA.radius;

















export const TOWN_SPOTS = Object.freeze({
  townHall: Object.freeze({ x: -30, z: -12.4, rotY: 0, seed: 1 }),
  emporium: Object.freeze({ x: -37.0, z: -5.8, rotY: 0, seed: 1 }),
  market: Object.freeze({ x: -30, z: 0.5, rotY: 0, seed: 2 }),
});

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
}


export function pathDistance(x, z) {
  let d = Infinity;
  for (let k = 0; k < PATHS.length; k++) {
    const line = PATHS[k], b = PATH_BOXES[k];
    const bx = Math.max(b[0] - x, 0, x - b[2]), bz = Math.max(b[1] - z, 0, z - b[3]);
    if (bx * bx + bz * bz >= d * d) continue;
    for (let i = 0; i < line.length - 1; i++) {
      d = Math.min(d, segDist(x, z, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]));
    }
  }
  return d;
}


export function parcelDistance(x, z) {
  const cx = (PARCEL.minX + PARCEL.maxX) / 2, cz = (PARCEL.minZ + PARCEL.maxZ) / 2;
  const hx = (PARCEL.maxX - PARCEL.minX) / 2, hz = (PARCEL.maxZ - PARCEL.minZ) / 2;
  const qx = Math.abs(x - cx) - hx, qz = Math.abs(z - cz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};



export function surfaceHeight(x, z) {
  const hills = (fbm3(x / 16, 0.37, z / 16, { octaves: 3, seed: 11 }) - 0.5) * 2 * UNDULATION
    + (valueNoise2(x / 5.5, z / 5.5, 23) - 0.5) * 0.18;
  const parcelFlat = smoothstep(0, 4, parcelDistance(x, z));
  const pd = pathDistance(x, z);
  const pathFlat = 0.45 + 0.55 * smoothstep(PATH_HALF_WIDTH, PATH_HALF_WIDTH + 2.5, pd);
  const pathDip = -0.05 * (1 - smoothstep(PATH_HALF_WIDTH * 0.6, PATH_HALF_WIDTH + 0.3, pd));
  const parcelLevel = 0.04;
  const h = parcelLevel + (hills * pathFlat - parcelLevel) * parcelFlat + pathDip;
  
  
  const plazaFlat = smoothstep(0, PLAZA.feather, plazaDistance(x, z));
  return PLAZA.level + (h - PLAZA.level) * plazaFlat;
}


export function rimDrop(r) {
  const t = (r - (ISLAND_RADIUS - RIM_WIDTH)) / RIM_WIDTH;
  if (t <= 0) return 0;
  const c = Math.min(1, t);
  return RIM_WIDTH * (1 - Math.sqrt(1 - c * c)) * 0.9;
}



















let terrainDelta = null;


export function setTerrainDelta(fn) {
  terrainDelta = typeof fn === 'function' ? fn : null;
}


export function terrainDeltaAt(x, z) {
  return terrainDelta ? terrainDelta(x, z) : 0;
}

export function heightAt(x, z) {
  const r = Math.hypot(x, z);
  
  
  
  
  return surfaceHeight(x, z) * (1 - smoothstep(ISLAND_RADIUS - RIM_WIDTH * 1.4, ISLAND_RADIUS, r)) - rimDrop(r)
    + terrainDeltaAt(x, z);
}

export function normalAt(x, z, e = 0.25) {
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  const nx = -dx, ny = 2 * e, nz = -dz;
  const l = Math.hypot(nx, ny, nz);
  return [nx / l, ny / l, nz / l];
}




export function placements() {
  const P = [];
  const put = (module, x, z, extra = {}) => P.push({ module, x, z, y: heightAt(x, z), rotY: 0, seed: 1, ...extra });

  
  
  
  put('cat', 1.35, -3.9, { seed: 1, rotY: 0.35 });

  
  const orchard = [
    ['tree', 6.4, -5.8, 'fruiting', 1, 0.4],
    ['peachTree', 10.8, -9.6, 'fruiting', 2, 1.9],
    ['tree', 5.2, -13.2, 'young', 3, 2.6],
    ['tree', 12.6, -2.4, 'sapling', 4, 0.2],
    ['peachTree', 9.4, -17.0, 'fruiting', 5, 4.1],
    ['tree', 15.8, -12.6, 'young', 6, 5.2],
    ['tree', -8.4, 5.6, 'fruiting', 7, 3.3],
    ['tree', 3.6, -20.8, 'fruiting', 8, 1.2],
    ['tree', 8.8, 1.2, 'seed', 9, 0],
    ['tree', 16.5, 6.8, 'stump', 10, 2.2],
    ['peachTree', -15.2, -9.5, 'young', 11, 0.7],
    ['tree', -13.8, 9.8, 'sapling', 12, 1.4],
  ];
  for (const [module, x, z, stage, seed, rotY] of orchard) put(module, x, z, { stage, seed, rotY, role: 'tree' });

  
  const segLen = 2;
  const edge = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.round(len / segLen);
    const rotY = Math.atan2(-(bz - az), bx - ax); 
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (Math.abs(az - PARCEL.maxZ) < 1e-6 && bz === az && Math.abs(x - PARCEL.gateX) < PARCEL.gateWidth * 0.75) continue;
      put('fence', x, z, { rotY, seed: 1 + (i % 3), segment: len / n, role: 'fence' });
    }
  };
  edge(PARCEL.minX, PARCEL.maxZ, PARCEL.maxX, PARCEL.maxZ);
  edge(PARCEL.maxX, PARCEL.maxZ, PARCEL.maxX, PARCEL.minZ);
  edge(PARCEL.maxX, PARCEL.minZ, PARCEL.minX, PARCEL.minZ);
  edge(PARCEL.minX, PARCEL.minZ, PARCEL.minX, PARCEL.maxZ);

  
  const lamps = [[-2.5, -4.4], [2.3, 0.4], [7.6, 6.2], [13.6, 5.0], [-6.2, 1.9], [3.6, 9.4], [20.8, -0.8], [-14.5, 0.9]];
  lamps.forEach(([x, z], i) => put('lamp', x, z, { seed: 1 + (i % 3), rotY: (i * 1.7) % (Math.PI * 2), role: 'lamp' }));

  put('firepit', -4.6, 4.8, { seed: 1, rotY: 0.5, role: 'fire' });

  
  
  
  
  
  
  
  
  
  
  
  
  put('shop', -7.6, -3.25, { seed: 1, rotY: 0, stage: 'level1', role: 'shop' });
  
  
  
  
  put('processor', 5.45, -2.5, { seed: 1, rotY: 0, stage: 'level1', role: 'processor' });

  
  
  
  
  
  
  
  for (const [kind, spot] of Object.entries(TOWN_SPOTS)) {
    put('townBuilding', spot.x, spot.z, { stage: kind, seed: spot.seed, rotY: spot.rotY, role: 'town' });
  }
  
  
  
  
  
  put('kit/decor/fountain', PLAZA.x, PLAZA.z, { seed: 3, rotY: 0.4, role: 'townDecor' });
  
  
  put('kit/decor/signpost', -25.3, -2.8, { seed: 1, rotY: -0.9, role: 'townDecor' });
  put('kit/decor/picnicTable', -36.0, -0.9, { seed: 2, rotY: 0.6, role: 'townDecor' });
  put('kit/decor/picnicTable', -36.0, -11.4, { seed: 1, rotY: -0.5, role: 'townDecor' });
  put('kit/decor/well', -24.4, -11.0, { seed: 1, rotY: 0.8, role: 'townDecor' });
  
  
  
  const townLamps = [[-26.2, -7.4], [-34.8, 2.0], [-23.6, -13.2], [-22.6, -8.0]];
  townLamps.forEach(([x, z], i) => put('lamp', x, z, { seed: 1 + (i % 3), rotY: 1.1 + i * 1.7, role: 'lamp' }));

  const rocks = [[-2.3, 6.4, 0.7], [-6.9, 3.3, 0.5], [5.4, 1.6, 0.35], [11.5, 9.5, 0.9], [-12.5, -3.5, 0.6], [18.5, -8.5, 1.0], [-18.5, 4.5, 0.8], [6.0, 12.8, 0.45], [24, 10, 1.0], [-8.2, -19.5, 0.7]];
  rocks.forEach(([x, z, s], i) => put('rock', x, z, { seed: 1 + (i % 3), rotY: i * 2.1, scale: s / 0.7, role: 'rock' }));

  return P;
}
