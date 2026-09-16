




















































import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3 } from '../../../noise.mjs';
import { buildItem, tube, bezier, boxOf, mix, scl, smooth, clamp01, norm, sub } from './core.mjs';

const formIndex = (seed, rng) => (seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2));


const SHOVEL_Y = 0.0125, AXE_Y = 0.02, PICK_Y = 0.019, CAN_APEX = 0.245;

export const TOOL_GRIP = Object.freeze({
  shovel: Object.freeze({ at: Object.freeze([0.12, SHOVEL_Y, 0]), axis: Object.freeze([1, 0, 0]), face: Object.freeze([0, 1, 0]) }),
  axe: Object.freeze({ at: Object.freeze([0.075, AXE_Y, 0]), axis: Object.freeze([1, 0, 0]), face: Object.freeze([0, 0, -1]) }),
  pickaxe: Object.freeze({ at: Object.freeze([0.075, PICK_Y, 0]), axis: Object.freeze([1, 0, 0]), face: Object.freeze([0, 0, -1]) }),
  wateringCan: Object.freeze({ at: Object.freeze([0, CAN_APEX, 0]), axis: Object.freeze([1, 0, 0]), face: Object.freeze([0, -1, 0]) }),
});

const STEEL = '#d9e0ea', STEEL_LIGHT = '#f3f6fa';


const both = (a, b) => Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0);


function wrapOf(handle, x0, x1, color, turns = 150) {
  const band = S.intersect(0.0015, S.offset(handle, 0.0022), S.field((x) => Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2));
  const ridged = S.displace(band, (x, y, z) => -0.0007 * (0.5 + 0.5 * Math.sin(Math.atan2(z, y) + x * turns)), 0.0008);
  return S.paint(ridged, { material: 'cloth', color: (x) => scl(linear(color), 0.92 + 0.08 * Math.sin(x * turns * 0.5)) });
}



const SHOVEL_FORMS = [
  { len: 0.4, blade: 'point', L: 0.205, HW: 0.072, grip: 'D', paint: '#a9c6ea', wood: '#e2b98a', wrap: null },
  { len: 0.39, blade: 'square', L: 0.18, HW: 0.067, grip: 'T', paint: '#9fd9c0', wood: '#d6a978', wrap: '#f3d98e' },
  { len: 0.37, blade: 'scoop', L: 0.198, HW: 0.08, grip: 'knob', paint: '#f1b3c2', wood: '#e8c79a', wrap: '#c9b5ea' },
];

function bladeHalfWidth(form, u) {
  const { L, HW } = form;
  if (form.blade === 'point') {
    if (u < L * 0.45) return HW * (0.8 + 0.2 * smooth(0, L * 0.18, u));
    const t = (u - L * 0.45) / (L * 0.55);
    return HW * Math.sqrt(Math.max(0, 1 - t * t * t));
  }
  if (form.blade === 'square') return HW * (0.82 + 0.18 * smooth(0, L * 0.25, u));
  const t = (u - L * 0.5) / (L * 0.52);
  return HW * Math.sqrt(Math.max(0, 1 - t * t)) * (0.9 + 0.1 * smooth(0, L * 0.3, u));
}

