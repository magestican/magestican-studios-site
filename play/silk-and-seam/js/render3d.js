



import * as THREE from './vendor/three.module.min.js';
import { formMesh, sdf, toY, ARM } from './form3d.js';
import { normals } from './cloth.js';
import { init, renderer, mount, onRestore, mark } from './gfx.js';
import { lightScene } from './env3d.js';

export const hasWebGL2 = () => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};

const LINEN = '#e9dcc6';



const Y_END = 345;
let linenTex = null;
function linen() {
  if (linenTex) return linenTex;
  const W = 1024, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = LINEN; x.fillRect(0, 0, W, H);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) {                
    x.fillStyle = rnd() < 0.5 ? 'rgba(255,250,240,0.18)' : 'rgba(120,95,60,0.10)';
    const h = rnd() < 0.5; x.fillRect(rnd() * W, rnd() * H, h ? 6 + rnd() * 18 : 1, h ? 1 : 6 + rnd() * 18);
  }
  const seam = (px, vertical) => {
    x.strokeStyle = 'rgba(92,70,48,0.55)'; x.lineWidth = 2.2; x.beginPath();
    if (vertical) { x.moveTo(px, 0); x.lineTo(px, H); } else { x.moveTo(0, px); x.lineTo(W, px); }
    x.stroke();
    x.strokeStyle = 'rgba(92,70,48,0.35)'; x.lineWidth = 1; x.setLineDash([5, 4]); x.beginPath();
    for (const o of [-5, 5]) { if (vertical) { x.moveTo(px + o, 0); x.lineTo(px + o, H); } else { x.moveTo(0, px + o); x.lineTo(W, px + o); } }
    x.stroke(); x.setLineDash([]);
  };
  for (const u of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1]) seam(u * W, true);
  const vw = ((226 - 56) / (Y_END - 56)) ** (1 / 1.15);           
  x.fillStyle = 'rgba(70,52,36,0.75)'; x.fillRect(0, (1 - vw) * H - 5, W, 10);   
  linenTex = new THREE.CanvasTexture(cv);
  linenTex.colorSpace = THREE.SRGBColorSpace; linenTex.anisotropy = 4;
  return linenTex;
}

function formGroup(form) {
  const g = new THREE.Group();
  const m = formMesh(form, { yEnd: Y_END });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(m.uv, 2));
  geo.setIndex(m.idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: linen(), roughness: 0.92, side: THREE.DoubleSide });
  const torso = new THREE.Mesh(geo, mat);
  torso.castShadow = torso.receiveShadow = true;
  g.add(torso);
  
  
  if (form.under) {
    const u = formMesh(form, { yStart: 226, yEnd: form.under === 'crinoline' ? 548 : form.under === 'bubble' ? 420 : 338, rings: 60 });
    const ug = new THREE.BufferGeometry();
    ug.setAttribute('position', new THREE.Float32BufferAttribute(u.pos, 3)); ug.setIndex(u.idx); ug.computeVertexNormals();
    const um = new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ color: '#f3eee4', roughness: 0.95, side: THREE.DoubleSide }));
    um.castShadow = true; g.add(um);
  }
  
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.6, 2, 32), new THREE.MeshStandardMaterial({ color: '#6b4a34', roughness: 0.5 }));
  cap.position.y = toY(56) + 1; g.add(cap);
  
  const A = form.arm;
  for (const s of [1, -1]) {
    const len = Math.hypot(A.bot[0] - A.top[0], A.bot[1] - A.top[1]);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(A.r, len, 8, 24), mat);
    arm.position.set(s * (A.top[0] + A.bot[0]) / 2, (A.top[1] + A.bot[1]) / 2, 0);
    arm.rotation.z = s * Math.atan2(A.bot[0] - A.top[0], A.top[1] - A.bot[1]);
    arm.castShadow = true; g.add(arm);
  }
  
  const wood = new THREE.MeshStandardMaterial({ color: '#6b4a34', roughness: 0.55 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, toY(345), 16), wood);
  pole.position.y = toY(345) / 2; pole.castShadow = true; g.add(pole);
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 30), wood);
    leg.position.set(Math.sin(i * 2.094) * 14, 0.8, Math.cos(i * 2.094) * 14); leg.rotation.y = i * 2.094; g.add(leg);
  }
  return g;
}


