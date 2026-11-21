




import * as THREE from 'three';
import { POINT_CAP, STREAK_CAP, createFxCore } from './fxcore.js';

const ADD = { blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
  transparent: true, depthWrite: false, depthTest: false, toneMapped: false };

const POINT_VS = `
  attribute vec4 aColor; attribute float aSize; uniform float uScale; varying vec4 vColor;
  void main() { vColor = aColor; gl_PointSize = aSize * uScale; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const POINT_FS = `
  varying vec4 vColor;
  void main() {
    vec2 q = gl_PointCoord - 0.5; float d2 = dot(q, q) * 4.0;
    if (d2 > 1.0) discard;
    float halo = exp(-d2 * 3.5), core = exp(-d2 * 26.0);
    vec3 c = vColor.rgb * (halo * 0.9 + core * 0.8) + vec3(core * 0.55);
    gl_FragColor = vec4(c, vColor.a * (halo + core * 0.5));
  }`;


const LAMP_FS = `
  varying vec4 vColor;
  void main() {
    vec2 q = gl_PointCoord - 0.5; float d2 = dot(q, q) * 4.0;
    if (d2 > 1.0) discard;
    float halo = exp(-d2 * 1.6) * (1.0 - d2), core = exp(-d2 * 14.0);
    vec3 c = vColor.rgb * (halo * 0.85 + core) + vec3(core * 0.7);
    gl_FragColor = vec4(c, min(1.0, vColor.a * (halo + core)));
  }`;
const LINE_VS = `
  attribute vec4 aColor; varying vec4 vColor;
  void main() { vColor = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LINE_FS = `varying vec4 vColor; void main() { gl_FragColor = vColor; }`;

function pointsMesh(cap, order, fs = POINT_FS, extra = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cap * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(cap), 1).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ ...ADD, ...extra, uniforms: { uScale: { value: 1 } }, vertexShader: POINT_VS, fragmentShader: fs }));
  m.frustumCulled = false; m.renderOrder = order;
  return m;
}



const AURA_FS = `
  uniform vec3 uColor; uniform float uTime; uniform float uPulse; varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0; float r = length(q); float a = atan(q.y, q.x);
    float rim = smoothstep(0.62, 0.86, r) * (1.0 - smoothstep(0.86, 1.0, r));
    float arcs = 0.55 + 0.45 * sin(a * 6.0 + uTime * 2.4) * sin(a * 3.0 - uTime * 1.3);
    float inner = (1.0 - smoothstep(0.0, 0.8, r)) * 0.16;
    float k = rim * (0.55 + 0.45 * arcs) * (0.7 + uPulse) + inner * (0.6 + uPulse);
    vec3 c = uColor * k + vec3(rim * uPulse * 0.6);
    gl_FragColor = vec4(c, k);
  }`;
const AURA_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
export const AURA_R = 34;
const EMBER_C = new THREE.Color(1.0, 0.72, 0.22), IRIS_C = new THREE.Color(0.62, 0.42, 1.0);

export function makeAura() {
  const mat = new THREE.ShaderMaterial({ ...ADD,
    uniforms: { uColor: { value: EMBER_C.clone() }, uTime: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: AURA_VS, fragmentShader: AURA_FS });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(AURA_R * 2, AURA_R * 2).rotateX(-Math.PI / 2), mat);
  mesh.position.y = 55; mesh.renderOrder = 28;
  return mesh;
}

export function stepAura(mesh, pol, dt, t) {
  const u = mesh.material.uniforms;
  u.uColor.value.lerp(pol ? IRIS_C : EMBER_C, Math.min(1, dt * 14));
  u.uTime.value = t;
  u.uPulse.value = Math.max(0, u.uPulse.value - dt * 2.5);
}
export const pulseAura = (mesh, amount) => { const u = mesh.material.uniforms.uPulse; u.value = Math.min(1.2, u.value + amount); };

