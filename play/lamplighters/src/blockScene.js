













import * as THREE from 'three';
import { CELL } from '../../../web-engine/lamps/lampsMatch.js';
import { lettersOf, roomAt, roomIndex } from '../../../web-engine/lamps/lampsBlock.js';
import {
  ATLAS_COLS, ATLAS_ROWS, NO_CUT, TAP_SLOP_PX, TONE, clueTile, faceLinesOf, lineTone, pickRoom, roomCentre, roomStands,
} from './blockView.js';

const FOV_DEG = 28;
const YAW_START = -0.62;
const PITCH_START = 0.5;
const PITCH_MIN = 0.12;
const PITCH_MAX = 1.3;
const TURN_PER_PX = 0.0085;
const LONG_PRESS_MS = 420;
const ROOM_HALF = 0.482;
const ROOM_ROUND = 0.075;
const POP_MS = 320;
const FALL_MS = 620;
const BLOW_MS = 520;
const CLOSE_RIPPLE_MS = 620;
const REVEAL_FLOOR_MS = 240;
const REVEAL_FADE_MS = 520;
const REVEAL_SPIN = 0.32;

const CREW = [new THREE.Color(0xffb547), new THREE.Color(0x46d3e6)];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp01 = (t) => Math.min(1, Math.max(0, t));