export function shovel(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = SHOVEL_FORMS[formIndex(seed, rng)];
  const Y = SHOVEL_Y, R = 0.0118;
  const { len, L, HW } = form;
  const bow = rng.rangeF(0.003, 0.005) * (seed % 2 ? 1 : -1);
  const lean = rng.rangeF(-0.05, 0.05);
  const ns = rng.rangeI(1, 1e6);
  const wood = linear(form.wood), paint = linear(form.paint), steel = linear(STEEL), light = linear(STEEL_LIGHT);

  
  const zAt = (x) => bow * Math.sin(Math.PI * clamp01((x - 0.12) / (len - 0.12)));
  const shaftPts = Array.from({ length: 8 }, (_, i) => { const x = 0.03 + (len - 0.03) * (i / 7); return [x, Y, zAt(x)]; });
  let handle = tube(shaftPts, R, R + 0.001);
  
  
  const grip = lod === 2 ? 'knob' : form.grip;
  if (grip === 'D') {
    const arms = [
      tube(bezier([0.085, Y, 0], [0.05, Y, 0.038], [0.014, Y, 0.036], 5), 0.0098, 0.0082),
      tube(bezier([0.085, Y, 0], [0.058, Y, -0.03], [0.014, Y, -0.034], 5), 0.0098, 0.0082),
    ];
    handle = S.union(0.006, handle, ...arms, S.capsule([0.012, Y, -0.036], [0.012, Y, 0.038], 0.0085));
  } else if (grip === 'T') {
    handle = S.union(0.007, handle, S.capsule([0.026, Y, -0.052], [0.026, Y, 0.044], 0.0098));
  } else {
    handle = S.union(0.008, handle, S.ellipsoid([0.028, Y, 0], [0.016, Y - 0.0005, 0.015]));
  }
  let handleNode = S.paint(handle, { material: 'wood', color: (x, y, z) => scl(wood, 0.9 + 0.1 * valueNoise3(x * 60, y * 400, z * 400, ns)) });
  
  if (form.wrap && lod === 0) handleNode = S.union(0.001, handleNode, wrapOf(handle, 0.085, 0.165, form.wrap));
  const collar = S.paint(S.roundCone([len - 0.05, Y, 0], [len + 0.004, Y, 0], R + 0.0012, 0.0185), { material: 'metal', color: steel });
  const shaftNode = S.union(0.004, handleNode, collar);

  
  
  
  const far = lod === 2;
  const T0 = far ? 0.0058 : 0.0042, T1 = far ? 0.0045 : 0.0026, CUP = (form.blade === 'scoop' ? 0.026 : 0.018) * (far ? 0.6 : 1);
  const x0 = len - 0.004;
  const blade = S.field((x, y, z) => {
    const u = x - x0;
    const w = z - lean * u;
    const hw = bladeHalfWidth(form, Math.max(0, Math.min(L, u)));
    const d2 = Math.max(Math.abs(w) - hw, -u, u - L);
    const a = Math.min(1, Math.abs(w) / HW);
    const back = 1 - smooth(0, 0.045, u);
    const yc = T0 + CUP * a * a + (Y - T0) * back;
    const th = T0 + (T1 - T0) * a * a + 0.004 * back;
    return both(d2, Math.abs(y - yc) - th);
  });
  
  const stepY = (w) => T0 + CUP * (w / HW) ** 2 + (Y - T0) * (1 - smooth(0, 0.045, 0.012));
  const sw = bladeHalfWidth(form, 0.012) * 0.96;
  const step = tube(bezier([x0 + 0.012, stepY(-sw), -sw + lean * 0.012], [x0 + 0.012, 2 * stepY(0) - stepY(sw), lean * 0.012], [x0 + 0.012, stepY(sw), sw + lean * 0.012], 6), 0.0042);
  const bladeNode = S.paint(far ? blade : S.union(0.004, blade, step), {
    material: 'metal',
    color: (x, y, z) => {
      const u = x - x0, w = z - lean * u;
      const edge = Math.max(Math.abs(w) - bladeHalfWidth(form, Math.max(0, Math.min(L, u))), u - L);
      const worn = smooth(-0.013, -0.003, edge) * (0.75 + 0.25 * Math.sign(w + 0.01));
      return mix(mix(paint, steel, 0.08 * valueNoise3(x * 90, y * 90, z * 90, ns + 1)), light, 0.85 * worn);
    },
  });
  const parts = [
    
    
    
    { key: `${key}|shaft${far ? '-far' : ''}`, node: shaftNode, min: [-0.008, -0.006, -0.062], max: [len + 0.03, 0.036, 0.062], cell: 0.0032, share: 0.5, material: 'wood', uvScale: 0.06, maxCoarsen: 3 },
    { key: `${key}|blade${far ? '-far' : ''}`, node: bladeNode, min: [len - 0.03, -0.006, -HW - 0.02], max: [len + L + 0.012, CUP + 0.022, HW + 0.02], 
    
    
    cell: 0.0022, share: 0.5, material: 'metal', uvScale: 0.08, lodCell: [1, 1.35, 1.5], maxCoarsen: lod === 2 ? 2 : 3 },
  ];
  return buildItem({ name, lod, parts, reach: 0.02 });
}