export function createFx(scene) {
  const core = createFxCore((Date.now() & 0xffff) + 1);
  const pts = pointsMesh(POINT_CAP, 26);
  const glow = pointsMesh(2048, 9); 
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STREAK_CAP * 6), 3).setUsage(THREE.DynamicDrawUsage));
  lg.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(STREAK_CAP * 8), 4).setUsage(THREE.DynamicDrawUsage));
  lg.setDrawRange(0, 0);
  const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({ ...ADD, vertexShader: LINE_VS, fragmentShader: LINE_FS }));
  lines.frustumCulled = false; lines.renderOrder = 27;
  
  const heads = pointsMesh(STREAK_CAP, 27);
  scene.add(glow, pts, lines, heads);

  function setScale(pxPerUnit) {
    for (const m of [pts, glow, heads]) m.material.uniforms.uScale.value = pxPerUnit;
  }

  function upload() {
    const P = core.pts, pa = pts.geometry.attributes;
    for (let i = 0; i < P.n; i++) {
      const [size, r, g, b, a] = core.look(P, i);
      pa.position.setXYZ(i, P.x[i], 75, P.z[i]);
      pa.aColor.setXYZW(i, r, g, b, a);
      pa.aSize.setX(i, size);
    }
    pts.geometry.setDrawRange(0, P.n);
    pa.position.needsUpdate = pa.aColor.needsUpdate = pa.aSize.needsUpdate = true;

    const S = core.str, la = lg.attributes, ha = heads.geometry.attributes;
    for (let i = 0; i < S.n; i++) {
      const [size, r, g, b, a] = core.look(S, i);
      const tx = S.x[i] - S.vx[i] * S.len[i], tz = S.z[i] - S.vz[i] * S.len[i];
      la.position.setXYZ(i * 2, S.x[i], 76, S.z[i]);
      la.position.setXYZ(i * 2 + 1, tx, 76, tz);
      la.aColor.setXYZW(i * 2, r, g, b, a);
      la.aColor.setXYZW(i * 2 + 1, r, g, b, 0);
      ha.position.setXYZ(i, S.x[i], 76, S.z[i]);
      ha.aColor.setXYZW(i, r, g, b, a);
      ha.aSize.setX(i, size * 3);
    }
    lg.setDrawRange(0, S.n * 2);
    heads.geometry.setDrawRange(0, S.n);
    la.position.needsUpdate = la.aColor.needsUpdate = true;
    ha.position.needsUpdate = ha.aColor.needsUpdate = ha.aSize.needsUpdate = true;
  }

  
  let gn = 0;
  const ga = glow.geometry.attributes;
  function glowBegin() { gn = 0; }
  function glowAdd(x, z, pol, size) {
    if (gn >= 2048) return;
    ga.position.setXYZ(gn, x, 68, z);
    if (pol) ga.aColor.setXYZW(gn, 0.62, 0.42, 1.0, 0.55); else ga.aColor.setXYZW(gn, 1.0, 0.7, 0.2, 0.55);
    ga.aSize.setX(gn, size);
    gn++;
  }
  function glowEnd() {
    glow.geometry.setDrawRange(0, gn);
    ga.position.needsUpdate = ga.aColor.needsUpdate = ga.aSize.needsUpdate = true;
  }

  
  
  
  
  
  const lights = pointsMesh(512, 8, LAMP_FS, { depthTest: true });
  scene.add(lights);
  const la2 = lights.geometry.attributes;
  let ln = 0;
  function lightsBegin() { ln = 0; }
  function lightAdd(x, z, pol, size, a) {
    if (ln >= 512) return;
    la2.position.setXYZ(ln, x, 2, z);
    if (pol) la2.aColor.setXYZW(ln, 0.62, 0.42, 1.0, a); else la2.aColor.setXYZW(ln, 1.0, 0.62, 0.18, a);
    la2.aSize.setX(ln, size);
    ln++;
  }
  function lightsEnd() {
    lights.geometry.setDrawRange(0, ln);
    la2.position.needsUpdate = la2.aColor.needsUpdate = la2.aSize.needsUpdate = true;
  }
  const setScaleAll = (v) => { setScale(v); lights.material.uniforms.uScale.value = v; };

  function step(dt) { core.step(dt); upload(); }

  return { core, setScale: setScaleAll, step, glowBegin, glowAdd, glowEnd, lightsBegin, lightAdd, lightsEnd,
    explode: core.explode, absorb: core.absorb, flip: core.flip, wake: core.wake, hit: core.hit, chain: core.chain, bomb: core.bomb, cancel: core.cancel, hull: core.hull, hitstop: core.hitstop,
    shakeOffset: core.shakeOffset };
}
