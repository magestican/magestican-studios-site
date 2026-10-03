















import * as THREE from 'three';
import { S } from '../../state.js';
import { celUniforms, extra } from '../../art/look/celLook.js';
import { toUV, fromUV } from '../world/sections.js';

const D_ROWS = [-0.16, -0.08, 0, 0.09, 0.2, 0.4, 0.7, 1.0, 1.4, 2.0, 2.8, 3.8, 5.2, 7.0, 9.0]; 
const SEG = 128;
const PUFFS = 40;
const BANK_H = 3.2; 

const NOISE =  `
  float h2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;
const FLOOR_VERT =  `
  attribute float aD; attribute float aBack; varying float vD; varying float vBack; varying vec3 vW;
  void main(){ vD = aD; vBack = aBack; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FLOOR_FRAG = NOISE +  `
  uniform float uK, uT, uCelCell; uniform vec3 uGold, uPink, uInk, uLit, uMid, uShade;
  varying float vD; varying float vBack; varying vec3 vW;
  void main(){
    vec2 f = fract(gl_FragCoord.xy / uCelCell) - 0.5;
    // the ring: ink | gold | ink, then the pink glow band
    if (vD < 0.0) {
      if (vD < -0.13) discard;
      float g = (vD + 0.13) / 0.13; // 0 inside -> 1 at the edge
      if (uK < 0.999 && length(f) < (1.0 - uK) * 0.8) discard;
      gl_FragColor = vec4(g < 0.22 || g > 0.82 ? uInk : uGold, 1.0); return;
    }
    float pulse = 0.5 + 0.5 * sin(uT * 4.0);
    float glow = 1.0 - smoothstep(0.0, 0.2, vD);
    // the clouds: drifting fbm in world space, three flat tones, an ink line where they meet the ring side
    vec2 q = vW.xz * 0.42 + vec2(uT * 0.05, uT * 0.03);
    float n = fbm(q) + 0.35 * fbm(q * 2.7 - uT * 0.04) + vW.y * 0.12;
    float reach = smoothstep(0.18, 1.3, vD) * uK;                       // clouds begin past the glow
    float edge = n - (1.05 - reach * 0.95);                             // > 0: cloud
    if (edge < 0.0 && glow < 0.02) discard;
    vec3 c = n > 0.98 ? uLit : n > 0.74 ? uMid : uShade;
    float dots = step(length(f), 0.36 * smoothstep(0.98, 0.7, n));      // halftone in the shadows
    c = mix(c, uShade * 0.82, dots * 0.6);
    if (edge >= 0.0 && edge < 0.035) c = uInk;                          // the inked cloud edge
    float a = edge >= 0.0 ? 1.0 : 0.0;
    vec3 col = mix(uPink, c, a);
    float alpha = max(a, glow * (0.45 + 0.35 * pulse) * uK);
    gl_FragColor = vec4(col, alpha);
  }`;
const PUFF_VERT =  `
  attribute vec4 aPuff; varying vec2 vUv; varying vec4 vPuff;
  void main(){
    vUv = uv; vPuff = aPuff;
    vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);   // the puff's centre, camera space
    float s = length(instanceMatrix[0].xyz);
    c.xy += (uv - vec2(0.5, 0.0)) * vec2(s * 1.5, s);                       // a camera-facing quad, standing on its base
    gl_Position = projectionMatrix * c;
  }`;
const PUFF_FRAG =  `
  uniform float uK, uCelCell; uniform vec3 uInk, uLit, uMid, uShade;
  varying vec2 vUv; varying vec4 vPuff;
  float lobe(vec2 p, vec2 c, float r){ return r - length(p - c); }
  void main(){
    vec2 p = vec2((vUv.x - 0.5) * 1.5, vUv.y);                             // 1.5 : 1 box, base at y 0
    float s = vPuff.x;
    float d = max(max(lobe(p, vec2(-0.38, 0.34), 0.32 + 0.05 * s), lobe(p, vec2(0.0, 0.52), 0.44)),
                  max(lobe(p, vec2(0.4, 0.36), 0.3 + 0.06 * fract(s * 7.0)), lobe(p, vec2(0.12, 0.22), 0.36)));
    d = min(d, p.y - 0.02);                                                 // flat underside on the ground
    float k = vPuff.y * uK;                                                 // rolls in: grows from its base
    if (d < 0.0 || vUv.y > k * 1.05 + 0.02) discard;
    vec2 f = fract(gl_FragCoord.xy / uCelCell) - 0.5;
    vec3 c = p.y > 0.55 - 0.08 * sin(p.x * 6.0 + s * 9.0) ? uLit : p.y > 0.24 ? uMid : uShade;
    if (p.y < 0.3 && step(length(f), 0.3 * (0.3 - p.y) / 0.3) > 0.5) c = uShade * 0.82;
    if (d < 0.035) c = uInk;
    gl_FragColor = vec4(c, 1.0);
  }`;

const C = (h) => new THREE.Color(h);

const PAL = { gold: C('#ffe182'), pink: C('#ff7ac8'), ink: C('#1e1636'), lit: C('#e6dcff'), mid: C('#a597d6'), shade: C('#5e4f94') };

let A = null;
export function initBattleArena(stage) {
  if (A) return A;
  const geo = new THREE.BufferGeometry(), nv = D_ROWS.length * (SEG + 1);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  geo.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(nv), 1));
  geo.setAttribute('aBack', new THREE.BufferAttribute(new Float32Array(nv), 1));
  const idx = [];
  for (let r = 0; r < D_ROWS.length - 1; r++) for (let k = 0; k < SEG; k++) {
    const a = r * (SEG + 1) + k, b = a + SEG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  geo.setIndex(idx);
  const uK = { value: 0 }, uT = { value: 0 };
  const cols = { uGold: { value: PAL.gold }, uPink: { value: PAL.pink }, uInk: { value: PAL.ink }, uLit: { value: PAL.lit }, uMid: { value: PAL.mid }, uShade: { value: PAL.shade } };
  const floorMat = new THREE.ShaderMaterial({ uniforms: { uK, uT, uCelCell: celUniforms.uCelCell, ...cols }, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const floor = new THREE.Mesh(geo, floorMat); floor.name = 'battleArena'; floor.visible = false; floor.frustumCulled = false; floor.renderOrder = 1;
  const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0.5, 0.5, 0); 
  const puffAttr = new THREE.InstancedBufferAttribute(new Float32Array(PUFFS * 4), 4); quad.setAttribute('aPuff', puffAttr);
  const puffMat = new THREE.ShaderMaterial({ uniforms: { uK, uCelCell: celUniforms.uCelCell, uInk: cols.uInk, uLit: cols.uLit, uMid: cols.uMid, uShade: cols.uShade },
    vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG });
  const puffs = new THREE.InstancedMesh(quad, puffMat, PUFFS); puffs.count = 0; puffs.visible = false; puffs.frustumCulled = false; puffs.renderOrder = 2;
  stage.scene.add(floor, puffs);
  extra.push(floorMat, puffs); 
  A = { floor, puffs, puffAttr, uK, uT, built: null, k: 0, m: new THREE.Matrix4() };
  return A;
}


function build(B) {
  const W = S.W, [cu, cv] = toUV(B.cx, B.cy), pos = A.floor.geometry.attributes.position.array;
  const aD = A.floor.geometry.attributes.aD.array, aBack = A.floor.geometry.attributes.aBack.array;
  
  
  const cs = S.stage.toScreen(B.cx, B.cy, 0)[1], ry = Math.max(1, Math.abs(S.stage.toScreen(...fromUV(cu, cv - B.rv), 0)[1] - cs), Math.abs(S.stage.toScreen(...fromUV(cu + B.ru, cv), 0)[1] - cs));
  const backOf = (a) => { const [x, y] = fromUV(cu + Math.cos(a) * B.ru, cv + Math.sin(a) * B.rv); return Math.max(0, Math.min(1, (cs - S.stage.toScreen(x, y, 0)[1]) / ry)); };
  const backs = []; for (let k = 0; k <= SEG; k++) backs.push(backOf(k / SEG * Math.PI * 2));
  let i = 0;
  for (const d of D_ROWS) for (let k = 0; k <= SEG; k++, i++) {
    const a = k / SEG * Math.PI * 2, [x, y] = fromUV(cu + Math.cos(a) * (B.ru + d), cv + Math.sin(a) * (B.rv + d));
    
    
    const back = backs[k], rise = d > 0.4 ? 0.6 * Math.min(1, (d - 0.4) / 1.2) + BANK_H * back * back * Math.min(1, (d - 0.4) / 3.2) : 0;
    pos[i * 3] = x; pos[i * 3 + 1] = W.groundAt(x, y) + 0.04 + rise; pos[i * 3 + 2] = y; aD[i] = d; aBack[i] = back;
  }
  const g = A.floor.geometry; g.attributes.position.needsUpdate = g.attributes.aD.needsUpdate = g.attributes.aBack.needsUpdate = true;
  
  const per = 2 * Math.PI * Math.sqrt((B.ru * B.ru + B.rv * B.rv) / 2), n = Math.min(PUFFS, Math.round(per / 1.5));
  let c = 0;
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) / n * Math.PI * 2, back = backOf(a);
    if (back < 0.12) continue;
    const seed = Math.abs(Math.sin(k * 12.9898 + B.cx * 0.1)) % 1, out = 1.0 + 0.7 * seed;
    const [x, y] = fromUV(cu + Math.cos(a) * (B.ru + out), cv + Math.sin(a) * (B.rv + out));
    const s = (0.9 + 1.6 * back) * (0.85 + 0.3 * seed);
    A.m.makeScale(s, s, s).setPosition(x, W.groundAt(x, y) - 0.1, y);
    A.puffs.setMatrixAt(c, A.m);
    A.puffAttr.array.set([seed, 0.6 + 0.4 * back, 0, 0], c * 4); c++;
  }
  A.puffs.count = c; A.puffs.instanceMatrix.needsUpdate = true; A.puffAttr.needsUpdate = true;
  A.built = { B, cx: B.cx, cy: B.cy, ru: B.ru, rv: B.rv };
}


export function updateBattleArena(B, dt) {
  if (!A) return;
  if (!B) { A.floor.visible = A.puffs.visible = false; A.built = null; A.k = 0; return; }
  const b = A.built;
  if (!b || b.B !== B || b.cx !== B.cx || b.cy !== B.cy || b.ru !== B.ru || b.rv !== B.rv) { build(B); A.k = 0; }
  A.k = Math.min(1, A.k + dt / 0.7);
  A.uK.value = 1 - (1 - A.k) * (1 - A.k); A.uT.value += dt;
  A.floor.visible = true; A.puffs.visible = A.puffs.count > 0;
}