const AXE_FORMS = [
  { len: 0.37, head: 'wedge', paint: '#f3d98e', wood: '#deb07e', wrap: null, hole: false, bend: 0.009 },
  { len: 0.39, head: 'beard', paint: '#9fd9c0', wood: '#d19a6e', wrap: '#f1b3c2', hole: false, bend: -0.008 },
  { len: 0.32, head: 'hatchet', paint: '#c7b3ea', wood: '#e6c08e', wrap: '#a9c6ea', hole: true, bend: 0.006 },
];



function axeHead(form, u, v) {
  const hatchet = form.head === 'hatchet';
  const edge = hatchet ? -0.108 : -0.132, poll = hatchet ? 0.046 : 0.04;
  const eye = hatchet ? 0.027 : 0.031;
  const flare = smooth(-0.024, edge, v);
  let hw = eye + (hatchet ? 0.026 : 0.036) * flare;
  if (form.head === 'beard' && u < 0) hw += 0.042 * smooth(-0.04, edge, v) ** 1.5;
  const vEdge = edge + 4.2 * u * u;
  const d2 = Math.max(Math.abs(u) - hw, vEdge - v, v - poll + (hatchet ? 0 : 6 * u * u));
  const th = 0.0032 + (AXE_Y - 0.0032 - 0.0014) * smooth(edge, -0.034, v);
  return { d2, th, edge };
}

export function axe(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = AXE_FORMS[formIndex(seed, rng)];
  const Y = AXE_Y, GX = TOOL_GRIP.axe.at[0];
  const { len } = form;
  const ns = rng.rangeI(1, 1e6);
  const xh = len - 0.034;
  const wood = linear(form.wood), paint = linear(form.paint), steel = linear(STEEL), light = linear(STEEL_LIGHT);

  
  const zAt = (x) => form.bend * Math.sin(Math.PI * (x - GX) / (xh - GX));
  const pts = Array.from({ length: 9 }, (_, i) => { const x = 0.012 + (len - 0.012) * (i / 8); return [x, Y, x > xh ? 0 : zAt(x)]; });
  const radius = (t) => 0.0126 - 0.0012 * Math.sin(Math.PI * t);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) segs.push(S.roundCone(pts[i], pts[i + 1], radius(i / 8), radius((i + 1) / 8)));
  let haft = S.union(0.006, ...segs, S.ellipsoid([0.02, Y, zAt(0.02)], [0.021, 0.0165, 0.0165]));
  if (form.hole) haft = S.subtract(0.002, haft, S.capsule([0.02, -0.02, zAt(0.02)], [0.02, 0.06, zAt(0.02)], 0.0045));
  let haftNode = S.paint(haft, { material: 'wood', color: (x, y, z) => scl(wood, 0.88 + 0.12 * valueNoise3(x * 50, y * 350, z * 350, ns)) });
  if (form.wrap) haftNode = S.union(0.001, haftNode, wrapOf(haft, 0.04, 0.12, form.wrap));

  const headField = S.field((x, y, z) => {
    const u = x - xh, v = z;
    const { d2, th } = axeHead(form, u, v);
    return both(d2, Math.abs(y - Y) - th) - 0.0014;
  });
  const wedgeCap = S.ellipsoid([len - 0.002, Y, 0], [0.007, 0.0095, 0.0115]);
  const headNode = S.paint(S.union(0.002, headField, wedgeCap), {
    material: 'metal',
    color: (x, y, z) => {
      const u = x - xh;
      const { edge } = axeHead(form, u, z);
      const bevel = smooth(edge + 0.044, edge + 0.024, z - 4.2 * u * u);
      const base = mix(paint, steel, bevel);
      return mix(base, light, 0.8 * smooth(edge + 0.016, edge + 0.003, z - 4.2 * u * u) + 0.06 * valueNoise3(x * 120, y * 120, z * 120, ns + 2));
    },
  });
  const parts = [
    { key: `${key}|haft`, node: haftNode, min: [-0.006, -0.004, -0.032], max: [len + 0.012, 0.046, 0.032], cell: 0.003, share: 0.42, material: 'wood', uvScale: 0.06 },
    { key: `${key}|head`, node: headNode, min: [xh - 0.11, -0.004, -0.148], max: [xh + 0.07, 0.044, 0.06], cell: 0.0021, share: 0.58, material: 'metal', uvScale: 0.06, maxCoarsen: 2 },
  ];
  return buildItem({ name, lod, parts, reach: 0.02 });
}



