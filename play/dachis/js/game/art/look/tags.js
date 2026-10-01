







import * as THREE from 'three';
import { patchSeeThrough } from '../../../engine/iso/seeThrough.js';
import { tagSpots, tagCells } from './worldRules.js';
import { extra } from './celLook.js';

const FONTS = [
  ['Sedgwick Ave Display', 'SedgwickAveDisplay-latin.woff2'],
  ['Permanent Marker', 'PermanentMarker-latin.woff2'],
];

const STYLES = {
  pink: ['Sedgwick Ave Display', '#ff3ea5', '#ffe14a', -0.08],
  teal: ['Sedgwick Ave Display', '#1ee3cf', '#ffffff', 0.06],
  arrow: ['Permanent Marker', '#ffe14a', '#111111', 0],
};
const CW = 512, CH = 192, COLS = 2; 

let fontsReady = null;
export function loadTagFonts() {
  if (fontsReady) return fontsReady;
  fontsReady = Promise.all(FONTS.map(([family, file]) => {
    const f = new FontFace(family, `url(${new URL('../../../../assets/fonts/' + file, import.meta.url).href})`);
    document.fonts.add(f);
    return f.load();
  })).catch(() => null); 
  return fontsReady;
}


function spray(x, ox, oy, text, style) {
  const [family, fill, stroke, rot] = STYLES[style] || STYLES.pink;
  x.save();
  x.beginPath(); x.rect(ox, oy, CW, CH); x.clip();
  x.translate(ox + CW / 2, oy + CH / 2 - 10); x.rotate(rot);
  let size = 130;
  x.font = `400 ${size}px "${family}"`;
  const fit = (CW * 0.84) / Math.max(1, x.measureText(text).width);
  if (fit < 1) { size = Math.floor(size * fit); x.font = `400 ${size}px "${family}"`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.shadowColor = fill; x.shadowBlur = 18;
  x.lineWidth = 24; x.strokeStyle = '#111'; x.strokeText(text, 0, 0);
  x.shadowBlur = 0; x.lineWidth = 9; x.strokeStyle = stroke; x.strokeText(text, 0, 0);
  x.fillStyle = fill; x.fillText(text, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * CW * 0.1 + Math.sin(i * 7) * 12, len = 14 + (i * 37 % 32);
    x.fillRect(dx, size * 0.3, 4, len); x.beginPath(); x.arc(dx + 2, size * 0.3 + len, 4, 0, 7); x.fill();
  }
  x.restore();
}

function decalMaterial(map, see) {
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  m.name = see ? 'cel:tag-wall' : 'cel:tag';
  if (see) patchSeeThrough(m);
  extra.push(m);
  return m;
}


function strip(cols, rows, rect, at) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const u = i / cols, v = j / rows;
    pos.push(...at(u, v)); uv.push(rect[0] + u * rect[2], rect[1] + v * rect[3]);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}


export function createTags(W, groups) {
  const spots = tagSpots(W), cells = tagCells(spots);
  const rows = Math.ceil(cells.length / COLS);
  const cv = document.createElement('canvas'); cv.width = CW * COLS; cv.height = CH * rows;
  const atlas = new THREE.CanvasTexture(cv);
  atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 4;
  const ground = decalMaterial(atlas, false), wall = decalMaterial(atlas, true);
  
  const rect = (k) => { const c = k % COLS, r = Math.floor(k / COLS); return [c / COLS, 1 - (r + 1) / rows, 1 / COLS, 1 / rows]; };
  for (const s of spots) {
    const g = groups[s.section];
    if (!g) continue;
    const cell = rect(cells.indexOf(s.style + '|' + s.text));
    let geo;
    if (s.kind === 'ground') {
      
      const [dx, dy] = s.dir, ux = dy, uy = -dx;
      geo = strip(8, 3, cell, (u, v) => {
        const x = s.x + dx * (u - 0.5) * s.w + ux * (v - 0.5) * s.h, y = s.y + dy * (u - 0.5) * s.w + uy * (v - 0.5) * s.h;
        return [x, W.groundAt(x, y) + 0.035, y];
      });
    } else {
      
      const base = W.groundAt(s.x, s.y) - 0.02, h = s.y1 - s.y0, len = s.arc;
      geo = strip(10, 1, [cell[0] + cell[2] * 0.04, cell[1] + cell[3] * 0.12, cell[2] * 0.92, cell[3] * 0.76], (u, v) => {
        const a = s.angle + (u - 0.5) * len;
        return [s.x + Math.sin(a) * s.r, base + s.y0 + v * h, s.y + Math.cos(a) * s.r];
      });
    }
    const mesh = new THREE.Mesh(geo, s.kind === 'ground' ? ground : wall);
    mesh.name = 'tag:' + s.text; mesh.renderOrder = 3; mesh.userData.keepMaterial = true;
    mesh.castShadow = mesh.receiveShadow = false; mesh.raycast = () => {};
    g.add(mesh);
  }
  loadTagFonts().then(() => {
    const x = cv.getContext('2d');
    cells.forEach((key, k) => { const [style, text] = key.split('|'); spray(x, (k % COLS) * CW, Math.floor(k / COLS) * CH, text, style); });
    atlas.needsUpdate = true;
  });
  return { spots, atlas };
}