function occlusion(c, form, out) {
  for (let i = 0; i < c.n; i++) {
    const d = sdf(form, c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2], true);
    out[i] = 0.72 + 0.28 * Math.min(1, Math.max(0, d) / 6);
  }
  return out;
}




export function garmentMesh(g, look = '#c8a27a') {
  const c = g.cloth, n = c ? c.n : g.n, mats = typeof look === 'object' && look ? look : null;
  const geo = new THREE.BufferGeometry();
  let pos = g.pos;
  if (c) { pos = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) pos[i] = c.pos[i]; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(c ? normals(c) : g.nrm, 3));
  const uv = c ? c.uv.slice(0, n * 2) : g.uv, slot = c ? c.slot : g.slot;
  if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const ao = c ? occlusion(c, g.form, new Float32Array(n)) : g.ao, col = new Float32Array(n * 3), base = new THREE.Color(mats ? '#ffffff' : look);
  for (let i = 0; i < n; i++) { col[i * 3] = base.r * ao[i]; col[i * 3 + 1] = base.g * ao[i]; col[i * 3 + 2] = base.b * ao[i]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const index = c ? Uint32Array.from(c.tris.flat()) : g.index;
  let mesh;
  if (mats && slot) {
    
    const out = new Uint32Array(index.length);
    let a = 0;
    for (const s of [1, 2]) {
      const from = a;
      for (let q = 0; q < index.length; q += 3) if ((slot[index[q]] || 1) === s) { out[a++] = index[q]; out[a++] = index[q + 1]; out[a++] = index[q + 2]; }
      if (a > from) geo.addGroup(from, a - from, s - 1);
    }
    geo.setIndex(new THREE.BufferAttribute(out, 1));
    mesh = new THREE.Mesh(geo, [mats[1], mats[2] || mats[1]]);
  } else {
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  }
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}




export async function createViewer(canvas, { night = false, mood = null, quality = 'auto', dof = false } = {}) {
  const t0 = performance.now();
  const tier = await init(quality);
  mark('init', performance.now() - t0);
  if (tier === 'off') throw new Error('WebGL2 unavailable');
  const R = renderer(), md = mood || (night ? 'lamp' : 'day');
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(24, 1, 10, 2000);
  const t1 = performance.now();
  lightScene(R, scene, md);
  mark('env', performance.now() - t1);
  const offRestore = onRestore(() => lightScene(R, scene, md));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const root = new THREE.Group(); scene.add(root);
  let formG = null, garm = null, yaw = 0, target = 120, dist = 640;
  const gv = mount(canvas, scene, cam, { mood: md, dof: dof ? { focus: dist, range: 300 } : null });
  gv.before = () => {
    cam.position.set(Math.sin(yaw) * dist, target + 20, Math.cos(yaw) * dist);
    cam.lookAt(0, target, 0);
    if (gv.opts.dof) gv.opts.dof.focus = dist;
  };
  gv.tick = (dt) => { yaw += dt * 0.6; };          
  return {
    three: THREE, scene, cam, renderer: R, gfxView: gv,
    setForm(form) { if (formG) root.remove(formG); formG = formGroup(form); root.add(formG); gv.invalidate(); },
    setGarment(g, look) {
      if (garm) { root.remove(garm); garm.geometry.dispose(); }
      garm = g ? garmentMesh(g, look) : null;
      if (garm) root.add(garm);
      gv.invalidate();
    },
    
    setLook(mats) {
      if (!garm || !Array.isArray(garm.material)) return;
      garm.material = [mats[1], mats[2] || mats[1]];
      gv.invalidate();
    },
    tier,
    view({ yaw: y = yaw, target: t = target, dist: d = dist } = {}) { yaw = y; target = t; dist = d; gv.invalidate(); },
    render: () => gv.render(),
    invalidate: () => gv.invalidate(),
    dispose() { gv.unmount(); offRestore(); if (garm) garm.geometry.dispose(); },
  };
}
export { ARM };
