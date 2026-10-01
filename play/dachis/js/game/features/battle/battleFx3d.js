










import * as THREE from 'three';
import { G, S } from '../../state.js';
import { celUniforms, extra } from '../../art/look/celLook.js';
import { CHAR_SCALE } from '../world/crowd.js';
import { speciesById } from '../../data/species.js';
import { blobFor } from './comic.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const HASH = 'float hash1(float n){ return fract(sin(n * 91.345) * 43758.5453); }\n';

const STAR_FRAG = HASH +  `
  uniform float uK, uSeed, uBig; uniform vec3 uFill, uCore, uRim, uLines; uniform float uCelCell;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0; float a = atan(p.y, p.x), r = length(p);
    float n = 11.0 + 3.0 * uBig, w = a / 6.2832 * n + uSeed;
    float tri = abs(fract(w) * 2.0 - 1.0), spike = hash1(floor(w) + uSeed * 7.0);
    float edge = (0.36 + 0.5 * pow(1.0 - tri, 1.7) * (0.7 + 0.3 * spike)) * 0.86;
    // the dissolve: from 55% of its life a dot screen eats the star (the comic's own fade)
    vec2 f = fract(gl_FragCoord.xy / uCelCell) - 0.5;
    float fade = smoothstep(0.5, 1.0, uK);
    if (length(f) < fade * 0.78) discard;
    if (r < edge) {
      float dots = step(length(f), 0.42 * (1.0 - r / edge));
      gl_FragColor = vec4(mix(uFill, uCore, dots), 1.0); return;
    }
    if (r < edge + 0.06) { gl_FragColor = vec4(uRim, 1.0); return; }
    // speed lines: thin wedges out to the edge, a random third of them, shorter on a small hit
    float k = a / 6.2832 * 40.0 + uSeed * 3.1, cell = floor(k);
    float on = step(0.62, hash1(cell + 13.0)) * step(abs(fract(k) - 0.5), 0.09 + 0.04 * uBig);
    float reach = 0.78 + 0.2 * hash1(cell + 5.0);
    if (on > 0.5 && r > edge + 0.12 && r < reach) { gl_FragColor = vec4(uLines, 0.95); return; }
    discard;
  }`;

const STREAK_FRAG = HASH +  `
  uniform float uK, uSeed; varying vec2 vUv;
  void main() {
    float row = floor(vUv.y * 12.0), on = step(0.4, hash1(row + uSeed));
    float len = (0.35 + 0.6 * hash1(row * 3.0 + uSeed)) * (1.0 - uK * 0.5), x = 1.0 - vUv.x;
    if (on < 0.5 || x > len || abs(fract(vUv.y * 12.0) - 0.5) > 0.17) discard;
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.9 * (1.0 - x / len) * (1.0 - uK));
  }`;

const BLOB_VERT =  `
  attribute float aAlpha; varying vec2 vP; varying float vA;
  void main(){ vP = uv * 2.0 - 1.0; vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`;
const BLOB_FRAG =  `
  uniform float uCelCell; varying vec2 vP; varying float vA;
  void main(){
    float d = length(vP); if (d > 1.0) discard;
    vec2 f = fract(gl_FragCoord.xy / (uCelCell * 0.85)) - 0.5;
    float dot_ = step(length(f), (1.0 - d) * 0.62);
    if (dot_ < 0.5 && d > 0.72) discard;
    gl_FragColor = vec4(0.13, 0.07, 0.22, (dot_ > 0.5 ? 0.9 : 0.45) * vA);
  }`;

const C = (h) => new THREE.Color(h);
const STAR = { fill: C('#ffe14a'), core: C('#fffbe8'), rim: C('#0d0a14'), lines: C('#0d0a14') };
const STAR_CORRUPT = { fill: C('#2a1238'), core: C('#ff2a3a'), rim: C('#ff2a3a'), lines: C('#0d0a14') };
const BURSTS = 3, STREAKS = 2, BLOBS = 4;

let fx = null;
const facing = (q, cam) => { q.onBeforeRender = () => { q.quaternion.copy(cam.quaternion).multiply(q.userData.spin); }; };

function starMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uSeed: { value: 0 }, uBig: { value: 0 }, uFill: { value: STAR.fill.clone() }, uCore: { value: STAR.core.clone() },
      uRim: { value: STAR.rim.clone() }, uLines: { value: STAR.lines.clone() }, uCelCell: celUniforms.uCelCell },
    vertexShader: VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, depthTest: false,
  });
}
function streakMat() {
  return new THREE.ShaderMaterial({ uniforms: { uK: { value: 0 }, uSeed: { value: 0 } }, vertexShader: VERT, fragmentShader: STREAK_FRAG, transparent: true, depthWrite: false, depthTest: false });
}

