





import * as THREE from './vendor/three.module.min.js';
import { init, renderer, mount, onRestore } from './gfx.js';
import { LAYOUT, MAP_W, MAP_H, LAMPS, ROADS, display } from './townmap.js';
import { townGeo, toWorld, WATER_H, SHORE, ATLAS, windowSpots } from './town3dgeo.js';

const C = Math.cos(28 * Math.PI / 180), S = Math.sin(28 * Math.PI / 180);
let built = null;           
const HL = { value: 0 };    


function rnd(seed) { let k = seed % 2147483646 + 1; return () => ((k = (k * 16807) % 2147483647) / 2147483647); }
function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texOf(c, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const grey = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;


function brickTex() {
  const s = 256, c = canvas(s), g = c.getContext('2d'), r = rnd(11);
  g.fillStyle = '#c9c2b6'; g.fillRect(0, 0, s, s);
  for (let row = 0; row < 8; row++) for (let i = -1; i < 5; i++) {
    const x = i * 64 + (row % 2) * 32, y = row * 32;
    g.fillStyle = grey(222 + r() * 30); g.fillRect(x + 2, y + 2, 60, 28);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(x + 2, y + 24, 60, 6);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(x + 4 + r() * 52, y + 4 + r() * 20, 3, 2); }
  }
  return texOf(c);
}
function stoneTex() {
  const s = 256, c = canvas(s), g = c.getContext('2d'), r = rnd(23);
  g.fillStyle = '#cdc6b8'; g.fillRect(0, 0, s, s);
  for (let row = 0; row < 4; row++) {
    let x = -((row * 53) % 90);
    while (x < s) { const w = 80 + r() * 50; g.fillStyle = grey(228 + r() * 22); g.fillRect(x + 2, row * 64 + 2, w - 3, 60); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 2, row * 64 + 2, w - 3, 3); x += w; }
  }
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * s, r() * s, 2, 2); }
  return texOf(c);
}
function plasterTex() {
  const s = 256, c = canvas(s), g = c.getContext('2d'), r = rnd(5);
  g.fillStyle = '#ece8e0'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.06})`; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 5, 0, 7); g.fill(); }
  return texOf(c);
}
function roofTex() {
  const s = 256, c = canvas(s), g = c.getContext('2d'), r = rnd(7), rh = s / 6;
  g.fillStyle = '#8f8f8f'; g.fillRect(0, 0, s, s);
  for (let row = 0; row < 6; row++) for (let i = -1; i < 9; i++) {
    const x = i * 32 + (row % 2) * 16, y = row * rh, v = 205 + r() * 40;
    const grd = g.createLinearGradient(0, y, 0, y + rh); grd.addColorStop(0, grey(v * 0.78)); grd.addColorStop(1, grey(v));
    g.fillStyle = grd; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + rh - 8); g.quadraticCurveTo(x + 16, y + rh + 4, x + 1, y + rh - 8); g.closePath(); g.fill();
  }
  return texOf(c);
}
function woodTex() {
  const s = 128, c = canvas(s), g = c.getContext('2d'), r = rnd(3);
  for (let i = 0; i < 4; i++) { g.fillStyle = grey(215 + r() * 30); g.fillRect(i * 32, 0, 31, s); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(i * 32 + 31, 0, 1, s); for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(i * 32 + r() * 30, 0, 1, s); } }
  return texOf(c);
}
function leafTex() {
  const s = 128, c = canvas(s), g = c.getContext('2d'), r = rnd(9);
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 500; k++) { g.fillStyle = grey(150 + r() * 105); g.beginPath(); g.arc(r() * s, r() * s, 2 + r() * 4, 0, 7); g.fill(); }
  return texOf(c);
}
function glowTex() {
  const s = 64, c = canvas(s), g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,.9)'); grd.addColorStop(0.35, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  return texOf(c, { repeat: false });
}
function glassTex() {
  const s = 64, c = canvas(s), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, s, s); grd.addColorStop(0, '#9fb6c4'); grd.addColorStop(0.45, '#5f7686'); grd.addColorStop(1, '#3f5262');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(0, 18); g.lineTo(18, 0); g.lineTo(28, 0); g.lineTo(0, 28); g.fill();
  return texOf(c, { repeat: false });
}
function waterNormal() {
  const s = 128, c = canvas(s), g = c.getContext('2d'), img = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const a = Math.PI * 2 / s, nx = 0.35 * Math.cos(x * a * 3 + Math.sin(y * a * 2) * 2), ny = 0.35 * Math.cos(y * a * 4 + Math.sin(x * a) * 1.5);
    const i = (y * s + x) * 4; img.data[i] = 128 + nx * 127; img.data[i + 1] = 128 + ny * 127; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return texOf(c, { srgb: false });
}


function cobbleTiles() {
  const s = 64, col = canvas(s), nrm = canvas(s), g = col.getContext('2d'), n = nrm.getContext('2d'), r = rnd(17);
  g.fillStyle = '#857a68'; g.fillRect(0, 0, s, s);
  n.fillStyle = 'rgb(128,128,255)'; n.fillRect(0, 0, s, s);
  for (let row = 0; row < 8; row++) for (let i = -1; i < 9; i++) {
    const x = i * 8 + (row % 2) * 4 + 4, y = row * 8 + 4, v = 160 + r() * 50, tint = r();
    g.fillStyle = `rgb(${v + tint * 14 | 0},${v + tint * 6 | 0},${v - 8 | 0})`; g.beginPath(); g.ellipse(x, y, 3.4, 3.2, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x - 1, y - 1, 1.6, 1.2, 0, 0, 7); g.fill();
    
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy > 11) continue;
      n.fillStyle = `rgb(${128 + dx * 26},${128 - dy * 26},${235})`; n.fillRect(((x + dx) % s + s) % s, ((y + dy) % s + s) % s, 1, 1);
    }
  }
  return { col, nrm };
}



const GX0 = -40, GX1 = 1640, GY0 = 160, GY1 = 900;
function groundTextures(size) {
  const W = size, H = size / 2, sx = W / (GX1 - GX0), sy = H / (GY1 - GY0);
  const col = canvas(W, H), nrm = canvas(W, H), g = col.getContext('2d'), n = nrm.getContext('2d'), r = rnd(31);
  const toPx = (ctx) => ctx.setTransform(sx, 0, 0, sy, -GX0 * sx, -GY0 * sy);
  
  g.fillStyle = '#a5bb80'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < W * H / 260; k++) { g.fillStyle = r() < 0.5 ? 'rgba(70,100,40,.12)' : 'rgba(230,240,190,.1)'; g.fillRect(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2); }
  n.fillStyle = 'rgb(128,128,255)'; n.fillRect(0, 0, W, H);
  const tiles = cobbleTiles();
  
  const paved = (ctx, tile, kerb, gutter) => {
    const m = canvas(W, H), mc = m.getContext('2d');
    toPx(mc); mc.strokeStyle = '#fff'; mc.lineCap = 'round'; mc.lineWidth = 38;
    for (const d of ROADS) mc.stroke(new Path2D(d));
    mc.beginPath(); mc.ellipse(785, 560, 168, 46, 0, 0, 7); mc.fill();
    mc.lineWidth = 15; mc.stroke(new Path2D('M1000,318 C1100,300 1300,298 1600,300'));
    mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalCompositeOperation = 'source-in';
    mc.fillStyle = mc.createPattern(tile, 'repeat'); mc.fillRect(0, 0, W, H);
    toPx(ctx);
    if (kerb) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = kerb; ctx.lineWidth = 46; for (const d of ROADS) ctx.stroke(new Path2D(d));
      ctx.strokeStyle = gutter; ctx.lineWidth = 41; for (const d of ROADS) ctx.stroke(new Path2D(d));
      ctx.fillStyle = kerb; ctx.beginPath(); ctx.ellipse(785, 560, 174, 51, 0, 0, 7); ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(m, 0, 0);
  };
  paved(g, tiles.col, '#b9ad94', '#6f6656');
  paved(n, tiles.nrm, null, null);
  
  toPx(g);
  for (const [id, L] of Object.entries(LAYOUT)) {
    if (id === 'fishmarket') continue;
    const x0 = L.x - L.w / 2 - 12, x1 = L.x + L.w / 2 + 12;
    g.fillStyle = '#c9bfa8'; g.fillRect(x0, L.y - 2, x1 - x0, 14);
    g.strokeStyle = 'rgba(90,80,64,.45)'; g.lineWidth = 0.7;
    for (let x = x0; x < x1; x += 12) { g.beginPath(); g.moveTo(x, L.y - 2); g.lineTo(x, L.y + 12); g.stroke(); }
    g.beginPath(); g.moveTo(x0, L.y + 5); g.lineTo(x1, L.y + 5); g.stroke();
    g.fillStyle = '#8f846c'; g.fillRect(x0, L.y + 11, x1 - x0, 2);
  }
  
  const shore = new Path2D(`M${SHORE[0]} C${SHORE[1]} ${SHORE[2]} ${SHORE[3]} C${SHORE[4]} ${SHORE[5]} ${SHORE[6]} L470,${GY1} L${GX0},${GY1} L${GX0},560 Z`);
  g.globalCompositeOperation = 'destination-out'; g.fill(shore); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#cbbf a3'.replace(' ', ''); g.lineWidth = 7;
  g.stroke(new Path2D(`M${SHORE[0]} C${SHORE[1]} ${SHORE[2]} ${SHORE[3]} C${SHORE[4]} ${SHORE[5]} ${SHORE[6]}`));
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tc = texOf(col, { repeat: false }), tn = texOf(nrm, { repeat: false, srgb: false });
  return { tc, tn };
}


const svgImg = (w, h, inner, px, py) => new Promise((res) => {
  const img = new Image();
  img.onload = () => res(img); img.onerror = () => res(null);
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${py}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${inner}</svg>`);
});
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function atlasArt(buildings) {
  const out = {};
  for (const b of buildings) {
    const L = LAYOUT[b.id];
    if (!L) continue;
    const sgw = b.id === 'fishmarket' ? 152 : b.id === 'stanne' ? 96 : Math.min(L.w * 0.92, 152);
    out[`sign:${b.id}`] = [sgw, 22, `<rect x="1" y="1" width="${sgw - 2}" height="20" rx="3" fill="${L.neon ? '#141a30' : '#3a2612'}" stroke="${L.trim}" stroke-width="2"/><text x="${sgw / 2}" y="15.5" font-family="Georgia,serif" font-style="italic" font-size="${b.sign.length > 16 ? 10 : 13}" text-anchor="middle" fill="${L.neon ? '#8fd8ff' : '#f7e3b5'}">${esc(b.sign)}</text>`];
    const sw = b.id === 'fishmarket' ? L.w - 16 : L.w * 0.56;
    const inner = b.id === 'fishmarket' ? `<rect width="${sw}" height="58" fill="#e8f2f4"/>${display('fish', 0, 10, sw, 46)}`
      : L.display === 'laundry' ? `<rect width="${sw}" height="58" fill="#6a7a80"/><circle cx="20" cy="22" r="12" fill="#fff" fill-opacity=".5"/><circle cx="44" cy="16" r="14" fill="#fff" fill-opacity=".4"/><circle cx="70" cy="26" r="12" fill="#fff" fill-opacity=".45"/>`
        : `<rect width="${sw}" height="58" fill="#fff3d6"/>${display(L.display, 3, 3, sw - 6, 52)}`;
    out[`shop:${b.id}`] = [sw, 58, inner];
  }
  const glass = ['#c0392b', '#2c5aa0', '#e8b84a', '#3a8a5a'];
  out.rose = [40, 40, `<circle cx="20" cy="20" r="19" fill="#8a7a6a"/><circle cx="20" cy="20" r="16" fill="#2a2a3a"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((r, i) => `<path d="M20,20 L20,5" stroke="${glass[i % 4]}" stroke-width="6" transform="rotate(${r} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="4" fill="#e8b84a"/>`];
  out.lancet = [18, 60, `<path d="M0,60 V9 a9,9 0 0 1 18,0 V60 Z" fill="#8a7a6a"/><path d="M2,60 V10 a7,7 0 0 1 14,0 V60 Z" fill="#2a2a3a"/>${[0, 1, 2].map((i) => `<rect x="3" y="${8 + i * 17}" width="12" height="15" fill="${glass[i]}"/>`).join('')}<path d="M9,2 V60" stroke="#8a7a6a" stroke-width="1.5"/>`];
  out.churchdoor = [40, 66, `<path d="M0,66 V20 a20,20 0 0 1 40,0 V66 Z" fill="#5a3a2a"/><path d="M20,2 V66" stroke="#3a2618" stroke-width="2"/><circle cx="15" cy="40" r="2" fill="#e2c06b"/><circle cx="25" cy="40" r="2" fill="#e2c06b"/>`];
  const now = new Date(), hr = (now.getHours() % 12 + now.getMinutes() / 60) * 30, mn = now.getMinutes() * 6;
  out.clock = [30, 30, `<circle cx="15" cy="15" r="14.5" fill="#6b4a2f"/><circle cx="15" cy="15" r="12.5" fill="#f6ecd4"/>${[...Array(12)].map((_, i) => `<path d="M15,3.5 v2" stroke="#3a2a22" stroke-width="1" transform="rotate(${i * 30} 15 15)"/>`).join('')}<path d="M15,15 V8" stroke="#3a2a22" stroke-width="1.8" transform="rotate(${hr} 15 15)"/><path d="M15,15 V5" stroke="#3a2a22" stroke-width="1.2" transform="rotate(${mn} 15 15)"/><circle cx="15" cy="15" r="1.2" fill="#3a2a22"/>`];
  out['poster:tosca'] = [30, 42, `<rect width="30" height="42" fill="#8a2f3a"/><rect x="2" y="2" width="26" height="38" fill="none" stroke="#e8b84a" stroke-width="1"/><text x="15" y="24" font-size="6" font-family="Georgia,serif" text-anchor="middle" fill="#f7e3b5">TOSCA</text>`];
  out['poster:flute'] = [30, 42, `<rect width="30" height="42" fill="#2c3e6a"/><rect x="2" y="2" width="26" height="38" fill="none" stroke="#e8b84a" stroke-width="1"/><text x="15" y="21" font-size="5" font-family="Georgia,serif" text-anchor="middle" fill="#f7e3b5">MAGIC</text><text x="15" y="28" font-size="5" font-family="Georgia,serif" text-anchor="middle" fill="#f7e3b5">FLUTE</text>`];
  out['opera:sign'] = [140, 18, `<rect width="140" height="18" fill="#3a2612" stroke="#b28a35" stroke-width="2"/><text x="70" y="13" font-family="Georgia,serif" font-size="12" letter-spacing="4" text-anchor="middle" fill="#f7e3b5">OPERA</text>`];
  out['opera:door'] = [28, 70, `<rect x="0" y="14" width="28" height="56" fill="#6a1f28"/><circle cx="14" cy="14" r="14" fill="#6a1f28"/><rect x="3" y="16" width="22" height="54" fill="#ffd98a" fill-opacity=".22"/><path d="M14,4 V70" stroke="#3a1014" stroke-width="1.5"/>`];
  out.tympanum = [88, 32, `<path d="M0,32 L44,0 L88,32 Z" fill="#d9c7a4"/><circle cx="44" cy="20" r="6" fill="#b28a35"/>`];
  out.dormer = [26, 28, `<rect x="0" y="11" width="26" height="17" fill="#e8dfcf"/><circle cx="13" cy="13" r="13" fill="#e8dfcf"/><rect x="4" y="12" width="18" height="14" fill="#f7e2a6"/><circle cx="13" cy="13" r="9" fill="#f7e2a6"/><path d="M13,4 V26 M4,17 H22" stroke="#8a8070" stroke-width="1.5"/>`];
  out.roundwin = [20, 20, `<circle cx="10" cy="10" r="10" fill="#e2c06b"/><circle cx="10" cy="10" r="7.5" fill="#a9c3cc"/><path d="M10,2.5 V17.5 M2.5,10 H17.5" stroke="#6b4a2f" stroke-width="1.5"/>`];
  out.neon = [10, 10, '<rect width="10" height="10" fill="#8fd8ff"/>'];
  return out;
}
async function paintAtlas(tex, cells, buildings) {
  const g = tex.image.getContext('2d'), art = atlasArt(buildings);
  await Promise.all(Object.entries(art).map(async ([id, [w, h, inner]]) => {
    const c = cells[id];
    if (!c) return;
    const [x, y, cw, ch] = c.px, img = await svgImg(w, h, inner, cw, ch);
    if (img) g.drawImage(img, x, y, cw, ch);
  }));
  tex.needsUpdate = true;
}


function skyTex(night) {
  const c = canvas(512, 512), g = c.getContext('2d'), r = rnd(night ? 41 : 43);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  if (night) { grd.addColorStop(0, '#0c1230'); grd.addColorStop(0.55, '#2a2f5e'); grd.addColorStop(1, '#5a4a6e'); } else { grd.addColorStop(0, '#8fc0da'); grd.addColorStop(0.6, '#cfe2e6'); grd.addColorStop(1, '#f4dcae'); }
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  if (night) {
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,248,224,${0.4 + r() * 0.6})`; g.beginPath(); g.arc(r() * 512, r() * 300, 0.4 + r() * 1.1, 0, 7); g.fill(); }
    const mg = g.createRadialGradient(205, 60, 4, 205, 60, 46); mg.addColorStop(0, 'rgba(255,246,216,.6)'); mg.addColorStop(1, 'rgba(255,246,216,0)');
    g.fillStyle = mg; g.fillRect(150, 10, 110, 110); g.fillStyle = '#fbf2d4'; g.beginPath(); g.arc(205, 60, 13, 0, 7); g.fill();
  } else {
    for (const [x, y, s] of [[60, 50, 1], [250, 30, 0.8], [400, 70, 0.9]]) {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (const [dx, dy, rr] of [[0, 0, 16], [18, -8, 20], [40, 0, 16], [20, 6, 18]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, rr * s, 0, 7); g.fill(); }
    }
  }
  const t = texOf(c, { repeat: false });
  return t;
}


function makeMaterials(tier, atlas) {
  const T = { brick: brickTex(), stone: stoneTex(), plaster: plasterTex(), roof: roofTex(), wood: woodTex(), leaf: leafTex(), glass: glassTex() };
  const std = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...o });
  const m = {
    brick: std({ map: T.brick, roughness: 0.92 }),
    stone: std({ map: T.stone, roughness: 0.88 }),
    plaster: std({ map: T.plaster, roughness: 0.95 }),
    trim: std({ map: T.plaster, roughness: 0.8 }),
    wood: std({ map: T.wood, roughness: 0.85 }),
    roof: std({ map: T.roof, roughness: 0.8 }),
    dome: std({ map: T.plaster, roughness: 0.55, metalness: 0.35 }),
    cloth: std({ map: T.plaster, roughness: 0.95, side: THREE.DoubleSide }),
    bark: std({ map: T.wood, roughness: 1 }),
    leaf: std({ map: T.leaf, roughness: 0.95 }),
    grassFar: std({ map: T.plaster, roughness: 1 }),
    metal: std({ roughness: 0.45, metalness: 0.6 }),
    gold: std({ roughness: 0.3, metalness: 0.85 }),
    glass: std({ map: T.glass, roughness: 0.12, metalness: 0.3 }),
    glassLit: std({ map: T.glass, roughness: 0.12, metalness: 0.3, emissive: new THREE.Color('#ffc870'), emissiveIntensity: 0 }),
    display: std({ map: atlas, alphaTest: 0.5, roughness: 0.6, emissive: new THREE.Color('#ffffff'), emissiveMap: atlas, emissiveIntensity: 0 }),
    glassArt: std({ map: atlas, alphaTest: 0.5, roughness: 0.3, emissive: new THREE.Color('#ffffff'), emissiveMap: atlas, emissiveIntensity: 0 }),
    atlas: std({ map: atlas, alphaTest: 0.5, roughness: 0.7 }),
    neon: std({ emissive: new THREE.Color('#8fd8ff'), emissiveIntensity: 0.4 }),
    lampGlass: std({ emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0 }),
    lantern: std({ emissive: new THREE.Color('#ff5a3a'), emissiveIntensity: 0, side: THREE.DoubleSide }),
    water: std({ roughness: 0.18, metalness: 0.15, normalMap: waterNormal(), normalScale: new THREE.Vector2(0.5, 0.5) }),
  };
  
  m.glow = new THREE.MeshBasicMaterial({ map: glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 });
  if (tier === 'low') for (const k of ['glass', 'glassLit']) { m[k].metalness = 0; m[k].roughness = 0.35; }
  for (const [k, mat] of Object.entries(m)) if (k !== 'glow') hookHighlight(mat);
  return m;
}


function hookHighlight(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uHL = HL;
    sh.vertexShader = 'attribute float bid;\nvarying float vBid;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBid = bid;');
    sh.fragmentShader = 'uniform float uHL;\nvarying float vBid;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif (uHL > 0.5 && abs(vBid - uHL) < 0.5) totalEmissiveRadiance += diffuseColor.rgb * 0.28 + vec3(0.04, 0.03, 0.0);');
  };
  mat.customProgramCacheKey = () => 'town-hl';
}


async function build(buildings, tier) {
  const t0 = performance.now();
  const ids = Object.keys(LAYOUT);
  const { M, per, cells } = townGeo(ids);
  const atlasCanvas = canvas(ATLAS.size, ATLAS.size), atlas = texOf(atlasCanvas, { repeat: false });
  const mats = makeMaterials(tier, atlas);
  const scene = new THREE.Scene(), town = new THREE.Group();
  let draws = 0, tris = 0;
  for (const [k, B] of Object.entries(M.b)) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
    geo.setAttribute('bid', new THREE.Float32BufferAttribute(B.id, 1));
    const mesh = new THREE.Mesh(geo, mats[k] || mats.plaster);
    mesh.castShadow = !['water', 'grassFar', 'glass', 'glassLit', 'display', 'neon', 'glow'].includes(k);
    mesh.receiveShadow = k !== 'glow';
    if (k === 'glow') { mesh.renderOrder = 10; mesh.visible = false; }
    mesh.name = k;
    town.add(mesh); draws++; tris += B.p.length / 9;
  }
  
  const gsize = tier === 'low' ? 2048 : 4096;
  const { tc, tn } = groundTextures(Math.min(gsize, renderer().capabilities.maxTextureSize));
  const gGeo = new THREE.BufferGeometry(), a = toWorld(GX0, GY0, 0), b = toWorld(GX1, GY0, 0), c2 = toWorld(GX1, GY1, 0), d = toWorld(GX0, GY1, 0);
  gGeo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...d, ...c2, ...a, ...c2, ...b], 3));
  gGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  gGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1], 2));
  const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ map: tc, normalMap: tn, normalScale: new THREE.Vector2(0.8, 0.8), alphaTest: 0.5, roughness: 0.92 }));
  ground.receiveShadow = true; ground.name = 'ground';
  const wGeo = new THREE.BufferGeometry(), wa = toWorld(GX0, 540, WATER_H), wb = toWorld(520, 540, WATER_H), wc = toWorld(520, GY1, WATER_H), wd = toWorld(GX0, GY1, WATER_H);
  wGeo.setAttribute('position', new THREE.Float32BufferAttribute([...wa, ...wd, ...wc, ...wa, ...wc, ...wb], 3));
  wGeo.setAttribute('normal', new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
  wGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 6, 8, 6, 0, 0, 8, 6, 8, 0], 2));
  wGeo.setAttribute('color', new THREE.Float32BufferAttribute(Array(6).fill([0.08, 0.24, 0.32]).flat(), 3));
  const water = new THREE.Mesh(wGeo, mats.water); water.receiveShadow = true; water.name = 'harbour';
  scene.add(town, ground, water); draws += 2; tris += 4;
  
  const target = new THREE.Object3D(); target.position.set(...toWorld(800, 560, 0)); scene.add(target);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4);
  sun.target = target; sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -1150, right: 1150, top: 1150, bottom: -1150, near: 50, far: 6000 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.5;
  
  
  sun.shadow.autoUpdate = false; sun.shadow.needsUpdate = true;
  onRestore(() => { sun.shadow.needsUpdate = true; });
  const hemi = new THREE.HemisphereLight('#fff4e2', '#8a9a6a', 1.1);
  const lamps = [];
  if (tier !== 'low') for (const [x, y] of LAMPS.slice(0, 8)) { const p = new THREE.PointLight('#ffc878', 0, 260, 1.2); p.position.set(...toWorld(x, y + 2, 50)); lamps.push(p); scene.add(p); }
  scene.add(sun, hemi);
  built = { scene, mats, sun, hemi, lamps, target, ids, per, draws, tris, night: null, skies: {}, buildMs: 0 };
  setLight(false);
  built.atlasReady = paintAtlas(atlas, cells, buildings).then(() => built.views?.forEach((v) => v.invalidate()));
  built.buildMs = Math.round(performance.now() - t0);
  return built;
}

function setLight(night) {
  const B = built;
  if (B.night === night) return;
  B.night = night;
  const dir = night ? [0.45, 0.85, 0.4] : [-0.55, 0.8, 0.5];
  B.sun.position.copy(B.target.position).add(new THREE.Vector3(...dir).normalize().multiplyScalar(2600));
  B.sun.shadow.needsUpdate = true;
  B.sun.color.set(night ? '#a9b8f0' : '#fff1d6'); B.sun.intensity = night ? 1.4 : 2.5;
  B.hemi.color.set(night ? '#7a88c8' : '#fff4e2'); B.hemi.groundColor.set(night ? '#2a2840' : '#8a9a6a'); B.hemi.intensity = night ? 1.5 : 1.15;
  const m = B.mats;
  m.glassLit.emissiveIntensity = night ? 1.5 : 0;
  m.display.emissiveIntensity = night ? 0.5 : 0;
  m.glassArt.emissiveIntensity = night ? 0.9 : 0;
  m.lampGlass.emissiveIntensity = night ? 3 : 0;
  m.lantern.emissiveIntensity = night ? 1.6 : 0;
  m.neon.emissiveIntensity = night ? 3 : 0.4;
  for (const p of B.lamps) p.intensity = night ? 40 : 0;
  const gm = B.scene.getObjectByName('glow');
  if (gm) gm.visible = night;
  B.scene.background = B.skies[night] ||= skyTex(night);
}



export async function townView(canvas, { night = false, buildings = [], quality = 'auto' } = {}) {
  const t0 = performance.now();
  const tier = await init(quality);
  if (tier === 'off') return null;
  if (!built) await build(buildings, tier);
  setLight(!!night);
  const cam = new THREE.OrthographicCamera(0, MAP_W, 0, -MAP_H, -4000, 4000);
  cam.up.set(0, C, -S); cam.position.set(0, 0, 0); cam.lookAt(0, -S, -C);
  const gv = mount(canvas, built.scene, cam, { mood: night ? 'moon' : 'day' });
  (built.views ||= new Set()).add(gv);
  gv.before = () => {
    
    const w = canvas.clientWidth || MAP_W, h = canvas.clientHeight || MAP_H, k = Math.min(w / MAP_W, h / MAP_H);
    const vw = w / k, vh = h / k;
    cam.left = MAP_W / 2 - vw / 2; cam.right = MAP_W / 2 + vw / 2; cam.top = -(MAP_H / 2 - vh / 2); cam.bottom = -(MAP_H / 2 + vh / 2);
    cam.updateProjectionMatrix();
    if (!built.sun.shadow.map) built.sun.shadow.needsUpdate = true;   
  };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => gv.invalidate()) : null;
  ro?.observe(canvas);
  let shown = null;
  const firstFrame = new Promise((res) => { const check = () => { if (window.__gfx && canvas.width > 1) { shown = Math.round(performance.now() - t0); res(shown); } else requestAnimationFrame(check); }; requestAnimationFrame(check); });
  return {
    tier, firstFrame,
    info: () => ({ tier, draws: built.draws, tris: built.tris, buildMs: built.buildMs, shownMs: shown, per: built.per }),
    setNight(n) { setLight(!!n); gv.opts.mood = n ? 'moon' : 'day'; gv.invalidate(); },
    highlight(id) { const i = id ? built.ids.indexOf(id) + 1 : 0; if (HL.value !== i) { HL.value = i; gv.invalidate(); } },
    dispose() { ro?.disconnect(); built.views.delete(gv); gv.unmount(); },
  };
}


export const litWindows = (id) => windowSpots(LAYOUT[id]).filter((w) => w.night).length;
