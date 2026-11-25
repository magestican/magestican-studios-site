








import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { W, H, DIRS } from './sim.js';
import { unwrapEel, wrapCoord, edgeFade } from './eelPath.js';
import * as Cube from './cube.js';
import { cubeChain, chainAt, sampleCubeEel } from './cubePath.js';
import { turnAngle, preCrossU, residualAngle, ROLL_CELLS, LEAN_DEG, LEAN_CELLS } from './cubeTurn.js';

const MAX_LIGHTS = 48;
const MAX_RIPPLES = 8;
const MAX_BODY = 1200;
const MAX_PARTICLES = 1800;
const SUB = 4; 

const EEL_HEAD = new THREE.Color(0x9dfff0);
const EEL_TAIL = new THREE.Color(0x2a5cff);

const cellX = (x) => x - (W - 1) / 2;
const cellZ = (y) => y - (H - 1) / 2;
const col = (hex) => new THREE.Color(hex);


const floorVert = `
  varying vec2 vPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPos = wp.xz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const floorFrag = `
  uniform float uTime, uDark, uWrap, uAmbient;
  uniform vec3 uWater, uDeep, uGlow;
  uniform vec2 uHalf;
  uniform vec3 uLights[${MAX_LIGHTS}];
  uniform int uLightCount;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  varying vec2 vPos;
  float caustic(vec2 p, float t) {
    float c = 0.0;
    vec2 q = p * 0.55;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      q += vec2(sin(q.y * 1.7 + t * 0.6 + fi), cos(q.x * 1.3 - t * 0.5 + fi * 1.7)) * 0.45;
      c += abs(sin(q.x + q.y + t * 0.3));
    }
    return pow(1.0 - c / 3.0, 3.0);
  }
  void main() {
    vec2 p = vPos;
    vec2 inner = uHalf - abs(p);
    float inside = step(0.0, min(inner.x, inner.y));
    // ripples: rings that travel out from events and brighten the grid lines they cross
    float ring = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      if (age < 0.0 || age > 2.0) continue;
      float d = distance(p, r.xy);
      float front = age * 7.0;
      ring += r.w * exp(-pow((d - front) * 1.6, 2.0)) * (1.0 - age / 2.0);
    }
    vec2 g = abs(fract(p + 0.5) - 0.5);
    float gridLine = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
    float tileShade = 0.88 + 0.12 * smoothstep(0.5, 0.15, max(g.x, g.y));
    float c = caustic(p, uTime);
    vec3 base = mix(uDeep, uWater, 0.35 + 0.65 * c) * tileShade;
    base += uGlow * gridLine * (0.07 + ring * 0.9);
    // the eel's own light (always on; it matters most where the sea is dark)
    float lit = 0.0;
    for (int i = 0; i < ${MAX_LIGHTS}; i++) {
      if (i >= uLightCount) break;
      vec3 L = uLights[i];
      float d2 = dot(p - L.xy, p - L.xy);
      lit += L.z * exp(-d2 / mix(5.5, 2.6, uDark));
    }
    lit = min(lit, 1.2);
    float ambient = mix(1.0, uAmbient, uDark);
    vec3 colr = base * (ambient + lit * mix(0.35, 1.25, uDark)) + uGlow * lit * 0.08;
    // border: a lit rail for walls, a moving current for wrap edges
    float edge = min(inner.x, inner.y);
    float rail = exp(-abs(edge) * 16.0) * 0.55;
    float current = 0.5 + 0.5 * sin((p.x + p.y) * 2.0 - uTime * 4.0);
    vec3 railColor = mix(uGlow * 1.6, uGlow * (0.6 + 1.2 * current), uWrap);
    colr = mix(colr * 0.25, colr, inside) + railColor * rail * (0.6 + 0.4 * (1.0 - uDark * 0.5));
    // fade the floor out past the board so the scene ends in deep water, not a hard edge
    float outside = max(-inner.x, -inner.y);
    colr = mix(colr, uDeep * 0.45, smoothstep(0.0, 4.0, outside));
    gl_FragColor = vec4(colr, 1.0);
  }`;






const cubeVert = `
  varying vec3 vP;
  varying vec3 vN;
  void main() {
    vP = position; vN = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const cubeFrag = `
  uniform float uTime, uDark, uAmbient, uHalf;
  uniform vec3 uWater, uDeep, uGlow;
  uniform vec3 uTint[6];
  uniform vec4 uLights[${MAX_LIGHTS}];
  uniform int uLightCount;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  uniform float uRippleS[${MAX_RIPPLES}];
  varying vec3 vP;
  varying vec3 vN;
  float caustic(vec2 p, float t) {
    float c = 0.0;
    vec2 q = p * 0.55;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      q += vec2(sin(q.y * 1.7 + t * 0.6 + fi), cos(q.x * 1.3 - t * 0.5 + fi * 1.7)) * 0.45;
      c += abs(sin(q.x + q.y + t * 0.3));
    }
    return pow(1.0 - c / 3.0, 3.0);
  }
  void main() {
    vec3 an = abs(vN);
    vec2 p; int f;
    if (an.x > 0.5) { p = vP.yz; f = vN.x > 0.0 ? 0 : 1; }
    else if (an.y > 0.5) { p = vP.xz; f = vN.y > 0.0 ? 2 : 3; }
    else { p = vP.xy; f = vN.z > 0.0 ? 4 : 5; }
    vec3 tint = uTint[0];
    for (int i = 1; i < 6; i++) if (i == f) tint = uTint[i];
    float ring = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      float s = uRippleS[i];
      if (s <= 0.0) continue;
      float age = uTime - r.w;
      if (age < 0.0 || age > 2.0) continue;
      float d = distance(vP, r.xyz);
      ring += s * exp(-pow((d - age * 7.0) * 1.6, 2.0)) * (1.0 - age / 2.0);
    }
    vec2 g = abs(fract(p + 0.5) - 0.5);
    float gridLine = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
    float tileShade = 0.88 + 0.12 * smoothstep(0.5, 0.15, max(g.x, g.y));
    float c = caustic(p + float(f) * 7.3, uTime);
    vec3 base = mix(uDeep, uWater * tint, 0.35 + 0.65 * c) * tileShade;
    base += uGlow * gridLine * (0.07 + ring * 0.9);
    float lit = 0.0;
    for (int i = 0; i < ${MAX_LIGHTS}; i++) {
      if (i >= uLightCount) break;
      vec4 L = uLights[i];
      vec3 dv = vP - L.xyz;
      lit += L.w * exp(-dot(dv, dv) / mix(5.5, 2.6, uDark));
    }
    lit = min(lit, 1.2);
    float ambient = mix(1.0, uAmbient, uDark);
    vec3 colr = base * (ambient + lit * mix(0.35, 1.25, uDark)) + uGlow * lit * 0.08;
    float edge = uHalf - max(abs(p.x), abs(p.y));
    colr += uGlow * tint * exp(-edge * 9.0) * 0.32;
    gl_FragColor = vec4(colr, 1.0);
  }`;

const CUBE_TINTS = [[1.15, 0.8, 0.7], [0.75, 0.85, 1.25], [1.2, 1.05, 0.65], [0.8, 1.15, 0.9], [1.15, 0.75, 1.15], [1, 1, 1]];
export const CUBE_LEAN_DEG = LEAN_DEG; 
export const CUBE_LEAN_CELLS = LEAN_CELLS;
export const CUBE_ROLL_TICKS = ROLL_CELLS; 
export const CUBE_WINDOW = 1.5; 
export const CUBE_VIEW_CELLS = 13; 
export const CUBE_AHEAD = 0.75; 
export const CUBE_FADE_S = 0.15; 


const partVert = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uScale;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    vColor = aColor; vAlpha = aAlpha;
    gl_Position = projectionMatrix * mv;
  }`;
const partFrag = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(d));
    if (a * vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
  }`;

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: 1 }, uFlash: { value: 0 }, uFade: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uFlash; uniform float uFade; uniform vec3 uFlashColor; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += uFlashColor * uFlash;
      c.rgb *= 1.0 - uFade; // G10: reduced-motion cube roll = a 150 ms fade through dark
      c.rgb = ACESFilmicToneMapping(c.rgb);
      float d = distance(vUv, vec2(0.5)) * 1.41421;
      c.rgb *= 1.0 - 0.38 * smoothstep(0.45, 1.05, d);
      gl_FragColor = sRGBTransferOETF(c);
    }`,
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createRenderer(canvas, { search = '' } = {}) {
  const params = new URLSearchParams(search);
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.035);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  
  
  const world = new THREE.Group();
  scene.add(world);

  scene.add(new THREE.HemisphereLight(0x9fdfff, 0x05101a, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-6, 14, -4);
  scene.add(sun);

  
  const pal = { water: col(0x0a6f8f), deep: col(0x02283a), glow: col(0x7ff6ff), mote: col(0xffd35a), shoal: col(0x7dffcf) };
  const palTarget = { water: col(0), deep: col(0), glow: col(0), mote: col(0), shoal: col(0) };
  let dark = 0, darkTarget = 0;

  
  const lights = Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3());
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0));
  let rippleNext = 0;
  const floorMat = new THREE.ShaderMaterial({
    vertexShader: floorVert, fragmentShader: floorFrag,
    uniforms: {
      uTime: { value: 0 }, uDark: { value: 0 }, uWrap: { value: 0 }, uAmbient: { value: 0.06 },
      uWater: { value: pal.water }, uDeep: { value: pal.deep }, uGlow: { value: pal.glow },
      uHalf: { value: new THREE.Vector2(W / 2, H / 2) },
      uLights: { value: lights }, uLightCount: { value: 0 }, uRipples: { value: ripples },
    },
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.25, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 1 });
  bodyMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;',
      'vec3 totalEmissiveRadiance = emissive * vColor;');
  };
  const body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 18, 12), bodyMat, MAX_BODY);
  body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  body.setColorAt(0, new THREE.Color());
  body.count = 0;
  body.frustumCulled = false;
  world.add(body);

  
  const head = new THREE.Group();
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 2.2 }));
  headMesh.scale.set(0.82, 0.62, 1.05);
  head.add(headMesh);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x02060a });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), eyeMat);
    eye.position.set(0.22 * s, 0.2, 0.25);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 6), pupilMat);
    pupil.position.set(0.24 * s, 0.24, 0.33);
    head.add(eye, pupil);
  }
  world.add(head);
  let headYaw = 0;

  
  
  const GHOST_CELLS = 8;
  const paceMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const pace = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 12, 8), paceMat, GHOST_CELLS);
  pace.count = 0;
  pace.frustumCulled = false;
  world.add(pace);
  const paceM = new THREE.Matrix4();
  function drawPace(cells, t) {
    if (!cells) { pace.count = 0; return; }
    pace.count = Math.min(GHOST_CELLS, cells.length);
    for (let i = 0; i < pace.count; i++) {
      const s = 1 - i / (pace.count + 1);
      paceM.makeScale(s, s * 0.7, s).setPosition(cellX(cells[i].x), 0.32, cellZ(cells[i].y));
      pace.setMatrixAt(i, paceM);
    }
    pace.instanceMatrix.needsUpdate = true;
    paceMat.opacity = 0.18 + 0.06 * Math.sin(t * 3);
  }

  
  const glowTex = glowTexture();
  const moteGeo = new THREE.IcosahedronGeometry(0.2, 1);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, 64);
  motes.setColorAt(0, new THREE.Color());
  motes.count = 0;
  motes.frustumCulled = false;
  world.add(motes);
  const halos = [];
  for (let i = 0; i < 64; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.visible = false;
    world.add(s);
    halos.push(s);
  }

  
  const jellies = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x331133, emissive: 0xff5fc8, emissiveIntensity: 1.6, transparent: true, opacity: 0.85, roughness: 0.1, side: THREE.DoubleSide }));
    dome.position.y = 0.35;
    g.add(dome);
    const tentMat = new THREE.LineBasicMaterial({ color: 0xff9ae0, transparent: true, opacity: 0.8 });
    const tents = [];
    for (let k = 0; k < 6; k++) {
      const pts = Array.from({ length: 8 }, () => new THREE.Vector3());
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, tentMat);
      g.add(line);
      tents.push({ line, a: (k / 6) * Math.PI * 2 });
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff5fc8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
    halo.scale.set(2.4, 2.4, 1);
    halo.position.y = 0.4;
    g.add(halo);
    g.visible = false;
    world.add(g);
    jellies.push({ g, dome, tents, pos: new THREE.Vector3(), seen: false });
  }

  
  const tileMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.94, 0.94).rotateX(-Math.PI / 2), tileMat, Math.max(W * H, Cube.CELLS));
  tiles.count = 0;
  tiles.frustumCulled = false;
  world.add(tiles);
  let tileT = 0;

  
  const cubeLights = Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4());
  const cubeRipples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 0, -99));
  const cubeRippleS = new Array(MAX_RIPPLES).fill(0);
  let cubeRippleNext = 0;
  const cubeMat = new THREE.ShaderMaterial({
    vertexShader: cubeVert, fragmentShader: cubeFrag,
    uniforms: {
      
      uTime: floorMat.uniforms.uTime, uDark: floorMat.uniforms.uDark, uAmbient: floorMat.uniforms.uAmbient,
      uWater: floorMat.uniforms.uWater, uDeep: floorMat.uniforms.uDeep, uGlow: floorMat.uniforms.uGlow,
      uHalf: { value: Cube.N / 2 },
      uTint: { value: CUBE_TINTS.map(([r, g, b]) => new THREE.Vector3(r, g, b)) },
      uLights: { value: cubeLights }, uLightCount: { value: 0 },
      uRipples: { value: cubeRipples }, uRippleS: { value: cubeRippleS },
    },
  });
  const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(Cube.N, Cube.N, Cube.N), cubeMat);
  cubeMesh.visible = false;
  world.add(cubeMesh);
  
  
  
  
  const landmarkGroup = new THREE.Group();
  landmarkGroup.visible = false;
  world.add(landmarkGroup);
  const LANDMARK_CELLS = 1.15; 
  const LANDMARK_DIM = 0.55; 
  let landmarksAsked = false;
  function loadLandmarks() {
    if (landmarksAsked) return;
    landmarksAsked = true;
    const loader = new GLTFLoader();
    const cells = Cube.landmarkCells();
    Cube.LANDMARKS.forEach((name, f) => {
      const url = new URL(`../assets/landmarks/${name}/${name}.glb`, import.meta.url).href;
      loader.load(url, (gltf) => {
        const m = gltf.scene;
        const box = new THREE.Box3().setFromObject(m);
        const size = box.getSize(new THREE.Vector3());
        const k = LANDMARK_CELLS / Math.max(size.x, size.z, 1e-3);
        m.scale.setScalar(k);
        m.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
        const tint = new THREE.Color(...CUBE_TINTS[f]).multiplyScalar(LANDMARK_DIM);
        m.traverse((o) => {
          if (!o.isMesh) return;
          o.material = o.material.clone();
          if (o.material.color) o.material.color.multiply(tint);
          if (o.material.emissive) o.material.emissive.setScalar(0);
          o.material.depthWrite = false;
          o.renderOrder = -1;
        });
        const holder = new THREE.Group();
        holder.add(m);
        cubeLocal(cells[f], 0, holder.position);
        faceQuat(cells[f], holder.quaternion);
        landmarkGroup.add(holder);
      }, undefined, () => {  });
    });
  }
  
  const cues = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.visible = false;
    world.add(s);
    cues.push(s);
  }
  const cubePos = new Float32Array(MAX_BODY * 3), cubeNor = new Float32Array(MAX_BODY * 3);
  const UP = new THREE.Vector3(0, 1, 0);
  const tmpN = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpW = new THREE.Vector3();
  const v3 = (v, out = new THREE.Vector3()) => out.set(v.x, v.y, v.z);
  
  function cubeLocal(c, lift, out = new THREE.Vector3()) {
    const p = Cube.surfacePoint(c), n = Cube.normalOf(c);
    return out.set(p.x + n.x * lift, p.y + n.y * lift, p.z + n.z * lift);
  }
  const faceQuat = (c, out) => out.setFromUnitVectors(UP, v3(Cube.normalOf(c), tmpN));
  
  const VIEW_BASIS = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0)));
  const SCREEN_WORLD = { up: new THREE.Vector3(0, 0, -1), down: new THREE.Vector3(0, 0, 1), left: new THREE.Vector3(-1, 0, 0), right: new THREE.Vector3(1, 0, 0) };
  const tmpMat = new THREE.Matrix4(), tmpQa = new THREE.Quaternion(), tmpQl = new THREE.Quaternion();
  
  function frameQuat(frame, out) {
    tmpMat.makeBasis(v3(frame.R), v3(frame.U), v3(frame.F));
    tmpQa.setFromRotationMatrix(tmpMat).invert();
    return out.copy(VIEW_BASIS).multiply(tmpQa);
  }
  const cubeCam = {
    on: false, key: '', target: new THREE.Quaternion(), display: new THREE.Quaternion(), from: new THREE.Quaternion(),
    rolls: [], lastHead: null, fresh: true, prevTarget: new THREE.Quaternion(), desired: new THREE.Quaternion(),
    fadeT: -1, swap: false, follow: new THREE.Vector3(), look: new THREE.Vector3(),
    headQ: new THREE.Quaternion(), headSet: false,
  };
  const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cubeState = { active: false };
  function cubeRipple(local, strength) {
    cubeRipples[cubeRippleNext].set(local.x, local.y, local.z, floorMat.uniforms.uTime.value);
    cubeRippleS[cubeRippleNext] = strength;
    cubeRippleNext = (cubeRippleNext + 1) % MAX_RIPPLES;
  }

  
  const pPos = new Float32Array(MAX_PARTICLES * 3);
  const pCol = new Float32Array(MAX_PARTICLES * 3);
  const pSize = new Float32Array(MAX_PARTICLES);
  const pAlpha = new Float32Array(MAX_PARTICLES);
  const pVel = new Float32Array(MAX_PARTICLES * 3);
  const pLife = new Float32Array(MAX_PARTICLES);
  const pMax = new Float32Array(MAX_PARTICLES);
  const AMBIENT = 260;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pAlpha, 1).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.ShaderMaterial({ vertexShader: partVert, fragmentShader: partFrag, uniforms: { uScale: { value: 300 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);
  let pNext = AMBIENT;
  for (let i = 0; i < AMBIENT; i++) resetAmbient(i, true);

  function resetAmbient(i, anywhere) {
    const bubble = i % 5 === 0;
    pPos[i * 3] = (Math.random() - 0.5) * (W + 10);
    pPos[i * 3 + 1] = anywhere ? Math.random() * 12 : 0;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * (H + 10);
    pVel[i * 3] = (Math.random() - 0.5) * 0.1;
    pVel[i * 3 + 1] = bubble ? 0.9 + Math.random() * 0.8 : 0.08 + Math.random() * 0.12;
    pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    pSize[i] = bubble ? 9 + Math.random() * 8 : 3 + Math.random() * 4;
    pLife[i] = 1; pMax[i] = bubble ? 1 : 0;
    const c = bubble ? 0.55 : 0.35;
    pCol[i * 3] = c; pCol[i * 3 + 1] = c * 1.15; pCol[i * 3 + 2] = c * 1.3;
  }

  function burst(x, z, color, n, { speed = 3, up = 2.5, size = 14, life = 0.9, y = 0.4 } = {}) {
    const c = color instanceof THREE.Color ? color : col(color);
    for (let k = 0; k < n; k++) {
      const i = pNext;
      pNext = pNext + 1 >= MAX_PARTICLES ? AMBIENT : pNext + 1;
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.9);
      pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
      pVel[i * 3] = Math.cos(a) * s; pVel[i * 3 + 1] = up * (0.4 + Math.random()); pVel[i * 3 + 2] = Math.sin(a) * s;
      const hdr = 2.2 + Math.random() * 1.5;
      pCol[i * 3] = c.r * hdr; pCol[i * 3 + 1] = c.g * hdr; pCol[i * 3 + 2] = c.b * hdr;
      pSize[i] = size * (0.5 + Math.random());
      pMax[i] = life * (0.6 + Math.random() * 0.6);
      pLife[i] = pMax[i];
    }
  }

  function updateParticles(dt, ambientDim) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < AMBIENT) {
        pPos[i * 3] += pVel[i * 3] * dt;
        pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
        pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        if (pPos[i * 3 + 1] > 12) resetAmbient(i, false);
        pAlpha[i] = (pMax[i] ? 0.55 : 0.4) * ambientDim;
        continue;
      }
      if (pLife[i] <= 0) { pAlpha[i] = 0; continue; }
      pLife[i] -= dt;
      pVel[i * 3] *= 1 - 2.2 * dt; pVel[i * 3 + 2] *= 1 - 2.2 * dt;
      pVel[i * 3 + 1] = pVel[i * 3 + 1] * (1 - 1.5 * dt) + 0.4 * dt;
      pPos[i * 3] += pVel[i * 3] * dt;
      pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
      pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      pAlpha[i] = Math.max(0, pLife[i] / pMax[i]);
    }
    for (const a of ['position', 'aColor', 'aSize', 'aAlpha']) pGeo.attributes[a].needsUpdate = true;
  }

  
  const shafts = [];
  const shaftMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0x9fe8ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 26), shaftMat.clone());
    m.position.set(-8 + i * 2.8, 9, -3 + (i % 3) * 2);
    m.rotation.z = 0.35;
    m.rotation.y = 0.2 * (i % 2 ? 1 : -1);
    scene.add(m);
    shafts.push(m);
  }

  
  let composer = null, bloom = null, grade = null;
  const wantBloom = params.get('post') !== '0';
  function buildPost() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.85, 0.5, 0.78);
    composer.addPass(bloom);
    grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
  }
  if (wantBloom) buildPost();

  
  const camTarget = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let shake = 0, flash = 0, flashColor = new THREE.Color(1, 1, 1);
  let baseDist = 24, cubeDist = 40;
  let descendT = -1;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const needH = H + 4.2, needW = W + 1.2;
    const distH = (needH / 2) / Math.tan(vfov / 2);
    const distW = (needW / 2) / (Math.tan(vfov / 2) * camera.aspect);
    baseDist = Math.max(distH, distW) * 1.02;
    
    const cubeH = ((CUBE_VIEW_CELLS + 5) / 2) / Math.tan(vfov / 2); 
    const cubeW = (CUBE_VIEW_CELLS / 2) / (Math.tan(vfov / 2) * camera.aspect);
    cubeDist = Math.max(cubeH, cubeW);
    pMat.uniforms.uScale.value = h * renderer.getPixelRatio() * 0.045;
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
  }

  function setDepth(depth, instant = false) {
    for (const k of Object.keys(palTarget)) palTarget[k].setHex(depth.palette[k]);
    darkTarget = depth.dark;
    floorMat.uniforms.uWrap.value = depth.edges === 'wrap' ? 1 : 0;
    if (instant) {
      for (const k of Object.keys(pal)) pal[k].copy(palTarget[k]);
      dark = darkTarget;
    }
  }

  function addRipple(x, z, strength) {
    ripples[rippleNext].set(x, z, floorMat.uniforms.uTime.value, strength);
    rippleNext = (rippleNext + 1) % MAX_RIPPLES;
  }

  
  
  
  const onCube = (state) => state.depth.edges === 'cube';
  function boom(state, c, color, n, opts = {}) {
    if (!onCube(state)) { burst(cellX(c.x), cellZ(c.y), color, n, opts); return; }
    world.updateMatrixWorld();
    const p = world.localToWorld(cubeLocal(c, opts.y ?? 0.4, tmpW));
    burst(p.x, p.z, color, n, { ...opts, y: p.y });
  }
  function ring(state, c, strength) {
    if (!onCube(state)) addRipple(cellX(c.x), cellZ(c.y), strength);
    else cubeRipple(cubeLocal(c, 0, tmpW), strength);
  }

  function onEvents(events, state) {
    for (const e of events) {
      if (e.type === 'bite') {
        const c = e.kind === 'shoal' ? pal.shoal : pal.mote;
        boom(state, e, c, 26, { speed: 2.6, size: 12 });
        ring(state, e, 0.8);
        shake = Math.max(shake, 0.12);
        pulse = 1;
      } else if (e.type === 'encircle') {
        tiles.count = e.cells.length;
        const m = new THREE.Matrix4();
        if (onCube(state)) {
          e.cells.forEach((c, i) => { m.compose(cubeLocal(c, 0.03, tmpP), faceQuat(c, tmpQ), tmpS.setScalar(1)); tiles.setMatrixAt(i, m); });
        } else {
          e.cells.forEach((c, i) => { m.makeTranslation(cellX(c.x), 0.03, cellZ(c.y)); tiles.setMatrixAt(i, m); });
        }
        tiles.instanceMatrix.needsUpdate = true;
        tileMat.color.copy(pal.shoal).multiplyScalar(1.4);
        tileT = 1;
        for (const mo of e.motes) boom(state, mo, pal.shoal, 46, { speed: 4.5, up: 4, size: 18, life: 1.3 });
        if (onCube(state)) {
          ring(state, e.cells[Math.floor(e.cells.length / 2)], 2.2);
        } else {
          const cx = e.cells.reduce((a, c) => a + c.x, 0) / e.cells.length, cz = e.cells.reduce((a, c) => a + c.y, 0) / e.cells.length;
          addRipple(cellX(cx), cellZ(cz), 2.2);
        }
        shake = Math.max(shake, 0.45);
        flash = 0.5; flashColor.copy(pal.shoal);
        pulse = 1.6;
      } else if (e.type === 'death') {
        for (let i = 0; i < state.snake.length; i += 1) {
          boom(state, state.snake[i], pal.glow, 10, { speed: 3, up: 3, size: 14, life: 1.6 });
        }
        ring(state, state.snake[0], 2.5);
        shake = 0.9; flash = 0.6; flashColor.set(1, 0.25, 0.2);
        dying = 1;
      } else if (e.type === 'descend') {
        descendT = 0;
        flash = 0.25; flashColor.copy(pal.glow);
      } else if (e.type === 'surface') {
        flash = 1.2; flashColor.set(1, 0.9, 0.7);
        palTarget.water.set(0x3aa6d8); palTarget.deep.set(0x10405a); palTarget.glow.set(0xfff1c4);
        darkTarget = 0;
        surfacing = 0;
      } else if (e.type === 'nearMiss') {
        
        boom(state, e, new THREE.Color(1, 1, 1), 18, { speed: 2.2, up: 1.6, size: 10, life: 0.6 });
        flash = Math.max(flash, 0.32); flashColor.set(0.85, 0.95, 1);
        shake = Math.max(shake, 0.18);
      } else if (e.type === 'flinch') {
        
        const at = onCube(state) ? e : { x: Math.max(0, Math.min(W - 1, e.x)), y: Math.max(0, Math.min(H - 1, e.y)) };
        boom(state, at, new THREE.Color(1, 0.55, 0.25), 12, { speed: 1.2, up: 0.8, size: 9, life: 0.5 });
        flash = Math.max(flash, 0.22); flashColor.set(1, 0.6, 0.3);
        shake = Math.max(shake, 0.12);
      } else if (e.type === 'spawn') {
        boom(state, e, pal.mote, 10, { speed: 1.2, up: 1, size: 9, life: 0.6 });
      } else if (e.type === 'shoal') {
        const c = e.centre;
        boom(state, c, pal.shoal, 30, { speed: 2, up: 1.5, size: 10, life: 0.9 });
        ring(state, c, 1.2);
      }
    }
  }

  let pulse = 0, dying = 0, surfacing = -1;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
  const pathX = new Float32Array(1024), pathZ = new Float32Array(1024);

  




  function eelPath(state, alpha) {
    return unwrapEel(state.snake, state.prevSnake || state.snake, alpha, W, H, pathX, pathZ);
  }

  let ghost = null;
  function showGhostLoop(centre, state = null) {
    
    if (ghost) world.remove(ghost);
    const pts = [];
    const r = 1.9;
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    ghost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9 }));
    ghost.computeLineDistances();
    ghost.userData.t = 0;
    if (state && onCube(state)) { cubeLocal(centre, 0.12, ghost.position); faceQuat(centre, ghost.quaternion); }
    else ghost.position.set(cellX(centre.x), 0.12, cellZ(centre.y));
    world.add(ghost);
  }

  
  const cP = new THREE.Vector3(), cN = new THREE.Vector3(), cQ = new THREE.Vector3(), cSide = new THREE.Vector3();
  const headUp = new THREE.Vector3(), headFwd = new THREE.Vector3(), headX = new THREE.Vector3();
  const leanQ = new THREE.Quaternion(), leanAxis = new THREE.Vector3();
  const AX = ['x', 'y', 'z'];
  const faceKey = (f) => (f ? `${f.F.x},${f.F.y},${f.F.z}|${f.U.x},${f.U.y},${f.U.z}` : '');

  
  function cellsToEdge(state) {
    const h = state.snake[0];
    const d = Cube.screenVec(state.frame, state.dir);
    for (const a of AX) if (d[a]) return d[a] > 0 ? Cube.N - 1 - h[a] : h[a];
    return Cube.N;
  }

  




  function cuePoint(m, headCell, out) {
    if (Cube.faceOf(m) === Cube.faceOf(headCell)) return false;
    const n = Cube.normalOf(headCell);
    const p = Cube.surfacePoint(m);
    const lim = Cube.N / 2 - 0.3;
    let best = null, bestAbs = -1, atBorder = false;
    for (const a of AX) {
      if (n[a]) continue;
      const v = Math.max(-lim, Math.min(lim, p[a]));
      if (Math.abs(v) >= lim) atBorder = true;
      if (Math.abs(p[a]) > bestAbs) { bestAbs = Math.abs(p[a]); best = a; }
      out[a] = v;
    }
    if (!atBorder) out[best] = (p[best] >= 0 ? 1 : -1) * lim;
    for (const a of AX) if (n[a]) out[a] = n[a] * (Cube.N / 2 + 0.35);
    return true;
  }

  function drawCube(state, alpha, dt, t, tickSec) {
    const deathFade = Math.max(0, 1 - dying);
    const alive = state.phase !== 'dead';
    let count = 0, lightCount = 0;
    
    const n = sampleCubeEel(state.snake, state.prevSnake || state.snake, alpha, SUB, cubePos, cubeNor);
    if (alive || deathFade > 0) {
      for (let i = 0; i < n && count < MAX_BODY; i++) {
        const u = i / Math.max(1, n - 1);
        cP.fromArray(cubePos, i * 3); cN.fromArray(cubeNor, i * 3);
        const j = Math.min(n - 1, i + 1), k = Math.max(0, i - 1);
        cQ.fromArray(cubePos, k * 3).sub(tmpV.fromArray(cubePos, j * 3)); 
        cSide.crossVectors(cN, cQ);
        if (cSide.lengthSq() > 1e-6) cSide.normalize();
        const cell = i / SUB;
        const wave = Math.sin(t * 6 - cell * 0.9) * 0.05;
        const r = (0.78 - u * 0.42) * (1 + pulse * 0.25 * Math.exp(-u * 4));
        tmpP.copy(cP).addScaledVector(cN, 0.38 + Math.sin(t * 3 + cell) * 0.03).addScaledVector(cSide, wave);
        tmpS.setScalar(r * (alive ? 1 : deathFade));
        tmpM.compose(tmpP, tmpQ.identity(), tmpS);
        body.setMatrixAt(count, tmpM);
        const glow = (1.05 - u * 0.55) * (1 + pulse * 0.6) * (0.85 + 0.15 * Math.sin(t * 4 - cell * 0.6));
        tmpC.copy(EEL_HEAD).lerp(EEL_TAIL, u).multiplyScalar(glow * 1.5);
        body.setColorAt(count, tmpC);
        count++;
        if (i % (SUB * Math.max(1, Math.ceil(state.snake.length / MAX_LIGHTS))) === 0 && lightCount < MAX_LIGHTS - 12) {
          cubeLights[lightCount++].set(cP.x, cP.y, cP.z, (1.1 - u * 0.5) * deathFade);
        }
      }
    }
    body.count = count;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    
    head.visible = alive || deathFade > 0.05;
    headUp.fromArray(cubeNor, 0);
    cP.fromArray(cubePos, 0);
    if (n > 1) headFwd.copy(cP).sub(tmpV.fromArray(cubePos, 3));
    else headFwd.copy(v3(Cube.screenVec(state.frame, state.dir), tmpV));
    headFwd.addScaledVector(headUp, -headFwd.dot(headUp));
    if (headFwd.lengthSq() < 1e-8) headFwd.copy(v3(Cube.screenVec(state.frame, state.dir), tmpV));
    headFwd.normalize();
    headX.crossVectors(headUp, headFwd);
    tmpQ.setFromRotationMatrix(tmpMat.makeBasis(headX, headUp, headFwd));
    if (!cubeCam.headSet) { cubeCam.headQ.copy(tmpQ); cubeCam.headSet = true; }
    else cubeCam.headQ.slerp(tmpQ, 1 - Math.exp(-dt * 18));
    head.quaternion.copy(cubeCam.headQ);
    head.position.copy(cP).addScaledVector(headUp, 0.45 + Math.sin(t * 3) * 0.04);
    head.scale.setScalar(1.3 * (1 + pulse * 0.15) * (alive ? 1 : deathFade));
    headMesh.material.emissive.copy(EEL_HEAD);
    headMesh.material.emissiveIntensity = 1.4 + pulse * 1.5;
    if (lightCount < MAX_LIGHTS) cubeLights[lightCount++].set(cP.x, cP.y, cP.z, 0.9 * deathFade);

    
    const headCell = state.snake[0];
    let cueN = 0;
    motes.count = state.motes.length;
    state.motes.forEach((m, i) => {
      const shoal = m.kind === 'shoal';
      const bob = Math.sin(t * 3 + m.id) * 0.08;
      cubeLocal(m, 0.42 + bob, tmpP);
      tmpQ.setFromEuler(new THREE.Euler(t * 1.3 + m.id, t * 1.7, 0));
      tmpS.setScalar(shoal ? 0.85 : 1.25);
      tmpM.compose(tmpP, tmpQ, tmpS);
      motes.setMatrixAt(i, tmpM);
      const beacon = 1 + dark * 2.5 * Math.pow(Math.max(0, Math.sin(t * Math.PI - m.id)), 8);
      const colr = shoal ? pal.shoal : pal.mote;
      tmpC.copy(colr).multiplyScalar((shoal ? 2.4 : 3.2) * beacon);
      motes.setColorAt(i, tmpC);
      const h = halos[i];
      h.visible = true;
      h.position.copy(tmpP);
      const hs = (shoal ? 1.3 : 1.9) * (1 + 0.1 * Math.sin(t * 5 + m.id)) * (0.8 + 0.4 * beacon);
      h.scale.set(hs, hs, 1);
      h.material.color.copy(colr);
      h.material.opacity = 0.55;
      if (lightCount < MAX_LIGHTS) { const s = Cube.surfacePoint(m); cubeLights[lightCount++].set(s.x, s.y, s.z, 0.35 * beacon); }
      if (cueN < cues.length && alive && cuePoint(m, headCell, tmpW)) {
        const c = cues[cueN++];
        c.visible = true;
        c.position.copy(tmpW);
        const cs = 1.1 + 0.25 * Math.sin(t * 5 + m.id);
        c.scale.set(cs, cs, 1);
        c.material.color.copy(colr);
        c.material.opacity = 0.75;
      }
    });
    for (let i = state.motes.length; i < halos.length; i++) halos[i].visible = false;
    for (let i = cueN; i < cues.length; i++) cues[i].visible = false;
    motes.instanceMatrix.needsUpdate = true;
    if (motes.instanceColor) motes.instanceColor.needsUpdate = true;

    
    jellies.forEach((J, i) => {
      const j = state.jellies[i];
      J.g.visible = !!j;
      if (!j) { J.seen = false; return; }
      cubeLocal(j, 0, tmpV);
      if (!J.seen) { J.pos.copy(tmpV); J.seen = true; }
      J.pos.lerp(tmpV, 1 - Math.exp(-dt * 5));
      const nn = v3(Cube.normalOf(j), tmpN);
      J.g.position.copy(J.pos).addScaledVector(nn, 0.1 + Math.sin(t * 2 + i) * 0.08);
      faceQuat(j, J.g.quaternion);
      const beat = 1 + 0.12 * Math.sin(t * 4 + i);
      J.dome.scale.set(beat, 2 - beat, beat);
      J.dome.material.emissiveIntensity = 1.2 + 0.8 * Math.max(0, Math.sin(t * 4 + i));
      for (const tn of J.tents) {
        const p = tn.line.geometry.attributes.position;
        for (let s = 0; s < 8; s++) {
          const f = s / 7;
          p.setXYZ(s, Math.cos(tn.a) * 0.28 + Math.sin(t * 3 + s * 0.8 + tn.a) * 0.08 * f, 0.35 - f * 0.32, Math.sin(tn.a) * 0.28 + Math.cos(t * 2.6 + s) * 0.08 * f);
        }
        p.needsUpdate = true;
      }
      if (lightCount < MAX_LIGHTS) cubeLights[lightCount++].set(J.pos.x, J.pos.y, J.pos.z, 0.45);
    });
    cubeMat.uniforms.uLightCount.value = lightCount;

    
    
    
    
    
    const still = reducedMotion();
    frameQuat(state.frame, cubeCam.target);
    const key = faceKey(state.frame);
    const newTick = !cubeCam.lastHead || !Cube.same(cubeCam.lastHead, headCell);
    if (newTick) { cubeCam.lastHead = { ...headCell }; for (const r of cubeCam.rolls) r.ticks++; }
    if (!cubeCam.key) {
      cubeCam.rolls.length = 0; cubeCam.fadeT = -1; cubeCam.fresh = true;
      cubeLocal(state.snake[0], 0, cubeCam.follow);
    } else if (key !== cubeCam.key) {
      
      
      tmpQl.copy(cubeCam.target).multiply(tmpQa.copy(cubeCam.prevTarget).invert());
      if (tmpQl.w < 0) { tmpQl.x = -tmpQl.x; tmpQl.y = -tmpQl.y; tmpQl.z = -tmpQl.z; tmpQl.w = -tmpQl.w; }
      const axis = new THREE.Vector3(tmpQl.x, tmpQl.y, tmpQl.z);
      if (axis.lengthSq() > 1e-8) cubeCam.rolls.push({ axis: axis.normalize(), ticks: 0 });
      if (cubeCam.rolls.length > 3) cubeCam.rolls.shift();
      if (still) cubeCam.fadeT = 0;
    }
    cubeCam.key = key;
    cubeCam.prevTarget.copy(cubeCam.target);    
    cubeCam.desired.copy(cubeCam.target);
    if (!still && alive) {
      const moving = state.prevSnake && state.prevSnake.length && !Cube.same(state.prevSnake[0], state.snake[0]);
      const dist = cellsToEdge(state) + (moving ? 1 - alpha : 0);
      const ang = THREE.MathUtils.degToRad(turnAngle(preCrossU(dist)));
      if (ang > 1e-4) {
        leanAxis.crossVectors(SCREEN_WORLD[state.dir], UP).normalize();
        leanQ.setFromAxisAngle(leanAxis, ang);
        cubeCam.desired.premultiply(leanQ);
      }
    }
    for (let i = cubeCam.rolls.length - 1; i >= 0; i--) {
      const r = cubeCam.rolls[i];
      const left = residualAngle(r.ticks, still ? 1 : alpha); 
      if (left > -1e-3) { cubeCam.rolls.splice(i, 1); continue; }
      cubeCam.desired.premultiply(leanQ.setFromAxisAngle(r.axis, THREE.MathUtils.degToRad(left)));
    }
    let fade = 0;
    if (still) {
      if (cubeCam.fadeT >= 0) {
        cubeCam.fadeT += dt;
        const half = CUBE_FADE_S / 2;
        if (cubeCam.fadeT >= half) cubeCam.display.copy(cubeCam.target);
        fade = Math.max(0, 1 - Math.abs(cubeCam.fadeT - half) / half);
        if (cubeCam.fadeT >= CUBE_FADE_S) { cubeCam.fadeT = -1; fade = 0; }
      } else cubeCam.display.copy(cubeCam.target);
      cubeCam.rolls.length = 0;
    } else if (cubeCam.fresh) {
      cubeCam.display.copy(cubeCam.desired); cubeCam.fresh = false;
    } else {
      
      
      cubeCam.display.slerp(cubeCam.desired, 1 - Math.exp(-dt * 18));
    }
    if (grade) grade.uniforms.uFade.value = fade;
    
    cQ.fromArray(cubePos, 0); 
    
    if (alive) cQ.addScaledVector(v3(Cube.screenVec(state.frame, state.dir), tmpV), CUBE_AHEAD);
    for (const a of AX) {
      const dlt = cQ[a] - cubeCam.follow[a];
      if (dlt > CUBE_WINDOW) cubeCam.look[a] = cQ[a] - CUBE_WINDOW;
      else if (dlt < -CUBE_WINDOW) cubeCam.look[a] = cQ[a] + CUBE_WINDOW;
      else cubeCam.look[a] = cubeCam.follow[a];
    }
    cubeCam.follow.lerp(cubeCam.look, 1 - Math.exp(-dt * 6));
    world.quaternion.copy(cubeCam.display);
    world.position.copy(cubeCam.follow).applyQuaternion(cubeCam.display).negate();

    
    
    
    
    camera.up.set(0, 0, -1);
    camera.position.set(0, cubeDist, 0);
    shake = Math.max(0, shake - dt * 2.4);
    if (still) shake = 0;
    if (shake > 0) camera.position.add(tmpP.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
    camera.lookAt(0, 0, 0);
  }

  






  function frame(state, alpha, dt, { idle = false, pace: paceCells = null, tickMs: tickLen = 150 } = {}) {
    const t = (floorMat.uniforms.uTime.value += dt);
    const cube = onCube(state);
    floor.visible = !cube;
    cubeMesh.visible = cube;
    landmarkGroup.visible = cube;
    if (cube) loadLandmarks();
    if (!cube && cubeCam.key) {
      world.position.set(0, 0, 0); world.quaternion.identity(); head.quaternion.identity();
      cubeCam.key = ''; cubeCam.headSet = false;
      for (const c of cues) c.visible = false;
      for (const J of jellies) J.g.quaternion.identity();
      if (grade) grade.uniforms.uFade.value = 0;
    }
    
    
    drawPace(idle || cube ? null : paceCells, t);
    
    const k = 1 - Math.exp(-dt * 1.6);
    for (const key of Object.keys(pal)) pal[key].lerp(palTarget[key], k);
    dark += (darkTarget - dark) * k;
    floorMat.uniforms.uDark.value = dark;
    scene.fog.color.copy(pal.deep).multiplyScalar(0.45);
    scene.fog.density = 0.004 + dark * 0.006;
    renderer.setClearColor(scene.fog.color);
    for (const s of shafts) {
      s.material.opacity = 0.07 * (1 - dark) * (0.7 + 0.3 * Math.sin(t * 0.6 + s.position.x));
      s.rotation.z = 0.35 + Math.sin(t * 0.2 + s.position.x) * 0.06;
      s.material.color.copy(pal.glow);
    }

    
    if (tileT > 0) { tileT = Math.max(0, tileT - dt * 1.4); tileMat.opacity = tileT * 0.7; if (!tileT) tiles.count = 0; }
    if (ghost) {
      ghost.userData.t += dt;
      ghost.material.opacity = 0.9 * Math.max(0, 1 - ghost.userData.t / 6) * (0.6 + 0.4 * Math.sin(t * 6));
      if (ghost.userData.t > 6) { world.remove(ghost); ghost = null; }
    }
    if (dying > 0 && state.phase === 'dead') dying = Math.min(1, dying + dt * 0.8);
    updateParticles(dt, 1 - dark * 0.6);
    pulse = Math.max(0, pulse - dt * 2.2);

    if (cube) drawCube(state, alpha, dt, t, tickLen / 1000);
    else drawFlat(state, alpha, dt, t, idle);

    flash = Math.max(0, flash - dt * 2.5);
    if (composer) {
      grade.uniforms.uFlash.value = flash;
      grade.uniforms.uFlashColor.value.copy(flashColor);
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function drawFlat(state, alpha, dt, t, idle) {
    
    const n = eelPath(state, alpha);
    let count = 0, lightCount = 0;
    const deathFade = Math.max(0, 1 - dying);
    const alive = state.phase !== 'dead';
    if (alive || deathFade > 0) {
      for (let i = 0; i < n - 1 && count < MAX_BODY; i++) {
        const ax = pathX[i], az = pathZ[i], bx = pathX[i + 1], bz = pathZ[i + 1];
        if (Math.abs(ax - bx) + Math.abs(az - bz) > 1.5) continue; 
        for (let s = 0; s < SUB && count < MAX_BODY; s++) {
          const f = s / SUB;
          const u = (i + f) / Math.max(1, n - 1); 
          const gx = wrapCoord(ax + (bx - ax) * f, W), gy = wrapCoord(az + (bz - az) * f, H);
          const edge = edgeFade(gx, gy, W, H);
          if (edge <= 0.001) continue;
          const x = cellX(gx), z = cellZ(gy);
          const wave = Math.sin(t * 6 - (i + f) * 0.9) * 0.05;
          const r = (0.78 - u * 0.42) * (1 + pulse * 0.25 * Math.exp(-u * 4));
          tmpP.set(x + wave * (bz - az), 0.38 + Math.sin(t * 3 + i) * 0.03, z - wave * (bx - ax));
          tmpS.setScalar(r * edge * (alive ? 1 : deathFade));
          tmpM.compose(tmpP, tmpQ.identity(), tmpS);
          body.setMatrixAt(count, tmpM);
          const glow = (1.05 - u * 0.55) * (1 + pulse * 0.6) * (0.85 + 0.15 * Math.sin(t * 4 - i * 0.6));
          tmpC.copy(EEL_HEAD).lerp(EEL_TAIL, u).multiplyScalar(glow * 1.5);
          body.setColorAt(count, tmpC);
          count++;
        }
        if (i % Math.max(1, Math.ceil(n / MAX_LIGHTS)) === 0 && lightCount < MAX_LIGHTS - 12) {
          const lx = wrapCoord(ax, W), lz = wrapCoord(az, H);
          lights[lightCount++].set(cellX(lx), cellZ(lz), (1.1 - (i / n) * 0.5) * deathFade * edgeFade(lx, lz, W, H));
        }
      }
    }
    body.count = count;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    
    head.visible = alive || deathFade > 0.05;
    const hgx = wrapCoord(pathX[0], W), hgz = wrapCoord(pathZ[0], H);
    const headEdge = edgeFade(hgx, hgz, W, H);
    const hx = cellX(hgx), hz = cellZ(hgz);
    head.position.set(hx, 0.45 + Math.sin(t * 3) * 0.04, hz);
    const d = DIRS[state.dir];
    const targetYaw = Math.atan2(d.x, d.y);
    let dy = targetYaw - headYaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    headYaw += dy * (1 - Math.exp(-dt * 18));
    head.rotation.y = headYaw;
    head.scale.setScalar(1.3 * (1 + pulse * 0.15) * headEdge * (alive ? 1 : deathFade));
    headMesh.material.emissive.copy(EEL_HEAD);
    headMesh.material.emissiveIntensity = 1.4 + pulse * 1.5;
    if (lightCount < MAX_LIGHTS) lights[lightCount++].set(hx, hz, 0.9 * deathFade * headEdge);

    
    motes.count = state.motes.length;
    state.motes.forEach((m, i) => {
      const shoal = m.kind === 'shoal';
      const bob = Math.sin(t * 3 + m.id) * 0.08;
      tmpP.set(cellX(m.x), 0.42 + bob, cellZ(m.y));
      tmpQ.setFromEuler(new THREE.Euler(t * 1.3 + m.id, t * 1.7, 0));
      tmpS.setScalar(shoal ? 0.85 : 1.25);
      tmpM.compose(tmpP, tmpQ, tmpS);
      motes.setMatrixAt(i, tmpM);
      
      const beacon = 1 + dark * 2.5 * Math.pow(Math.max(0, Math.sin(t * Math.PI - m.id)), 8);
      tmpC.copy(shoal ? pal.shoal : pal.mote).multiplyScalar((shoal ? 2.4 : 3.2) * beacon);
      motes.setColorAt(i, tmpC);
      const h = halos[i];
      h.visible = true;
      h.position.copy(tmpP);
      const hs = (shoal ? 1.3 : 1.9) * (1 + 0.1 * Math.sin(t * 5 + m.id)) * (0.8 + 0.4 * beacon);
      h.scale.set(hs, hs, 1);
      h.material.color.copy(shoal ? pal.shoal : pal.mote);
      h.material.opacity = 0.55;
      if (lightCount < MAX_LIGHTS) lights[lightCount++].set(tmpP.x, tmpP.z, 0.35 * beacon);
    });
    for (let i = state.motes.length; i < halos.length; i++) halos[i].visible = false;
    motes.instanceMatrix.needsUpdate = true;
    if (motes.instanceColor) motes.instanceColor.needsUpdate = true;

    
    jellies.forEach((J, i) => {
      const j = state.jellies[i];
      J.g.visible = !!j;
      if (!j) { J.seen = false; return; }
      const tx = cellX(j.x), tz = cellZ(j.y);
      if (!J.seen) { J.pos.set(tx, 0, tz); J.seen = true; }
      J.pos.x += (tx - J.pos.x) * (1 - Math.exp(-dt * 5));
      J.pos.z += (tz - J.pos.z) * (1 - Math.exp(-dt * 5));
      J.g.position.set(J.pos.x, 0.1 + Math.sin(t * 2 + i) * 0.08, J.pos.z);
      const beat = 1 + 0.12 * Math.sin(t * 4 + i);
      J.dome.scale.set(beat, 2 - beat, beat);
      J.dome.material.emissiveIntensity = 1.2 + 0.8 * Math.max(0, Math.sin(t * 4 + i));
      for (const tn of J.tents) {
        const p = tn.line.geometry.attributes.position;
        for (let s = 0; s < 8; s++) {
          const f = s / 7;
          p.setXYZ(s, Math.cos(tn.a) * 0.28 + Math.sin(t * 3 + s * 0.8 + tn.a) * 0.08 * f, 0.35 - f * 0.32, Math.sin(tn.a) * 0.28 + Math.cos(t * 2.6 + s) * 0.08 * f);
        }
        p.needsUpdate = true;
      }
      if (lightCount < MAX_LIGHTS) lights[lightCount++].set(J.pos.x, J.pos.z, 0.45);
    });
    floorMat.uniforms.uLightCount.value = lightCount;

    
    camTarget.set(hx * 0.12, 0, hz * 0.1);
    camLook.lerp(camTarget, 1 - Math.exp(-dt * 2));
    let lift = 0;
    if (descendT >= 0) {
      descendT += dt;
      const p = Math.min(1, descendT / 2.4);
      lift = Math.sin(p * Math.PI) * 5;
      if (p >= 1) descendT = -1;
    }
    if (surfacing >= 0) surfacing += dt;
    const idleSway = idle ? Math.sin(t * 0.25) * 0.08 : 0;
    const dist = baseDist + lift + (surfacing >= 0 ? Math.min(surfacing, 4) * 1.5 : 0);
    const tilt = 1.08 + idleSway; 
    camera.position.set(camLook.x + Math.sin(idleSway) * 3, Math.sin(tilt) * dist, camLook.z + Math.cos(tilt) * dist);
    shake = Math.max(0, shake - dt * 2.4);
    if (shake > 0) camera.position.add(tmpP.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
    camera.up.set(0, 1, 0); 
    camera.lookAt(camLook.x, 0, camLook.z + 0.6);
  }

  
  let fpsAcc = 0, fpsFrames = 0, tier = 0;
  function measure(dt) {
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc < 3) return;
    const fps = fpsFrames / fpsAcc;
    fpsAcc = 0; fpsFrames = 0;
    if (fps < 45 && tier === 0) { tier = 1; pixelRatio = 1; renderer.setPixelRatio(1); resize(); }
    else if (fps < 40 && tier === 1 && composer) { tier = 2; composer = null; }
  }

  function reset() {
    dying = 0; surfacing = -1; descendT = -1; pulse = 0; tileT = 0; tiles.count = 0;
    if (ghost) { world.remove(ghost); ghost = null; }
    for (const J of jellies) J.seen = false;
  }

  resize();
  return { frame, onEvents, setDepth, resize, measure, reset, showGhostLoop, renderer };
}