const PICK_FORMS = [
  { len: 0.4, ends: ['pick', 'chisel'], span: [0.18, 0.135], curve: 1.1, paint: '#c7b3ea', wood: '#dcae7c', wrap: null },
  { len: 0.42, ends: ['pick', 'pick'], span: [0.195, 0.14], curve: 1.4, paint: '#a9c6ea', wood: '#d3a070', wrap: '#f3d98e' },
  { len: 0.34, ends: ['pick', 'hammer'], span: [0.16, 0.07], curve: 0.9, paint: '#f1b3c2', wood: '#e6c08e', wrap: null },
];
const PICK_COLLAR = 0.028;


function pickSection(form, v) {
  const side = v < 0 ? 0 : 1;
  const span = form.span[side];
  const t = clamp01((Math.abs(v) - PICK_COLLAR) / (span - PICK_COLLAR));
  const kind = form.ends[side];
  const ease = t ** 0.85;
  if (kind === 'pick') return { ax: 0.018 + (0.003 - 0.018) * ease, ay: 0.0165 + (0.003 - 0.0165) * ease };
  if (kind === 'chisel') return { ax: 0.017 + (0.024 - 0.017) * t, ay: 0.0155 + (0.0042 - 0.0155) * t };
  return { ax: 0.0195 + 0.0028 * smooth(0.6, 1, t), ay: 0.0172 };
}

export function pickaxe(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = PICK_FORMS[formIndex(seed, rng)];
  const Y = PICK_Y;
  const { len, curve } = form;
  const ns = rng.rangeI(1, 1e6);
  const xh = len - 0.026;
  const wood = linear(form.wood), paint = linear(form.paint), steel = linear(STEEL), light = linear(STEEL_LIGHT);
  const tilt = rng.rangeF(0.02, 0.05) * (seed % 2 ? 1 : -1);

  const haft = S.union(0.008,
    S.roundCone([0.02, Y, 0], [xh + 0.014, Y, 0], 0.0118, 0.0136),
    S.ellipsoid([0.02, Y, 0], [0.02, 0.016, 0.0158]));
  let haftNode = S.paint(haft, { material: 'wood', color: (x, y, z) => scl(wood, 0.88 + 0.12 * valueNoise3(x * 50, y * 350, z * 350, ns)) });
  if (form.wrap) haftNode = S.union(0.001, haftNode, wrapOf(haft, 0.04, 0.125, form.wrap));

  const head = S.field((x, y, z) => {
    const v = z;
    const xc = xh - curve * v * v + tilt * v;
    const { ax, ay } = pickSection(form, v);
    const q = Math.hypot((x - xc) / ax, (y - Y) / ay);
    const d = (q - 1) * Math.min(ax, ay);
    const ends = Math.max(-v - form.span[0], v - form.span[1]);
    return Math.max(d, ends) - 0.0009;
  });
  const collar = S.roundBox([xh, Y, 0], [0.026, Y - 0.0006, 0.031], 0.006);
  const headNode = S.union(0.005,
    S.paint(head, {
      material: 'metal',
      color: (x, y, z) => {
        const t = clamp01((Math.abs(z) - PICK_COLLAR) / 0.13);
        return mix(steel, light, 0.7 * smooth(0.75, 1, t) + 0.06 * valueNoise3(x * 120, y * 120, z * 120, ns + 3));
      },
    }),
    S.paint(collar, { material: 'metal', color: paint }));
  const reachBack = curve * Math.max(...form.span) ** 2 + 0.035;
  const parts = [
    { key: `${key}|haft`, node: haftNode, min: [-0.006, -0.004, -0.032], max: [xh + 0.034, 0.044, 0.032], cell: 0.003, share: 0.42, material: 'wood', uvScale: 0.06 },
    { key: `${key}|head`, node: headNode, min: [xh - reachBack - 0.012, -0.004, -form.span[0] - 0.014], max: [xh + 0.042, 0.044, form.span[1] + 0.014], cell: 0.0021, share: 0.58, material: 'metal', uvScale: 0.06, maxCoarsen: 2 },
  ];
  return buildItem({ name, lod, parts, reach: 0.02 });
}



