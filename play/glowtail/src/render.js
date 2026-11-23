








import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, DIRS } from './sim.js';

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
  uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: 1 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uFlash; uniform vec3 uFlashColor; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += uFlashColor * uFlash;
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
  scene.add(body);

  
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
  scene.add(head);
  let headYaw = 0;

  
  const glowTex = glowTexture();
  const moteGeo = new THREE.IcosahedronGeometry(0.2, 1);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, 64);
  motes.setColorAt(0, new THREE.Color());
  motes.count = 0;
  motes.frustumCulled = false;
  scene.add(motes);
  const halos = [];
  for (let i = 0; i < 64; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.visible = false;
    scene.add(s);
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
    scene.add(g);
    jellies.push({ g, dome, tents, pos: new THREE.Vector3(), seen: false });
  }

  
  const tileMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.94, 0.94).rotateX(-Math.PI / 2), tileMat, W * H);
  tiles.count = 0;
  tiles.frustumCulled = false;
  scene.add(tiles);
  let tileT = 0;

  
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
  let baseDist = 24;
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

  
  function onEvents(events, state) {
    for (const e of events) {
      if (e.type === 'bite') {
        const c = e.kind === 'shoal' ? pal.shoal : pal.mote;
        burst(cellX(e.x), cellZ(e.y), c, 26, { speed: 2.6, size: 12 });
        addRipple(cellX(e.x), cellZ(e.y), 0.8);
        shake = Math.max(shake, 0.12);
        pulse = 1;
      } else if (e.type === 'encircle') {
        tiles.count = e.cells.length;
        const m = new THREE.Matrix4();
        e.cells.forEach((c, i) => { m.makeTranslation(cellX(c.x), 0.03, cellZ(c.y)); tiles.setMatrixAt(i, m); });
        tiles.instanceMatrix.needsUpdate = true;
        tileMat.color.copy(pal.shoal).multiplyScalar(1.4);
        tileT = 1;
        for (const mo of e.motes) burst(cellX(mo.x), cellZ(mo.y), pal.shoal, 46, { speed: 4.5, up: 4, size: 18, life: 1.3 });
        const cx = e.cells.reduce((a, c) => a + c.x, 0) / e.cells.length, cz = e.cells.reduce((a, c) => a + c.y, 0) / e.cells.length;
        addRipple(cellX(cx), cellZ(cz), 2.2);
        shake = Math.max(shake, 0.45);
        flash = 0.5; flashColor.copy(pal.shoal);
        pulse = 1.6;
      } else if (e.type === 'death') {
        for (let i = 0; i < state.snake.length; i += 1) {
          const c = state.snake[i];
          burst(cellX(c.x), cellZ(c.y), pal.glow, 10, { speed: 3, up: 3, size: 14, life: 1.6 });
        }
        addRipple(cellX(state.snake[0].x), cellZ(state.snake[0].y), 2.5);
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
      } else if (e.type === 'spawn') {
        burst(cellX(e.x), cellZ(e.y), pal.mote, 10, { speed: 1.2, up: 1, size: 9, life: 0.6 });
      } else if (e.type === 'shoal') {
        const c = e.centre;
        burst(cellX(c.x), cellZ(c.y), pal.shoal, 30, { speed: 2, up: 1.5, size: 10, life: 0.9 });
        addRipple(cellX(c.x), cellZ(c.y), 1.2);
      }
    }
  }

  let pulse = 0, dying = 0, surfacing = -1;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
  const pathX = new Float32Array(1024), pathZ = new Float32Array(1024);

  
  function eelPath(state, alpha) {
    const cur = state.snake, prev = state.prevSnake || cur;
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      const a = prev[Math.min(i, prev.length - 1)], b = cur[i];
      let x = b.x, y = b.y;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) { x = a.x + (b.x - a.x) * alpha; y = a.y + (b.y - a.y) * alpha; }
      pathX[i] = cellX(x); pathZ[i] = cellZ(y);
    }
    return n;
  }

  let ghost = null;
  function showGhostLoop(centre) {
    
    if (ghost) scene.remove(ghost);
    const pts = [];
    const r = 1.9;
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3(cellX(centre.x) + Math.cos(a) * r, 0.12, cellZ(centre.y) + Math.sin(a) * r)); }
    ghost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9 }));
    ghost.computeLineDistances();
    ghost.userData.t = 0;
    scene.add(ghost);
  }

  






  function frame(state, alpha, dt, { idle = false } = {}) {
    const t = (floorMat.uniforms.uTime.value += dt);
    
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

    
    const n = eelPath(state, alpha);
    let count = 0, lightCount = 0;
    const deathFade = Math.max(0, 1 - dying);
    pulse = Math.max(0, pulse - dt * 2.2);
    const alive = state.phase !== 'dead';
    if (alive || deathFade > 0) {
      for (let i = 0; i < n - 1 && count < MAX_BODY; i++) {
        const ax = pathX[i], az = pathZ[i], bx = pathX[i + 1], bz = pathZ[i + 1];
        if (Math.abs(ax - bx) + Math.abs(az - bz) > 1.5) continue; 
        for (let s = 0; s < SUB && count < MAX_BODY; s++) {
          const f = s / SUB;
          const u = (i + f) / Math.max(1, n - 1); 
          const x = ax + (bx - ax) * f, z = az + (bz - az) * f;
          const wave = Math.sin(t * 6 - (i + f) * 0.9) * 0.05;
          const r = (0.78 - u * 0.42) * (1 + pulse * 0.25 * Math.exp(-u * 4));
          tmpP.set(x + wave * (bz - az), 0.38 + Math.sin(t * 3 + i) * 0.03, z - wave * (bx - ax));
          tmpS.setScalar(r * (alive ? 1 : deathFade));
          tmpM.compose(tmpP, tmpQ.identity(), tmpS);
          body.setMatrixAt(count, tmpM);
          const glow = (1.05 - u * 0.55) * (1 + pulse * 0.6) * (0.85 + 0.15 * Math.sin(t * 4 - i * 0.6));
          tmpC.copy(EEL_HEAD).lerp(EEL_TAIL, u).multiplyScalar(glow * 1.5);
          body.setColorAt(count, tmpC);
          count++;
        }
        if (i % Math.max(1, Math.ceil(n / MAX_LIGHTS)) === 0 && lightCount < MAX_LIGHTS - 12) {
          lights[lightCount++].set(ax, az, (1.1 - (i / n) * 0.5) * deathFade);
        }
      }
    }
    body.count = count;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    
    head.visible = alive || deathFade > 0.05;
    const hx = pathX[0], hz = pathZ[0];
    head.position.set(hx, 0.45 + Math.sin(t * 3) * 0.04, hz);
    const d = DIRS[state.dir];
    const targetYaw = Math.atan2(d.x, d.y);
    let dy = targetYaw - headYaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    headYaw += dy * (1 - Math.exp(-dt * 18));
    head.rotation.y = headYaw;
    head.scale.setScalar(1.3 * (1 + pulse * 0.15) * (alive ? 1 : deathFade));
    headMesh.material.emissive.copy(EEL_HEAD);
    headMesh.material.emissiveIntensity = 1.4 + pulse * 1.5;
    if (lightCount < MAX_LIGHTS) lights[lightCount++].set(hx, hz, 0.9 * deathFade);

    
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

    
    if (tileT > 0) { tileT = Math.max(0, tileT - dt * 1.4); tileMat.opacity = tileT * 0.7; if (!tileT) tiles.count = 0; }
    if (ghost) {
      ghost.userData.t += dt;
      ghost.material.opacity = 0.9 * Math.max(0, 1 - ghost.userData.t / 6) * (0.6 + 0.4 * Math.sin(t * 6));
      ghost.rotation.y = 0;
      if (ghost.userData.t > 6) { scene.remove(ghost); ghost = null; }
    }

    if (dying > 0 && state.phase === 'dead') dying = Math.min(1, dying + dt * 0.8);
    updateParticles(dt, 1 - dark * 0.6);

    
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
    camera.lookAt(camLook.x, 0, camLook.z + 0.6);

    flash = Math.max(0, flash - dt * 2.5);
    if (composer) {
      grade.uniforms.uFlash.value = flash;
      grade.uniforms.uFlashColor.value.copy(flashColor);
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
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
    if (ghost) { scene.remove(ghost); ghost = null; }
    for (const J of jellies) J.seen = false;
  }

  resize();
  return { frame, onEvents, setDepth, resize, measure, reset, showGhostLoop, renderer };
}
