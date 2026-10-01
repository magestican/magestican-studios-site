





























import { MeshData, IDENTITY, compose, scale, translate, rotateX, rotateY, applyPoint, applyDir } from '../../../mesh/meshData.mjs';
import { emit, roundedBox, transform } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary } from '../shade.mjs';
import { rod } from '../rod.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
export const STAGES = Object.freeze(['shut', 'open']);




export const LID_OPEN_RAD = Math.PI * 0.62;

export const LID_HINGE = Object.freeze({ kind: 'hinge', max: LID_OPEN_RAD, speed: 3 });

const STYLES = [
  
  { size: [0.54, 0.30, 0.36], lid: 0.15, wood: '#c08b57', rim: '#8a5c38', iron: '#6f6a74', bands: 2, handle: 'iron' },
  { size: [0.62, 0.26, 0.38], lid: 0.13, wood: '#ddc3a0', rim: '#b1926e', iron: '#b98f4e', bands: 2, handle: 'iron' },
  { size: [0.48, 0.32, 0.34], lid: 0.17, wood: '#9a6f4c', rim: '#6d4a30', iron: '#5f5a63', bands: 1, handle: 'rope' },
];





export function chestBody(mesh, m, {
  size = [0.54, 0.30, 0.36], lidRise = 0.15, detail = 0, rng,
  woodColor, rimColor, ironColor, bands = 2, handle = 'iron', open = false, snowColor = null,
}) {
  const [W, H, D] = size;
  const hw = W / 2, hd = D / 2;
  const put = (shape, color, material = 'plank') => emit(mesh, material, shape, { matrix: m, color });
  const boardC = (k = 0.06) => vc(vary(rng, woodColor, k), { groundAO: 0.3, underside: 0.45 });
  const ironC = (k = 0.05) => vc(vary(rng, ironColor, k), { groundAO: 0.35, underside: 0.4 });

  
  
  
  if (detail === 2) {
    put(transform(roundedBox({ size: [W, H + (open ? 0 : lidRise), D], radius: 0.035, bevel: 1 }),
      compose(IDENTITY, translate(0, (H + (open ? 0 : lidRise)) / 2, 0))), boardC(0.03));
    return { top: H + lidRise };
  }

  put(transform(roundedBox({ size: [W, H, D], radius: 0.03, bevel: 1, segments: [2, 1, 1] }),
    compose(IDENTITY, translate(0, H / 2, 0))), boardC());

  
  
  for (const sz of [-1, 1]) {
    const z = sz * (hd + 0.004);
    put(rod({
      path: [[-hw * 0.02, 0.02, z], [-hw * 0.02, H - 0.02, z]],
      w: 0.016, h: 0.012, detail: 1, corner: 0, up: [0, 0, 1], caps: 'none',
    }), vc(vary(rng, rimColor, 0.04), { groundAO: 0.3, underside: 0.4 }));
  }

  
  const rimY = H + 0.008;
  for (const [along, sign] of [[0, -1], [0, 1], [1, -1], [1, 1]]) {
    const half = (along === 0 ? hw : hd) + 0.012;
    const off = (along === 0 ? hd : hw) + 0.012;
    const a = [-half, rimY, sign * off], b = [half, rimY, sign * off];
    const path = along === 0 ? [a, b] : [[a[2], a[1], a[0]], [b[2], b[1], b[0]]];
    put(rod({ path, w: 0.026, h: 0.034, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none' }),
      vc(vary(rng, rimColor, 0.05), { groundAO: 0.2, underside: 0.4 }));
  }

  
  
  
  
  
  
  
  
  
  
  
  const hingeZ = -hd - 0.006;
  const lidFrame = compose(m, compose(translate(0, rimY + 0.012, hingeZ), open ? rotateX(-LID_OPEN_RAD) : IDENTITY));
  
  
  
  const lidMesh = open ? mesh : mesh.part('lid', { pivot: applyPoint(m, [0, rimY + 0.012, hingeZ]), axis: applyDir(m, [-1, 0, 0]), clip: LID_HINGE });
  const onLid = (shape, color, material = 'plank') => emit(lidMesh, material, shape, { matrix: lidFrame, color });
  const lidSpanX = W * 0.99;

  onLid(rod({
    path: [[-lidSpanX / 2, lidRise * 0.5, D / 2], [lidSpanX / 2, lidRise * 0.5, D / 2]],
    w: D * 1.005, h: lidRise * 1.02, detail: detail === 0 ? 0 : 1, up: [0, 1, 0], caps: 'none',
  }), boardC(0.05));
  
  onLid(rod({
    path: [[-lidSpanX / 2, lidRise * 0.22, D + 0.012], [lidSpanX / 2, lidRise * 0.22, D + 0.012]],
    w: 0.03, h: 0.036, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none',
  }), vc(vary(rng, rimColor, 0.05), { groundAO: 0.2, underside: 0.4 }));

  
  
  
  
  
  const bandXs = bands === 1 ? [0] : [-W * 0.26, W * 0.26];
  for (const bx of bandXs) {
    const wobble = rng.rangeF(-0.006, 0.006);
    const x = bx + wobble;
    
    put(rod({
      path: [[x, 0.015, hd + 0.006], [x, H - 0.01, hd + 0.006]],
      w: 0.032, h: 0.009, detail: 1, corner: 0, up: [0, 0, 1], caps: ['round', 'none'], capLength: 0.016,
    }), ironC(), 'metal');
    
    put(rod({
      path: [[x, 0.015, -hd - 0.006], [x, H - 0.01, -hd - 0.006]],
      w: 0.032, h: 0.009, detail: 1, corner: 0, up: [0, 0, 1], caps: ['round', 'none'], capLength: 0.016,
    }), ironC(), 'metal');
    
    onLid(rod({
      path: [[x, lidRise * 0.05, 0.01], [x, lidRise * 1.03, D * 0.5], [x, lidRise * 0.28, D + 0.014]],
      w: 0.032, h: 0.009, detail: detail === 0 ? 1 : 0, corner: 0, up: [0, 1, 0], caps: ['none', 'round'], capLength: 0.018,
    }), ironC(), 'metal');
  }

  
  for (const hx of bandXs) {
    put(rod({
      path: [[hx - 0.035, rimY + 0.012, hingeZ], [hx + 0.035, rimY + 0.012, hingeZ]],
      w: 0.026, detail: 1, up: [0, 1, 0], caps: 'round', capLength: 0.012,
    }), ironC(0.03), 'metal');
  }

  
  
  
  if (detail < 2) {
    put(transform(roundedBox({ size: [0.075, 0.085, 0.014], radius: 0.012, bevel: 1 }),
      compose(IDENTITY, translate(0, H * 0.58, hd + 0.008))), ironC(0.03), 'metal');
    put(transform(roundedBox({ size: [0.022, 0.026, 0.01], radius: 0.006, bevel: 1 }),
      compose(IDENTITY, translate(0, H * 0.5, hd + 0.016))), vc(vary(rng, ironColor, 0.1), { groundAO: 0.3 }), 'metal');
    onLid(rod({
      path: [[0, lidRise * 0.2, D + 0.016], [0, -lidRise * 0.22, D + 0.016]],
      w: 0.034, h: 0.01, detail: 1, corner: 0, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.014,
    }), ironC(0.03), 'metal');
  }

  
  if (detail === 0) {
    for (const sx of [-1, 1]) {
      const x = sx * (hw + 0.006);
      const y = H * 0.62;
      if (handle === 'rope') {
        put(rod({
          path: [[x, y + 0.03, -0.03], [x + sx * 0.035, y - 0.01, 0], [x, y + 0.03, 0.03]],
          w: 0.014, detail: 1, up: [0, 1, 0], caps: 'round', capLength: 0.008,
        }), vc(vary(rng, hex('#c9b28a'), 0.06), { groundAO: 0.3 }), 'wood');
      } else {
        put(rod({
          path: [[x, y + 0.035, -0.035], [x + sx * 0.03, y - 0.005, 0], [x, y + 0.035, 0.035]],
          w: 0.012, detail: 1, up: [0, 1, 0], caps: 'round', capLength: 0.007,
        }), ironC(0.03), 'metal');
      }
    }
  }

  
  
  
  if (open && detail < 2) {
    put(transform(roundedBox({ size: [W * 0.86, 0.03, D * 0.84], radius: 0.014, bevel: 1 }),
      compose(IDENTITY, translate(0, H - 0.03, 0))), vc(vary(rng, hex('#d8c48c'), 0.08), { groundAO: 0.1, underside: 0.3 }), 'wood');
  }

  if (snowColor && detail < 2) {
    
    if (open) {
      put(rod({
        path: [[-hw * 0.8, rimY + 0.03, 0], [hw * 0.8, rimY + 0.03, 0]],
        w: 0.03, h: D * 0.8, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none',
      }), vc(snowColor, { groundAO: 0, underside: 0.2 }), 'snow');
    } else {
      onLid(rod({
        path: [[-lidSpanX * 0.42, lidRise * 1.06, D * 0.5], [lidSpanX * 0.42, lidRise * 1.06, D * 0.5]],
        w: 0.034, h: D * 0.62, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none',
      }), vc(snowColor, { groundAO: 0, underside: 0.2 }), 'snow');
    }
  }

  return { top: rimY + lidRise };
}

export function generate({ seed = 1, season = 'summer', lod = 0, stage = 'shut' } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`unknown chest stage '${stage}'`);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('chest');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : rng.pick(STYLES);
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`chest-${seed}-${season}-${stage}-lod${detail}`);
  chestBody(mesh, compose(IDENTITY, rotateY(rng.rangeF(-0.14, 0.14))), {
    size: st.size,
    lidRise: st.lid,
    detail,
    rng,
    woodColor: hex(st.wood),
    rimColor: hex(st.rim),
    ironColor: hex(st.iron),
    bands: st.bands,
    handle: st.handle,
    open: stage === 'open',
    snowColor: snow,
  });
  return mesh;
}