const CAN_FORMS = [
  { body: 'oval', rx: 0.096, rz: 0.074, h: 0.145, rose: true, color: '#a9c6ea', trim: '#f3d98e' },
  { body: 'round', rx: 0.096, rz: 0.09, h: 0.132, rose: false, color: '#9fd9c0', trim: '#f1b3c2' },
  { body: 'tall', rx: 0.077, rz: 0.077, h: 0.174, rose: true, color: '#f1b3c2', trim: '#c9b5ea' },
];

export function wateringCan(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = CAN_FORMS[formIndex(seed, rng)];
  const { rx, rz, h } = form;
  const ns = rng.rangeI(1, 1e6);
  const color = linear(form.color), trim = linear(form.trim), dark = scl(linear(form.color), 0.55);

  let body;
  if (form.body === 'round') {
    body = S.intersect(0.009, S.ellipsoid([0, h * 0.5, 0], [rx, h * 0.56, rz]), S.plane([0, -1, 0], 0));
  } else {
    body = S.transform(S.roundCylinder([0, h / 2, 0], rx, rx * 0.93, h / 2, 0.019), { scale: [1, 1, rz / rx] });
  }
  const topY = form.body === 'round' ? h * 1.02 : h;
  const dome = S.ellipsoid([0.007, topY - 0.005, 0], [rx * 0.82, 0.024, rz * 0.82]);
  const holeC = [-rx * 0.42, topY + 0.014, 0.005];
  let shell = S.union(0.016, body, dome, S.roundCone([holeC[0], topY - 0.012, holeC[2]], [holeC[0], holeC[1], holeC[2]], 0.031, 0.024));
  shell = S.union(0.003, shell, S.torus(holeC, 0.0225, 0.0056));
  shell = S.subtract(0.004, shell, S.ellipsoid([holeC[0], holeC[1] + 0.005, holeC[2]], [0.019, 0.014, 0.019]));
  if (form.body === 'tall') shell = S.union(0.004, shell, S.torus([0, h - 0.014, 0], rx - 0.007, 0.0064));
  
  const footR = form.body === 'round' ? rx * 0.64 : rx - 0.006;
  const foot = S.transform(S.torus([0, 0.0085, 0], footR, 0.0075), { scale: [1, 1, form.body === 'round' ? 0.94 : rz / rx] });
  const bodyNode = S.union(0.0025,
    S.paint(shell, {
      material: 'metal',
      color: (x, y, z) => {
        const inHole = smooth(0.024, 0.014, Math.hypot(x - holeC[0], z - holeC[2])) * smooth(topY, holeC[1] + 0.005, y);
        return mix(scl(color, 0.9 + 0.1 * smooth(0, h, y) + 0.05 * valueNoise3(x * 40, y * 40, z * 40, ns)), dark, inHole);
      },
    }),
    S.paint(foot, { material: 'metal', color: trim }));

  
  const A = CAN_APEX;
  const handlePts = [[-rx * 0.78, topY - 0.014, 0], [-rx * 0.86, A - 0.034, 0], [-0.036, A - 0.001, 0], [0, A, 0], [0.036, A - 0.002, 0], [rx * 0.62, A - 0.024, 0], [rx * 0.7, topY - 0.012, 0]];
  const handle = tube(handlePts, 0.0096, 0.0092);

  
  const s0 = [rx * 0.8, 0.043, 0], s1 = [rx + 0.084, 0.06, 0], s2 = [rx + 0.15, form.body === 'round' ? 0.204 : 0.186, 0];
  const spoutPts = bezier(s0, s1, s2, 7);
  const spout = S.union(0.007, tube(spoutPts, 0.0145, 0.0079), S.capsule(spoutPts[4], [rx * 0.86, h * 0.72, 0], 0.0046));
  const dir = norm(sub(s2, spoutPts[5]));
  let tip = null;
  if (form.rose) {
    const f = S.frameFromNormal(dir);
    const roseLocal = S.union(0.005, S.roundCylinder([0, 0, 0], 0.0105, 0.024, 0.0105, 0.0035), S.ellipsoid([0, 0.0105, 0], [0.023, 0.0052, 0.023]));
    tip = S.place(roseLocal, s2, f.X, dir, f.Y);
    const holes = [[0, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos(i * 1.047 + 0.3) * 0.0126, Math.sin(i * 1.047 + 0.3) * 0.0126])];
    const roseC = linear('#ecd39c');
    tip = S.paint(tip, {
      material: 'metal',
      color: (x, y, z) => {
        const p = [x - s2[0], y - s2[1], z - s2[2]];
        const ly = p[0] * dir[0] + p[1] * dir[1] + p[2] * dir[2];
        const lx = p[0] * f.X[0] + p[1] * f.X[1] + p[2] * f.X[2], lz = p[0] * f.Y[0] + p[1] * f.Y[1] + p[2] * f.Y[2];
        let hole = 0;
        for (const [hx, hz] of holes) hole = Math.max(hole, smooth(0.0032, 0.0016, Math.hypot(lx - hx, lz - hz)));
        return mix(roseC, scl(roseC, 0.45), hole * smooth(0.009, 0.014, ly));
      },
    });
  } else {
    tip = S.subtract(0.002, S.roundCone(sub(s2, [dir[0] * 0.028, dir[1] * 0.028, 0]), s2, 0.0079, 0.0132), S.sphere([s2[0] + dir[0] * 0.005, s2[1] + dir[1] * 0.005, 0], 0.0098));
    tip = S.paint(tip, { material: 'metal', color: trim });
  }
  const fittings = S.union(0.003,
    S.paint(handle, { material: 'metal', color: trim }),
    S.paint(S.union(0.005, spout, tip), { material: 'metal', color: (x, y, z) => scl(color, 0.96 + 0.04 * valueNoise3(x * 60, y * 60, z * 60, ns + 1)) }));
  void rng;
  const parts = [
    { key: `${key}|body`, node: bodyNode, min: [-rx - 0.024, -0.008, -rz - 0.024], max: [rx + 0.024, topY + 0.046, rz + 0.024], cell: 0.0038, share: 0.55, material: 'metal', uvScale: 0.09 },
    { key: `${key}|fittings`, node: fittings, ...boxOf([...handlePts, ...spoutPts, [rx * 0.86, h * 0.72, 0]], 0.04), cell: 0.0025, share: 0.45, material: 'metal', uvScale: 0.07, maxCoarsen: 2 },
  ];
  return buildItem({ name, lod, parts, reach: 0.034 });
}