export function initBattleFx(stage) {
  if (fx) return fx;
  const cam = stage.camera, root = new THREE.Group(); root.name = 'battleFx';
  const quad = new THREE.PlaneGeometry(1, 1);
  const mk = (mat, order) => { const q = new THREE.Mesh(quad, mat); q.visible = false; q.renderOrder = order; q.frustumCulled = false; q.userData.spin = new THREE.Quaternion(); facing(q, cam); root.add(q); return q; };
  const bursts = Array.from({ length: BURSTS }, () => mk(starMat(), 12));
  const streaks = Array.from({ length: STREAKS }, () => mk(streakMat(), 11));
  const flat = new THREE.PlaneGeometry(2, 2); flat.rotateX(-Math.PI / 2);
  const alpha = new THREE.InstancedBufferAttribute(new Float32Array(BLOBS), 1); flat.setAttribute('aAlpha', alpha);
  const blobMat = new THREE.ShaderMaterial({ uniforms: { uCelCell: celUniforms.uCelCell }, vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const blobs = new THREE.InstancedMesh(flat, blobMat, BLOBS); blobs.count = 0; blobs.renderOrder = 1; blobs.frustumCulled = false; blobs.visible = false;
  root.add(blobs);
  stage.scene.add(root);
  extra.push(bursts[0].material, streaks[0].material, blobs); 
  fx = { bursts, streaks, blobs, alpha, m: new THREE.Matrix4(), q: new THREE.Quaternion(), z: new THREE.Vector3(0, 0, 1) };
  return fx;
}

const tallOf = (f) => (f && f.d && speciesById(f.d.sp).boss ? 1.6 : 1);
function hideAll() { for (const q of fx.bursts) q.visible = false; for (const q of fx.streaks) q.visible = false; fx.blobs.visible = false; }


export function updateBattleFx(B) {
  if (!fx) return;
  if (!B) { hideAll(); return; }
  const W = S.W;
  
  const list = B.fx.filter((e) => e.kind === 'burst').slice(-BURSTS);
  fx.bursts.forEach((q, i) => {
    const e = list[i];
    if (!e) { q.visible = false; return; }
    const k = Math.min(1, e.t / e.life), tall = tallOf(e.f), size = (e.big ? 2.4 : 1.6) * CHAR_SCALE * tall * (0.55 + 0.45 * Math.min(1, k * 5));
    const u = q.material.uniforms, pal = e.corrupt ? STAR_CORRUPT : STAR;
    if (!e.seed) e.seed = 1 + Math.random() * 9;
    u.uK.value = k; u.uSeed.value = e.seed; u.uBig.value = e.big ? 1 : 0;
    u.uFill.value.copy(pal.fill); u.uCore.value.copy(pal.core); u.uRim.value.copy(pal.rim); u.uLines.value.copy(pal.lines);
    
    const o = e.f === B.ally ? B.enemy : e.f === B.enemy ? B.ally : null, ol = o ? Math.hypot(o.x - e.x, o.y - e.y) || 1 : 1;
    const off = o ? 0.45 * CHAR_SCALE * tall / ol : 0, hx = e.x + (o ? (o.x - e.x) * off : 0), hy = e.y + (o ? (o.y - e.y) * off : 0);
    q.position.set(hx, W.groundAt(e.x, e.y) + 0.55 * CHAR_SCALE * tall, hy);
    q.scale.set(size, size, 1); q.userData.spin.setFromAxisAngle(fx.z, e.seed); q.visible = true;
  });
  
  const lungers = [B.ally, B.enemy].filter((f) => f && f.lunge > 0.05 && f.bb && f.bb.root.visible);
  fx.streaks.forEach((q, i) => {
    const f = lungers[i], o = f && (f === B.ally ? B.enemy : B.ally);
    if (!f || !o) { q.visible = false; return; }
    const [ax, ay] = S.stage.toScreen(f.x, f.y, 0), [bx, by] = S.stage.toScreen(o.x, o.y, 0);
    const ang = Math.atan2(-(by - ay), bx - ax), len = Math.hypot(f.x - o.x, f.y - o.y) || 1, tall = tallOf(f);
    const back = 0.55 * CHAR_SCALE * tall, dx = (f.x - o.x) / len, dy = (f.y - o.y) / len;
    q.position.set(f.x + dx * back, W.groundAt(f.x, f.y) + 0.5 * CHAR_SCALE * tall, f.y + dy * back);
    q.scale.set(1.5 * CHAR_SCALE * tall, 0.8 * CHAR_SCALE * tall, 1);
    q.userData.spin.setFromAxisAngle(fx.z, ang);
    q.material.uniforms.uK.value = 1 - f.lunge; q.material.uniforms.uSeed.value = f.side * 7 + 3;
    q.visible = true;
  });
  
  const casts = [];
  for (const f of [B.ally, B.enemy]) if (f && f.bb && f.bb.root.visible) casts.push([f.x, f.y, (f.bb.extent() || { tall: 0.9 }).tall, f.z || 0, (f.bb.extent() || { half: 0.4 }).half]);
  if (G.player) casts.push([G.player.x, G.player.y, 1.5 * CHAR_SCALE, 0, 0.3]);
  let n = 0;
  for (const [x, y, tall, z, half] of casts.slice(0, BLOBS)) {
    const b = blobFor(Math.max(tall * 0.75, half * 1.6), z);
    fx.m.compose(new THREE.Vector3(x, W.groundAt(x, y) + 0.02, y), fx.q.identity(), new THREE.Vector3(b.r, 1, b.r * 0.85));
    fx.blobs.setMatrixAt(n, fx.m); fx.alpha.array[n] = b.alpha; n++;
  }
  fx.blobs.count = n; fx.blobs.visible = n > 0;
  fx.blobs.instanceMatrix.needsUpdate = true; fx.alpha.needsUpdate = true;
}
