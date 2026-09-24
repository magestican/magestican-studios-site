














import { MeshData, translate } from '../../mesh/meshData.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { rod } from './rod.mjs';
import { emit } from '../../mesh/bevel.mjs';
import { bunting } from './homeDecor.mjs';
import { hex, vc } from './shade.mjs';

export const BIRTHDAY_BUNTING = Object.freeze({
  halfSpanM: 1.25,
  frontZM: 2.05,
  postH: 1.95,
  sag: 0.28,
  flags: 9,
  colors: Object.freeze(['#f7a8c4', '#f6d05b', '#9fd0dc', '#bfe0a8', '#fff1d6']),
  post: '#b3845a',
  string: '#fff4e0',
});

export function birthdayBunting({ seed = 1, lod = 0, cfg = BIRTHDAY_BUNTING } = {}) {
  const mesh = new MeshData('birthday-bunting');
  const rng = new SeededRng(seed).child('birthdayBunting');
  const { halfSpanM: x, frontZM: z, postH: h } = cfg;
  const detail = Math.min(1, lod);
  for (const side of [-1, 1]) {
    const lean = rng.rangeF(-0.03, 0.03);
    
    emit(mesh, 'wood', rod({ path: [[side * x, 0, z], [side * x + lean * 0.5, h * 0.55, z], [side * x + lean, h, z]], w: 0.06, sides: detail === 0 ? 6 : 4, detail, caps: 'round', scales: [1, 0.85, 0.7] }),
      { matrix: translate(0, 0, 0), color: vc(hex(cfg.post), { groundAO: 0.2 }) });
  }
  bunting(mesh, translate(0, 0, 0), {
    from: [-x, h - 0.04, z], to: [x, h - 0.04, z], sag: cfg.sag, flags: cfg.flags, flagH: 0.22, detail,
    rng, colors: cfg.colors, stringColor: hex(cfg.string), material: 'petal',
  });
  return mesh;
}