function roomGeometry() {
  const h = ROOM_HALF;
  const r = ROOM_ROUND;
  const grid = [-h, -h + r, h - r, h];
  const pos = [];
  const nor = [];
  const uvs = [];
  const axes = [];
  const idx = [];
  const inner = h - r;
  const faces = [
    { axis: 0, n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { axis: 0, n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { axis: 1, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { axis: 1, n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { axis: 2, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { axis: 2, n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  ];
  for (const f of faces) {
    const base = pos.length / 3;
    for (const b of grid) {
      for (const a of grid) {
        const p = [0, 1, 2].map((k) => f.n[k] * h + f.u[k] * a + f.v[k] * b);
        const core = p.map((c) => Math.max(-inner, Math.min(inner, c)));
        const d = p.map((c, k) => c - core[k]);
        const len = Math.hypot(...d) || 1;
        const unit = d.map((c) => c / len);
        pos.push(...core.map((c, k) => c + unit[k] * r));
        nor.push(...unit);
        uvs.push((a + h) / (2 * h), (b + h) / (2 * h));
        axes.push(f.axis);
      }
    }
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        const q = base + y * 4 + x;
        idx.push(q, q + 1, q + 5, q, q + 5, q + 4);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('faceAxis', new THREE.Float32BufferAttribute(axes, 1));
  g.setIndex(idx);
  return g;
}


function clueAtlas() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * size;
  canvas.height = ATLAS_ROWS * size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let row = 0; row < ATLAS_ROWS; row += 1) {
    for (let count = 1; count < ATLAS_COLS; count += 1) {
      const x = count * size + size / 2;
      const y = row * size + size / 2;
      const groups = row + 1;
      ctx.font = `800 ${groups > 1 ? 60 : 70}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(String(count), x, y + (groups > 1 ? -11 : 3));
      
      if (groups > 1) {
        const gap = 21;
        for (let k = 0; k < groups; k += 1) {
          ctx.beginPath();
          ctx.arc(x + (k - (groups - 1) / 2) * gap, y + 30, 7.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

const ROOM_VERT = `
  attribute float faceAxis;
  attribute vec3 aClue;
  attribute vec3 aTone;
  attribute vec4 aLook;   // kind (0 dark, 1 amber, 2 cyan, 3 switched off), mark, focus, flash
  attribute vec3 aTrue;
  attribute vec3 aBleed;
  attribute float aReveal;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vBlock;
  varying float vClue;
  varying float vTone;
  varying vec4 vLook;
  varying vec3 vTrue;
  varying vec3 vBleed;
  varying float vReveal;
  varying float vFloorY;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vec4 view = viewMatrix * world;
    vView = -view.xyz;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vBlock = position + instanceMatrix[3].xyz;
    int ax = int(faceAxis + 0.5);
    vClue = ax == 0 ? aClue.x : ax == 1 ? aClue.y : aClue.z;
    vTone = ax == 0 ? aTone.x : ax == 1 ? aTone.y : aTone.z;
    vLook = aLook;
    vTrue = aTrue;
    vBleed = aBleed;
    vReveal = aReveal;
    vFloorY = world.y;
    gl_Position = projectionMatrix * view;
  }
`;

const ROOM_FRAG = `
  uniform sampler2D uAtlas;
  uniform sampler2D uWall;
  uniform float uHasWall;
  uniform vec2 uAtlasSize;
  uniform float uTime;
  uniform float uFrozen;
  uniform float uBlack;
  uniform float uMirror;
  uniform float uGround;
  uniform float uDepthNear;
  uniform float uDepthFar;
  uniform float uVeil;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vBlock;
  varying float vClue;
  varying float vTone;
  varying vec4 vLook;
  varying vec3 vTrue;
  varying vec3 vBleed;
  varying float vReveal;
  varying float vFloorY;

  const vec3 AMBER = vec3(1.0, 0.71, 0.28);
  const vec3 CYAN = vec3(0.27, 0.83, 0.90);

  float box(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = box(p, vec2(0.72), 0.16);
    float pane = smoothstep(0.015, -0.015, d);
    float sill = smoothstep(0.07, 0.0, abs(d - 0.035));
    float kind = vLook.x;
    float crew = step(0.5, kind) * step(kind, 2.5);

    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    vec3 key = normalize(vec3(0.42, 0.78, 0.46));
    vec3 h = normalize(key + v);
    float diff = max(dot(n, key), 0.0);
    float hemi = n.y * 0.5 + 0.5;
    vec3 ambient = mix(vec3(0.20, 0.23, 0.31), vec3(0.50, 0.57, 0.72), hemi);

    // The wall: weathered brick from Magestican Artist when it has loaded, flat night until then.
    vec3 wall = vec3(0.33, 0.39, 0.52);
    if (uHasWall > 0.5) {
      vec3 axisUv = abs(n);
      vec2 wuv = axisUv.x > 0.5 ? vBlock.zy : axisUv.y > 0.5 ? vBlock.xz : vBlock.xy;
      wall *= 0.62 + 0.76 * texture2D(uWall, wuv * 0.5).rgb;
    }
    vec3 glass = mix(vec3(0.055, 0.075, 0.125), vec3(0.11, 0.15, 0.24), vUv.y);
    // A wet window catches the sky along its top edge.
    glass += vec3(0.05, 0.07, 0.10) * smoothstep(0.35, 0.95, vUv.y + (1.0 - vUv.x) * 0.25);
    vec3 surface = mix(wall, glass, pane);
    vec3 emit = vec3(0.0);

    if (crew > 0.5) {
      vec3 c = kind < 1.5 ? AMBER : CYAN;
      float core = 1.0 - smoothstep(0.0, 1.25, length(p * vec2(0.9, 1.0)));
      vec3 lit = mix(c * 0.78, mix(c, vec3(1.0, 0.97, 0.88), 0.5), core);
      surface = mix(c * 0.34 * (wall / 0.45), lit, pane);
      emit = lit * pane * 0.78 + c * 0.10;
      // Colour never carries an owner alone: cyan also has an inner ring, as its flat tile has.
      if (kind > 1.5) {
        float ring = smoothstep(0.05, 0.0, abs(length(p) - 0.62));
        emit *= 1.0 - ring * 0.42;
        surface *= 1.0 - ring * 0.42;
      }
    } else if (kind > 2.5) {
      // Switched off in Last Call: a known room anyone may reclaim, pale and unowned.
      vec3 off = vec3(0.62, 0.58, 0.46);
      surface = mix(wall * 0.8, off, pane);
      emit = off * pane * 0.16;
    }

    // The reveal: the crews' colours give way to what the model always was.
    if (vReveal > 0.0) {
      float frame = mix(1.0, 0.86, 1.0 - pane);
      vec3 trueLit = vTrue * frame;
      surface = mix(surface, trueLit, vReveal);
      emit = mix(emit, vTrue * 0.42, vReveal);
    }

    vec3 col = surface * (ambient + diff * vec3(0.72, 0.76, 0.88));
    col += vBleed * (1.0 - vReveal) * (crew > 0.5 ? 0.0 : 0.55) * (0.45 + 0.55 * (1.0 - pane));
    col += emit;
    col += sill * (0.03 + 0.05 * hemi) * (1.0 - vReveal);
    float spec = pow(max(dot(n, h), 0.0), 42.0);
    col += spec * mix(vec3(0.20, 0.24, 0.32), vec3(0.36), vReveal);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    col += rim * vec3(0.05, 0.08, 0.14);

    // Rooms further back sink into the night, which is most of what says "deep".
    float depth = clamp((length(vView) - uDepthNear) / (uDepthFar - uDepthNear), 0.0, 1.0);
    col *= mix(1.0, 0.62, depth * (1.0 - crew * 0.6));

    if (uFrozen > 0.0 && crew < 0.5) {
      float g = dot(col, vec3(0.3, 0.59, 0.11));
      col = mix(col, vec3(g) * vec3(0.72, 0.8, 0.95) * 0.82, uFrozen);
    }

    // After the light, so no glow can wash a clue out. Dark rooms wear cream, lit rooms wear ink.
    float tile = vClue;
    if (tile > 0.5 && vTone < 1.5 && uMirror < 0.5) {
      float row = floor(tile / uAtlasSize.x);
      float column = tile - row * uAtlasSize.x;
      vec2 glyphUv = (clamp(vUv, 0.0, 1.0) + vec2(column, uAtlasSize.y - 1.0 - row)) / uAtlasSize;
      float a = texture2D(uAtlas, glyphUv).a * (1.0 - vReveal) * (1.0 - uVeil);
      vec3 ink = crew > 0.5 ? (kind < 1.5 ? vec3(0.17, 0.10, 0.0) : vec3(0.0, 0.14, 0.18)) : vec3(0.97, 0.93, 0.84);
      if (vTone > 0.5 && crew < 0.5) {
        ink = mix(vec3(1.0, 0.83, 0.42), vec3(1.0, 0.95, 0.72), 0.5 + 0.5 * sin(uTime * 3.4));
      }
      col = mix(col, ink, a);
    }

    // A chalk cross: a private note, drawn over the clue so a marked room reads as set aside.
    if (vLook.y > 0.5 && vReveal < 0.5) {
      float x = min(abs(p.x - p.y), abs(p.x + p.y));
      float chalk = smoothstep(0.11, 0.06, x) * step(max(abs(p.x), abs(p.y)), 0.62);
      col = mix(col * 0.72, vec3(0.86, 0.90, 0.98), chalk * 0.82);
    }

    // Focus: 1 for the room aimed at, 0.4 for the rooms on its lines.
    if (vLook.z > 0.0) {
      float outline = smoothstep(0.22, 0.04, abs(max(abs(p.x), abs(p.y)) - 0.9));
      col += vec3(0.92, 0.96, 1.0) * outline * vLook.z * 0.62;
      col += vec3(0.05, 0.06, 0.08) * vLook.z;
    }

    col += vLook.w * vec3(0.9, 0.9, 0.82);
    col *= 1.0 - uBlack;

    float alpha = 1.0;
    if (uMirror > 0.5) {
      // Under the roof: fades with depth, and darker than what it mirrors, as a wet surface does.
      float below = clamp((uGround - vFloorY) / 2.6, 0.0, 1.0);
      alpha = (1.0 - below) * 0.5;
      col *= 0.72;
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

const HALO_VERT = `
  varying vec2 vP;
  varying vec3 vC;
  void main() {
    vP = position.xy * 2.0;
    vC = instanceColor;
    vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    c.xy += position.xy * 2.5;
    gl_Position = projectionMatrix * c;
  }
`;

const HALO_FRAG = `
  varying vec2 vP;
  varying vec3 vC;
  uniform float uBlack;
  void main() {
    float f = 1.0 - clamp(length(vP), 0.0, 1.0);
    gl_FragColor = vec4(vC * f * f * 0.22 * (1.0 - uBlack), 1.0);
  }
`;

const ROOF_VERT = `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ROOF_FRAG = `
  varying vec2 vP;
  uniform float uHalf;
  uniform float uBlack;
  void main() {
    vec2 q = abs(vP) - uHalf;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    float fade = 1.0 - smoothstep(0.0, uHalf * 0.55, d);
    float seam = smoothstep(0.03, 0.0, abs(fract(vP.x + 0.5) - 0.5)) + smoothstep(0.03, 0.0, abs(fract(vP.y + 0.5) - 0.5));
    vec3 col = vec3(0.045, 0.065, 0.11) + vec3(0.02, 0.028, 0.04) * seam;
    gl_FragColor = vec4(col * (1.0 - uBlack), 0.74 * fade);
  }
`;

const RAIN_VERT = `
  attribute vec3 aSeed;
  attribute float aEnd;
  uniform float uTime;
  uniform float uSpan;
  varying float vEnd;
  void main() {
    float speed = 0.7 + aSeed.z * 0.5;
    float y = uSpan - mod(uTime * uSpan * speed + aSeed.y * uSpan * 2.0, uSpan * 2.0);
    vec3 p = vec3((aSeed.x - 0.5) * uSpan * 2.2 + aEnd * 0.06, y - aEnd * (0.5 + aSeed.z * 0.4), (aSeed.z - 0.5) * uSpan * 1.4);
    vEnd = aEnd;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const RAIN_FRAG = `
  varying float vEnd;
  uniform float uAlpha;
  void main() {
    gl_FragColor = vec4(vec3(0.72, 0.82, 0.96), uAlpha * (1.0 - vEnd * 0.7));
  }
`;

function rainMesh(span) {
  const n = 110;
  const seeds = new Float32Array(n * 6);
  const ends = new Float32Array(n * 2);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < n; i += 1) {
    const [a, b, c] = [rnd(), rnd(), rnd()];
    seeds.set([a, b, c, a, b, c], i * 6);
    ends.set([0, 1], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: RAIN_VERT,
    fragmentShader: RAIN_FRAG,
    uniforms: { uTime: { value: 0 }, uSpan: { value: span }, uAlpha: { value: 0.1 } },
    transparent: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(g, m);
  lines.frustumCulled = false;
  lines.renderOrder = 5;
  return lines;
}





export function createBlockScene(host, { model, wallUrl = null, on = {} }) {
  const dims = [model.floors[0][0].length, model.floors.length, model.floors[0].length];
  const count = dims[0] * dims[1] * dims[2];
  const letters = lettersOf(model);
  const ground = -dims[1] / 2;
  const radius = Math.hypot(...dims) / 2;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = 'll-canvas';
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 1, 200);
  const block = new THREE.Group();
  scene.add(block);

  const geometry = roomGeometry();
  const attr = (name, size) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(count * size), size);
    a.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, a);
    return a;
  };
  const aClue = attr('aClue', 3);
  const aTone = attr('aTone', 3);
  const aLook = attr('aLook', 4);
  const aTrue = attr('aTrue', 3);
  const aBleed = attr('aBleed', 3);
  const aReveal = attr('aReveal', 1);

  const trueColour = new THREE.Color();
  letters.forEach((ch, i) => {
    trueColour.set(ch === '.' ? 0x000000 : (model.colours[ch] ?? 0xffffff));
    aTrue.setXYZ(i, trueColour.r, trueColour.g, trueColour.b);
  });

  const shared = {
    uAtlas: { value: clueAtlas() },
    uWall: { value: null },
    uHasWall: { value: 0 },
    uAtlasSize: { value: new THREE.Vector2(ATLAS_COLS, ATLAS_ROWS) },
    uTime: { value: 0 },
    uFrozen: { value: 0 },
    uBlack: { value: 0 },
    uGround: { value: ground },
    uDepthNear: { value: 1 },
    uDepthFar: { value: 2 },
    uVeil: { value: 0 },
  };
  const roomMaterial = new THREE.ShaderMaterial({
    vertexShader: ROOM_VERT, fragmentShader: ROOM_FRAG, uniforms: { ...shared, uMirror: { value: 0 } },
  });
  const rooms = new THREE.InstancedMesh(geometry, roomMaterial, count);
  rooms.frustumCulled = false;
  block.add(rooms);

  
  const mirrorMaterial = new THREE.ShaderMaterial({
    vertexShader: ROOM_VERT,
    fragmentShader: ROOM_FRAG,
    uniforms: { ...shared, uMirror: { value: 1 } },
    transparent: true,
  });
  const mirror = new THREE.InstancedMesh(geometry, mirrorMaterial, count);
  mirror.instanceMatrix = rooms.instanceMatrix;
  mirror.frustumCulled = false;
  mirror.scale.y = -1;
  mirror.position.y = ground * 2;
  mirror.renderOrder = 1;
  block.add(mirror);

  const roofSide = Math.max(dims[0], dims[2]) * 2.6 + 4;
  const roof = new THREE.Mesh(
    new THREE.PlaneGeometry(roofSide, roofSide),
    new THREE.ShaderMaterial({
      vertexShader: ROOF_VERT,
      fragmentShader: ROOF_FRAG,
      uniforms: { uHalf: { value: Math.max(dims[0], dims[2]) / 2 + 0.7 }, uBlack: shared.uBlack },
      transparent: true,
      depthWrite: false,
    }),
  );
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = ground - 0.02;
  roof.renderOrder = 2;
  block.add(roof);

  const halo = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      uniforms: { uBlack: shared.uBlack },
      transparent: true,
      depthWrite: false,
      
      
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    }),
    count,
  );
  halo.setColorAt(0, CREW[0]);
  halo.instanceColor.setUsage(THREE.DynamicDrawUsage);
  halo.count = 0;
  halo.frustumCulled = false;
  halo.renderOrder = 3;
  block.add(halo);

  const rain = reducedMotion() ? null : rainMesh(radius * 2.4 + 4);
  if (rain) scene.add(rain);

  if (wallUrl) {
    new THREE.TextureLoader().load(wallUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      shared.uWall.value = tex;
      shared.uHasWall.value = 1;
      dirty = true;
    }, undefined, () => {  });
  }

  
  let view = null;
  let faces = null;
  let cut = NO_CUT;
  let marks = new Set();
  let pending = new Map();
  let aim = -1;
  let hover = -1;
  let cursor = -1;
  let yaw = YAW_START;
  let pitch = PITCH_START;
  let spinV = 0;
  let width = 1;
  let height = 1;
  let dirty = true;
  let raf = 0;
  let disposed = false;
  let frozenGoal = 0;
  let blackGoal = 0;
  let revealStart = 0;
  let revealFinished = false;
  let revealDone = false;
  let rainGoal = 0.1;
  const anims = new Map();
  const ripples = [];
  const standing = new Uint8Array(count);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const centres = Array.from({ length: count }, (_, i) => roomCentre(dims, roomAt(dims, i)));

  function setRoomMatrix(i, scale, dy = 0, spin = 0) {
    const [x, y, z] = centres[i];
    pos.set(x, y + dy, z);
    scl.setScalar(scale);
    quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, spin);
    matrix.compose(pos, quat, scl);
    rooms.setMatrixAt(i, matrix);
  }

  function refreshFocus() {
    const focus = aim >= 0 ? aim : hover >= 0 ? hover : cursor;
    const onLine = new Set();
    if (focus >= 0 && faces && view) {
      for (let k = 0; k < 3; k += 1) {
        const li = faces[focus * 3 + k];
        if (li >= 0) view.lines[li].cells.forEach((i) => onLine.add(i));
      }
    }
    for (let i = 0; i < count; i += 1) {
      const f = i === focus ? 1 : onLine.has(i) ? 0.2 : 0;
      aLook.setZ(i, f);
    }
    aLook.needsUpdate = true;
    dirty = true;
  }

  function refresh() {
    if (!view) return;
    let lit = 0;
    const pendingOn = pending;
    for (let i = 0; i < count; i += 1) {
      const stands = roomStands(view, i, cut);
      standing[i] = stands ? 1 : 0;
      if (!anims.has(i)) setRoomMatrix(i, stands ? 1 : 0);
      const st = view.state[i];
      const kind = st === CELL.LIT ? view.owner[i] + 1 : st === CELL.OFF ? 3 : 0;
      aLook.setX(i, kind);
      aLook.setY(i, marks.has(i) && st === CELL.DARK ? 1 : 0);
      if (!ripples.length && !pendingOn.has(i)) aLook.setW(i, 0);
      if (pendingOn.has(i)) aLook.setW(i, 0.14);
      for (let k = 0; k < 3; k += 1) {
        const li = faces[i * 3 + k];
        const line = li >= 0 ? view.lines[li] : null;
        const tone = line ? lineTone(view, li) : TONE.CLOSED;
        (k === 0 ? aClue.setX : k === 1 ? aClue.setY : aClue.setZ).call(aClue, i, line ? clueTile(line) : 0);
        (k === 0 ? aTone.setX : k === 1 ? aTone.setY : aTone.setZ).call(aTone, i, tone);
      }
      if (st === CELL.LIT && stands) {
        const [x, y, z] = centres[i];
        pos.set(x, y, z);
        matrix.makeTranslation(pos.x, pos.y, pos.z);
        halo.setMatrixAt(lit, matrix);
        halo.setColorAt(lit, CREW[view.owner[i]]);
        lit += 1;
      }
    }
    halo.count = lit;
    halo.instanceMatrix.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
    refreshBleed();
    aClue.needsUpdate = true;
    aTone.needsUpdate = true;
    aLook.needsUpdate = true;
    rooms.instanceMatrix.needsUpdate = true;
    refreshFocus();
  }

  
  function refreshBleed() {
    const [X, Y, Z] = dims;
    for (let i = 0; i < count; i += 1) {
      const [x, y, z] = roomAt(dims, i);
      let r = 0;
      let g = 0;
      let b = 0;
      const take = (a, c, e) => {
        if (a < 0 || c < 0 || e < 0 || a >= X || c >= Y || e >= Z) return;
        const j = roomIndex(dims, a, c, e);
        if (view.state[j] !== CELL.LIT) return;
        const crew = CREW[view.owner[j]];
        r += crew.r;
        g += crew.g;
        b += crew.b;
      };
      take(x - 1, y, z); take(x + 1, y, z); take(x, y - 1, z); take(x, y + 1, z); take(x, y, z - 1); take(x, y, z + 1);
      const f = 0.16;
      aBleed.setXYZ(i, Math.min(1, r * f), Math.min(1, g * f), Math.min(1, b * f));
    }
    aBleed.needsUpdate = true;
  }

  function fit() {
    const aspect = width / height;
    const halfV = THREE.MathUtils.degToRad(FOV_DEG / 2);
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    
    
    
    
    const snug = halfH < halfV * 0.85 ? 0.92 : 1.05;
    const dist = (radius * snug) / Math.sin(Math.min(halfV, halfH));
    camera.aspect = aspect;
    camera.position.set(0, radius * 0.07, dist);
    camera.lookAt(0, -radius * 0.03, 0);
    camera.near = Math.max(0.5, dist - radius * 3);
    camera.far = dist + radius * 3;
    camera.updateProjectionMatrix();
    shared.uDepthNear.value = dist - radius;
    shared.uDepthFar.value = dist + radius;
    if (rain) rain.material.uniforms.uSpan.value = radius * 2.4 + 4;
    dirty = true;
  }

  
  const pxPerRoom = () => height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2)) * camera.position.z);

  
  const raycastOrigin = new THREE.Vector3();
  const raycastDir = new THREE.Vector3();
  const inverse = new THREE.Matrix4();

  function pickAt(clientX, clientY) {
    if (!view) return null;
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    block.updateMatrixWorld();
    camera.updateMatrixWorld();
    inverse.copy(block.matrixWorld).invert();
    raycastOrigin.setFromMatrixPosition(camera.matrixWorld);
    raycastDir.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(raycastOrigin).normalize();
    raycastOrigin.applyMatrix4(inverse);
    raycastDir.transformDirection(inverse);
    return pickRoom(raycastOrigin.toArray(), raycastDir.toArray(), dims, (i) => standing[i] === 1);
  }

  let press = null;
  function onDown(e) {
    canvas.setPointerCapture?.(e.pointerId);
    spinV = 0;
    press = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, long: false, button: e.button, timer: null };
    if (e.pointerType !== 'mouse') {
      press.timer = setTimeout(() => {
        if (!press || press.moved) return;
        press.long = true;
        const hit = pickAt(press.x, press.y);
        if (hit) on.mark?.(hit.room);
      }, LONG_PRESS_MS);
    }
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) {
      if (e.pointerType === 'mouse' && !press) {
        const hit = pickAt(e.clientX, e.clientY);
        const room = hit ? hit.room : -1;
        if (room !== hover) { hover = room; refreshFocus(); }
      }
      return;
    }
    if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) >= TAP_SLOP_PX) {
      press.moved = true;
      clearTimeout(press.timer);
      hover = -1;
      refreshFocus();
    }
    if (!press.moved) return;
    const dx = e.clientX - press.lastX;
    const dy = e.clientY - press.lastY;
    press.lastX = e.clientX;
    press.lastY = e.clientY;
    yaw += dx * TURN_PER_PX;
    spinV = dx * TURN_PER_PX;
    pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch + dy * TURN_PER_PX));
    dirty = true;
    on.turn?.();
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    clearTimeout(p.timer);
    
    if (p.moved || p.long) return;
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) return;
    if (p.button === 2) on.mark?.(hit.room);
    else if (p.button === 0) on.tap?.(hit.room, p.type);
  }
  function onCancel() {
    if (press) clearTimeout(press.timer);
    press = null;
  }
  function onLeave() {
    if (hover !== -1) { hover = -1; refreshFocus(); }
  }
  const noMenu = (e) => e.preventDefault();
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('contextmenu', noMenu);

  
  function stepAnims(now) {
    let any = false;
    for (const [i, a] of anims) {
      
      const t = Math.max(0, (now - a.start) / a.ms);
      if (t >= 1) {
        anims.delete(i);
        setRoomMatrix(i, standing[i] ? 1 : 0);
        aLook.setW(i, 0);
        any = true;
        continue;
      }
      any = true;
      if (a.kind === 'pop') {
        
        const s = 1 + Math.sin(Math.min(1, t) * Math.PI) * 0.14;
        setRoomMatrix(i, s);
        aLook.setW(i, (1 - t) ** 2 * 0.7);
      } else if (a.kind === 'fall') {
        const e = t * t;
        setRoomMatrix(i, Math.max(0, 1 - e * 0.85), -e * 2.4, e * a.spin);
        aLook.setW(i, 0);
      } else if (a.kind === 'blow') {
        const shake = t < 0.4 ? Math.sin(t * 60) * 0.06 : 0;
        const e = clamp01((t - 0.35) / 0.65);
        setRoomMatrix(i, Math.max(0, 1 - e * e), shake - e * e * 1.6, e * 2);
        aLook.setW(i, (1 - t) * 0.5);
      }
    }
    if (any) {
      rooms.instanceMatrix.needsUpdate = true;
      aLook.needsUpdate = true;
    }
    return any;
  }

  function stepRipples(now) {
    if (!ripples.length) return false;
    for (let k = ripples.length - 1; k >= 0; k -= 1) {
      const { cells, start } = ripples[k];
      const t = (now - start) / CLOSE_RIPPLE_MS;
      if (t >= 1) {
        cells.forEach((i) => { if (!anims.has(i)) aLook.setW(i, 0); });
        ripples.splice(k, 1);
        continue;
      }
      cells.forEach((i, n) => {
        if (anims.has(i)) return;
        const local = clamp01(t * 1.6 - (n / cells.length) * 0.6);
        aLook.setW(i, Math.sin(local * Math.PI) * 0.34);
      });
    }
    aLook.needsUpdate = true;
    return true;
  }

  function stepReveal(now) {
    if (!revealStart || revealDone) return false;
    const elapsed = now - revealStart;
    let all = true;
    for (let i = 0; i < count; i += 1) {
      const floor = roomAt(dims, i)[1];
      const t = reducedMotion() ? 1 : clamp01((elapsed - floor * REVEAL_FLOOR_MS) / REVEAL_FADE_MS);
      if (t < 1) all = false;
      aReveal.setX(i, revealFinished ? easeOut(t) : 0);
    }
    aReveal.needsUpdate = true;
    if (all) revealDone = true;
    return true;
  }

  const approach = (uniform, goal, rate, dt) => {
    const v = uniform.value;
    if (Math.abs(v - goal) < 0.002) {
      if (v !== goal) { uniform.value = goal; return true; }
      return false;
    }
    uniform.value = v + (goal - v) * Math.min(1, dt * rate);
    return true;
  };

  let last = performance.now();
  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !canvas.isConnected || !canvas.offsetParent) return;

    let moving = false;
    if (stepAnims(now)) moving = true;
    if (stepRipples(now)) moving = true;
    if (stepReveal(now)) moving = true;
    if (approach(shared.uFrozen, frozenGoal, 7, dt)) moving = true;
    if (approach(shared.uBlack, blackGoal, 9, dt)) moving = true;
    if (!press && Math.abs(spinV) > 0.0004) {
      yaw += spinV;
      spinV *= 0.9;
      moving = true;
    }
    if (revealStart && !press && !reducedMotion()) {
      yaw += REVEAL_SPIN * dt;
      moving = true;
    }
    if (rain) {
      rain.material.uniforms.uAlpha.value += (rainGoal - rain.material.uniforms.uAlpha.value) * Math.min(1, dt * 2);
      rain.material.uniforms.uTime.value = now / 1000 * 0.55;
      moving = true;
    }
    shared.uTime.value = now / 1000;
    if (!moving && !dirty) return;
    dirty = false;
    block.rotation.set(pitch, yaw, 0, 'XYZ');
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const api = {
    
    update(next, opts = {}) {
      if (next && (!faces || next.lines.length !== view?.lines.length)) faces = faceLinesOf(next);
      view = next;
      if (opts.marks) marks = opts.marks;
      if (opts.pending) pending = opts.pending;
      if (opts.cut) cut = opts.cut;
      if (opts.aim !== undefined) aim = opts.aim;
      if (opts.cursor !== undefined) cursor = opts.cursor;
      frozenGoal = opts.frozen ? 1 : 0;
      shared.uVeil.value = opts.veiled ? 1 : 0;
      refresh();
      dirty = true;
    },
    
    announce(diff) {
      const now = performance.now();
      const calm = reducedMotion();
      if (!calm) {
        diff.lit.forEach(({ cell }) => anims.set(cell, { kind: 'pop', start: now, ms: POP_MS }));
        diff.fused.forEach((cell) => anims.set(cell, { kind: 'blow', start: now, ms: BLOW_MS }));
        diff.shut.forEach((cell, n) => anims.set(cell, { kind: 'fall', start: now + n * 18, ms: FALL_MS, spin: (cell % 2 ? 1 : -1) * 1.1 }));
        diff.closedLines.forEach((li) => ripples.push({ cells: [...view.lines[li].cells], start: now }));
      }
      dirty = true;
    },
    resize(w, h) {
      width = Math.max(1, Math.round(w));
      height = Math.max(1, Math.round(h));
      renderer.setSize(width, height, false);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      fit();
    },
    moveTo(nextHost) {
      nextHost.append(canvas);
      dirty = true;
    },
    pxPerRoom,
    blackout(on_ = true) {
      blackGoal = on_ ? 1 : 0;
    },
    
    reveal({ finished }) {
      revealFinished = finished;
      revealStart = performance.now();
      revealDone = false;
      blackGoal = 0;
      rainGoal = 0.34;
      aim = -1;
      hover = -1;
      
      cursor = -1;
      refreshFocus();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('contextmenu', noMenu);
      geometry.dispose();
      shared.uAtlas.value.dispose();
      shared.uWall.value?.dispose();
      roomMaterial.dispose();
      mirrorMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    },
    
    roomOnScreen(room) {
      const v = new THREE.Vector3(...centres[room]);
      block.rotation.set(pitch, yaw, 0, 'XYZ');
      block.updateMatrixWorld();
      camera.updateMatrixWorld();
      v.applyMatrix4(block.matrixWorld).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    pickAt,
    turnTo(y, p) {
      yaw = y;
      pitch = p;
      spinV = 0;
      dirty = true;
    },
    turn: () => ({ yaw, pitch }),
    focused: () => (aim >= 0 ? aim : hover >= 0 ? hover : cursor),
    stands: (i) => standing[i] === 1,
  };
  return api;
}
