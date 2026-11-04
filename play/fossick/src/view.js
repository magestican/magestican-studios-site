






import * as THREE from 'three';
import { TREASURE, ROCK, MATERIALS, FATIGUE_FROM } from './structure.js';

const PAPER = '#efe4c8';
const INK = '#2b1c10';
const LIGHT = new THREE.Vector3(-0.55, 0.82, 0.5).normalize();
const SCALE = 0.985;      
const OUTLINE = 0.055;    
const FOV = 26;
const TILT = 0.26;        
const MAX_DUST = 420;
const STRESS_HZ = 7;      

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const NOISE = `
  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 hash22(vec2 p) { float h = hash21(p); return vec2(h, hash21(p + h + 17.1)); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
  }
  // Lines whose width carries the tone. cover 0 = no ink, 1 = solid. When the lines would be finer than the
  // pixels they fade into the flat tone they stand for, which is what keeps a far block free of moire.
  float hatch(vec2 uv, float angle, float freq, float cover, float wobble) {
    if (cover <= 0.001) return 0.0;
    float c = cos(angle), s = sin(angle);
    float l = (uv.x * c + uv.y * s) * freq + wobble * (vnoise(uv * 2.7 + angle * 7.0) - 0.5);
    float fw = fwidth(l);
    float d = abs(fract(l) - 0.5) * 2.0;
    float line = 1.0 - smoothstep(cover - fw * 2.0, cover + fw * 2.0, d);
    return mix(line, cover, smoothstep(0.32, 0.6, fw));
  }
  // Distance from the cell walls of a jittered grid: jagged, joined lines, which is what a crack looks like.
  float cellEdge(vec2 p) {
    vec2 g = floor(p), f = fract(p);
    float f1 = 9.0, f2 = 9.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 r = o + hash22(g + o) - f;
      float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
    return sqrt(f2) - sqrt(f1);
  }
`;

const SHADOW_FN = `
  uniform highp sampler2D uShadow;
  uniform float uShadowTexel;
  float shadowAt(vec4 sc, float bias) {
    vec3 p = sc.xyz / sc.w;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
    float s = 0.0;
    for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++) {
      vec2 o = (vec2(float(x), float(y)) - 0.5) * uShadowTexel * 1.5;
      // textureLod: no gradient is needed from a depth map, and one inside a loop is a compiler warning on ANGLE.
      s += step(p.z - bias, textureLod(uShadow, p.xy + o, 0.0).r);
    }
    return s * 0.25;
  }
`;

const CUBE_VERT = `
  attribute vec3 aCell;
  attribute float aKind;
  attribute float aTone;
  attribute float aMat;
  attribute float aFox;
  attribute vec3 aClue;
  attribute vec3 aStress;
  attribute vec2 aFlags;
  uniform mat4 uShadowMat;
  uniform int uHover;
  varying vec3 vLocal, vNormalO, vBlock, vWorld, vNormalW, vClue, vStress;
  varying vec4 vShadow;
  varying float vKind, vTone, vMat, vFox, vLoose, vReveal, vHover;
  void main() {
    vTone = aTone;
    vLocal = position; vNormalO = normal; vBlock = aCell + position;
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vNormalW = mat3(instanceMatrix) * normal;
    vShadow = uShadowMat * w;
    vKind = aKind; vMat = aMat; vFox = aFox; vClue = aClue; vStress = aStress;
    vLoose = aFlags.x; vReveal = aFlags.y;
    vHover = gl_InstanceID == uHover ? 1.0 : 0.0;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const CUBE_FRAG = `
  precision highp float;
  precision highp sampler3D;
  uniform sampler3D uOcc;
  uniform sampler2D uDigits;
  uniform vec3 uDims, uLight, uInk, uPigment, uAccent, uEye;
  uniform float uSurvey;
  varying vec3 vLocal, vNormalO, vBlock, vWorld, vNormalW, vClue, vStress;
  varying vec4 vShadow;
  varying float vKind, vTone, vMat, vFox, vLoose, vReveal, vHover;
  ${NOISE}
  ${SHADOW_FN}
  // Outside the block is empty air. Clamp-to-edge alone would read the outer cubes as neighbours of themselves,
  // which darkened every outer face of the first render to a grey cross-hatch, chalk included.
  float occ(vec3 p) {
    vec3 t = (p + 0.5) / uDims;
    if (t.x < 0.0 || t.y < 0.0 || t.z < 0.0 || t.x > 1.0 || t.y > 1.0 || t.z > 1.0) return 0.0;
    return texture(uOcc, t).r;
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 NO = vNormalO, an = abs(NO);
    bool isX = an.x > 0.5, isY = an.y > 0.5;
    vec2 uv = isX ? vBlock.zy : (isY ? vBlock.xz : vBlock.xy);
    vec2 f = isX ? vLocal.zy : (isY ? vLocal.xz : vLocal.xy);
    float edge = 0.5 - max(abs(f.x), abs(f.y));

    // TONE. Lambert, then what surrounds this face, then the cast shadow.
    float lam = max(dot(N, uLight), 0.0);
    float ao = 1.0;
    if (vLoose < 0.5) {
      vec3 T = isX ? vec3(0, 1, 0) : vec3(1, 0, 0), B = cross(NO, T);
      vec3 q = vBlock + NO * 0.62;
      ao = 1.0 - 0.62 * 0.25 * (occ(q + T * 0.5) + occ(q - T * 0.5) + occ(q + B * 0.5) + occ(q - B * 0.5));
    }
    float bias = 0.0025 + 0.004 * (1.0 - lam);
    float shade = shadowAt(vShadow, bias);
    float tone = (0.34 + 0.66 * lam) * ao * mix(0.52, 1.0, shade);

    vec3 base;
    float ink = 0.0;
    bool pigment = vKind > 0.5 && (uSurvey < 0.5 || vReveal > 0.5);

    if (pigment) {
      // TREASURE: a watercolour wash. The colourist's pigment mottles, pools darker where the wash met the
      // edge, and leaves the paper showing on the side the light comes from.
      float mott = vnoise(uv * 2.3 + 3.1) * 0.6 + vnoise(uv * 6.1) * 0.4;
      vec3 wash = vTone < 0.5 ? uPigment : vTone < 1.5 ? uAccent : uEye;
      base = mix(wash * 1.12, wash * 0.74, mott);
      base = mix(base, wash * 0.52, 1.0 - smoothstep(0.0, 0.17, edge + (mott - 0.5) * 0.04));
      float hi = smoothstep(0.34, 0.5, dot(f, normalize(vec2(-1.0, 1.0))) + (mott - 0.5) * 0.25) * lam;
      base = mix(base, vec3(0.97, 0.93, 0.82), hi * 0.62);
      base *= mix(0.68, 1.06, tone);
      // Sepia only where it is dark, so the colour is the first thing the eye reads (GD-007).
      float cover = clamp((0.62 - tone) * 0.75, 0.0, 0.42);
      ink = hatch(uv, 0.9, 7.0, cover, 0.6) * 0.5;
    } else {
      // ROCK as a geologic map pattern, in block coordinates, so the strata run on across cubes and hardness
      // reads with no colour at all (GD-007, GD-074).
      float pat = 0.0;
      // Where shading hatch starts. Chalk must stay pale in the light: at 0.86 for every rock, its lit face carried
      // as much line as slate, and the pattern that tells the rocks apart was lost under the shading.
      float shadeFrom = vMat < 0.5 ? 0.6 : (vMat < 1.5 ? 0.68 : (vMat < 2.5 ? 0.72 : 0.64));
      if (vMat < 0.5) {            // chalk: sparse stipple
        base = vec3(0.955, 0.925, 0.84);
        vec2 p = uv * 5.5, g = floor(p);
        float r = hash21(g + 3.3);
        float d = length(fract(p) - 0.25 - hash22(g) * 0.5);
        float aa = fwidth(p.x) * 1.2;
        pat = (r > 0.55 ? 1.0 - smoothstep(0.15 - aa, 0.15 + aa, d) : 0.0) * 0.72;
      } else if (vMat < 1.5) {     // limestone: horizontal bedding with brick ticks
        base = vec3(0.86, 0.80, 0.63);
        float y = vBlock.y * 3.0;
        float course = floor(y);
        float aa = fwidth(y) * 1.2;
        float bed = 1.0 - smoothstep(0.05, 0.05 + aa + 0.03, abs(fract(y) - 0.5));
        float u = (isX ? vBlock.z : vBlock.x) * 1.5 + course * 0.5;
        float tick = isY ? 0.0 : (1.0 - smoothstep(0.03, 0.03 + fwidth(u) * 1.2, abs(fract(u) - 0.5)));
        pat = isY ? hatch(uv, 0.0, 3.0, 0.12, 0.3) * 0.7 : max(bed, tick) * 0.8;
      } else if (vMat < 2.5) {     // flint: dense dark knots
        base = vec3(0.62, 0.60, 0.56);
        float e = cellEdge(uv * 3.6 + 9.0);
        float blob = smoothstep(0.1, 0.34, e + (vnoise(uv * 9.0) - 0.5) * 0.14);
        pat = blob * 0.82;
      } else {                     // slate: diagonal cleavage
        base = vec3(0.64, 0.68, 0.70);
        float c = (vBlock.x + vBlock.y * 1.6 + vBlock.z * 0.7) * 3.6 + (vnoise(uv * 2.2) - 0.5) * 0.5;
        float aa = fwidth(c) * 1.2;
        pat = (1.0 - smoothstep(0.08, 0.08 + aa + 0.04, abs(fract(c) - 0.5))) * 0.72;
      }

      // Foxing: a faint stain of the pigment, on rock close to the specimen. A warning, before any colour shows.
      if (vFox > 0.0) {
        float sp = smoothstep(0.34, 0.74, vnoise(uv * 3.4 + 21.0) * 0.55 + vnoise(uv * 11.0) * 0.45);
        base = mix(base, uPigment, vFox * (0.2 + 0.32 * sp));
      }
      base *= mix(0.8, 1.02, tone);

      // Survey: this face counts the treasure cubes along its line. Digit from a generated atlas.
      float clear = 1.0;
      if (uSurvey > 0.5) {
        float count = isX ? vClue.x : (isY ? vClue.y : vClue.z);
        vec2 d = isX ? vec2(-NO.x * vLocal.z, vLocal.y) : (isY ? vec2(vLocal.x, -NO.y * vLocal.z) : vec2(NO.z * vLocal.x, vLocal.y));
        vec2 at = clamp(d * 1.24 + 0.5, 0.0, 1.0);
        float digit = texture2D(uDigits, vec2((floor(count + 0.5) + at.x) / 10.0, at.y)).r;
        float halo = 1.0 - smoothstep(0.28, 0.4, length(d));
        clear = 1.0 - halo * 0.92;
        ink = max(ink, digit * (count < 0.5 ? 0.55 : 1.0));
      }
      float cover = clamp((shadeFrom - tone) * 0.62, 0.0, 0.62);
      float h = hatch(uv, 0.78, 7.5, cover, 0.7);
      if (tone < shadeFrom - 0.3) h = max(h, hatch(uv, -0.78, 7.5, (shadeFrom - 0.3 - tone) * 0.8, 0.7));
      if (tone < 0.33) h = max(h, hatch(uv, 0.0, 9.0, (0.33 - tone) * 1.3, 0.7));
      ink = max(ink, max(pat, h * 0.85) * clear);
    }

    // CRACKS: jagged ink, more of it as the bond tires. Blows and fatigue both draw here.
    if (vStress.x > 0.02) {
      float e = cellEdge(uv * 3.1 + vBlock.yz * 0.4);
      float reach = step(vnoise(uv * 1.7 + 5.0), vStress.x * 1.5 + 0.1);
      float aa = fwidth(uv.x) * 3.1 * 1.3;
      ink = max(ink, (1.0 - smoothstep(0.015, 0.04 + aa, e)) * reach);
    }
    // A chipped cube carries the marks of the blows it has already taken.
    if (vStress.z > 0.02) {
      float e = cellEdge(f * 6.0 + 3.0);
      float near = 1.0 - smoothstep(0.1, 0.13 + 0.26 * vStress.z, length(f));
      ink = max(ink, (1.0 - smoothstep(0.04, 0.16, e)) * near);
    }
    vec3 col = mix(base, uInk, ink);

    // STRAIN: red ticks over a tiring bond. The one read of the load on the rock itself.
    if (vStress.y > ${FATIGUE_FROM.toFixed(3)}) {
      float s = clamp((vStress.y - ${FATIGUE_FROM.toFixed(3)}) / ${(1 - FATIGUE_FROM).toFixed(3)}, 0.0, 1.0);
      float r = hatch(uv, 2.2, 10.0, 0.26 + 0.42 * s, 0.9);
      col = mix(col, vec3(0.72, 0.09, 0.07), r * 0.92);
    }

    // The cube's own outline, in slightly wandering ink.
    float aa = fwidth(edge);
    float wob = (vnoise(uv * 5.3) - 0.5) * 0.016;
    float w = max(0.017, aa * 0.75);
    float line = 1.0 - smoothstep(w, w + aa * 1.2, edge + wob);
    col = mix(col, uInk, line * 0.92);

    if (vHover > 0.5) {
      float w2 = max(0.05, aa * 1.5);
      float l2 = 1.0 - smoothstep(w2, w2 + aa * 1.2, edge);
      col = vKind > 0.5 ? mix(col, vec3(0.72, 0.09, 0.07), l2) : mix(mix(col, vec3(0.99, 0.96, 0.86), 0.28), uInk, l2);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;


const OUTLINE_VERT = `
  uniform float uGrow;
  void main() { gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position * (1.0 + uGrow), 1.0); }
`;
const OUTLINE_FRAG = `
  uniform vec3 uInk;
  void main() { gl_FragColor = vec4(uInk, 1.0); }
`;



const GHOST_VERT = `
  attribute float aKind;
  varying vec3 vLocal, vNormalO;
  void main() {
    vLocal = position; vNormalO = normal;
    gl_Position = aKind > 0.5 ? projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  }
`;
const GHOST_FRAG = `
  uniform vec3 uPigment;
  uniform float uStrength;
  varying vec3 vLocal, vNormalO;
  void main() {
    vec3 an = abs(vNormalO);
    vec2 f = an.x > 0.5 ? vLocal.zy : (an.y > 0.5 ? vLocal.xz : vLocal.xy);
    float edge = 0.5 - max(abs(f.x), abs(f.y));
    float a = 0.1 + 0.3 * (1.0 - smoothstep(0.02, 0.07, edge));
    gl_FragColor = vec4(uPigment, a * uStrength);
  }
`;

const DEPTH_VERT = `
  void main() {
    #ifdef USE_INSTANCING
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
    #else
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    #endif
  }
`;


const BENCH_VERT = `
  uniform mat4 uShadowMat;
  varying vec3 vWorld;
  varying vec4 vShadow;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz; vShadow = uShadowMat * w;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const BENCH_FRAG = `
  precision highp float;
  uniform vec3 uInk;
  uniform float uReach;
  varying vec3 vWorld;
  varying vec4 vShadow;
  ${NOISE}
  ${SHADOW_FN}
  void main() {
    float s = 1.0 - shadowAt(vShadow, 0.002);
    float r = length(vWorld.xz) / uReach;
    float fade = 1.0 - smoothstep(0.55, 1.0, r);
    float pool = (1.0 - smoothstep(0.0, 0.62, r)) * 0.07;
    // Fine and nearly straight: at 2.4 lines a unit with a wobble of 0.9 the shadow read as cobbles, not as hatching.
    float h = hatch(vWorld.xz, 0.7, 5.0, 0.42, 0.22);
    float h2 = hatch(vWorld.xz, -0.7, 5.0, 0.24, 0.22);
    float a = max(max(h, h2) * s * 0.58, s * 0.14 + pool) * fade;
    gl_FragColor = vec4(uInk, a);
  }
`;


const BRASS_VERT = `
  varying vec3 vN, vV, vW;
  varying vec2 vU;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vN = mat3(modelMatrix) * normal; vV = cameraPosition - w.xyz; vU = uv; vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const BRASS_FRAG = `
  precision highp float;
  uniform vec3 uInk, uLight, uBrass;
  uniform float uTicks, uRockR;
  varying vec3 vN, vV, vW;
  varying vec2 vU;
  ${NOISE}
  void main() {
    vec3 N = normalize(vN), V = normalize(vV);
    float lam = max(dot(N, uLight), 0.0);
    float rim = dot(N, V);
    float tone = 0.3 + 0.7 * lam;
    vec3 col = uBrass * mix(0.62, 1.1, tone);
    col = mix(col, vec3(0.98, 0.93, 0.74), smoothstep(0.86, 0.97, dot(N, normalize(uLight + V))) * 0.8);
    // Lines running along the tube. Across it, with a wobble, they made blotchy tiger stripes on the first render.
    float c = clamp((0.62 - tone) * 0.7, 0.0, 0.5);
    float l = hatch(vec2(vU.y * 8.0, 0.0), 0.0, 1.0, c, 0.0);
    if (uTicks > 0.0) {
      float t = fract(vU.x * uTicks);
      float aa = fwidth(vU.x * uTicks);
      float mark = 1.0 - smoothstep(0.03, 0.03 + aa * 1.3, abs(t - 0.5));
      l = max(l, mark * step(0.25, abs(vU.y - 0.5)) * 0.9);
    }
    col = mix(col, uInk, max(l, 1.0 - smoothstep(0.2, 0.38, rim)));
    // Brass in front of the rock goes faint. Rings ignore picking, so a solid ring would hide cubes a tap still
    // reaches, and the middle rings cross the very centre of the block at rest.
    float across = length(cross(vW, V));
    float over = (1.0 - smoothstep(uRockR, uRockR + 0.6, across)) * step(0.0, dot(vW, V));
    gl_FragColor = vec4(col, mix(1.0, 0.16, over));
  }
`;

const DUST_VERT = `
  attribute float aSize;
  attribute float aLife;
  varying float vLife;
  uniform float uPx;
  void main() {
    vLife = aLife;
    vec4 mv = viewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aLife > 0.0 ? uPx * aSize / -mv.z : 0.0;
  }
`;
const DUST_FRAG = `
  uniform vec3 uInk;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.32, 0.5, d)) * min(1.0, vLife * 2.5);
    if (a < 0.02) discard;
    gl_FragColor = vec4(uInk, a * 0.85);
  }
`;

export class PlateView {
  constructor(canvas) {
    this.canvas = canvas;
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    r.setClearColor(0x000000, 0);
    this.renderer = r;
    this.coarse = matchMedia('(pointer: coarse)').matches;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 400);
    this.zoom = 1;
    this.zoomGoal = 1;
    this.knock = 0;
    this.fit = null;    
    this.fitGoal = { x: 0, y: 0, w: 1, h: 1 };
    this.shadowSize = this.coarse ? 1024 : 2048;
    this.shadowTarget = new THREE.WebGLRenderTarget(this.shadowSize, this.shadowSize, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      depthTexture: new THREE.DepthTexture(this.shadowSize, this.shadowSize, THREE.UnsignedIntType),
    });
    this.shadowCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
    this.shadowMat = new THREE.Matrix4();
    this.depthMaterial = new THREE.ShaderMaterial({ vertexShader: DEPTH_VERT, fragmentShader: 'void main(){gl_FragColor=vec4(1.0);}', side: THREE.DoubleSide });
    this.digits = this.makeDigits();
    this.shared = {
      uShadow: { value: this.shadowTarget.depthTexture },
      uShadowTexel: { value: 1 / this.shadowSize },
      uShadowMat: { value: this.shadowMat },
      uInk: { value: rgb(INK) },
      uLight: { value: LIGHT.clone() },
    };
    this.makeDust();
    this.lastStress = 0;
    this.time = 0;
    this.game = null;
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  makeDigits() {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 640, 64);
    g.fillStyle = '#fff';
    g.font = '52px "IM Fell English", Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let d = 0; d < 10; d++) g.fillText(String(d), d * 64 + 32, 34);
    const t = new THREE.CanvasTexture(c);
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }

  makeDust() {
    const g = new THREE.BufferGeometry();
    this.dust = { pos: new Float32Array(MAX_DUST * 3), vel: new Float32Array(MAX_DUST * 3), size: new Float32Array(MAX_DUST), life: new Float32Array(MAX_DUST), at: 0 };
    g.setAttribute('position', new THREE.BufferAttribute(this.dust.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.dust.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aLife', new THREE.BufferAttribute(this.dust.life, 1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, uniforms: { uInk: this.shared.uInk, uPx: { value: 300 } } });
    this.dustPoints = new THREE.Points(g, m);
    this.dustPoints.frustumCulled = false;
    this.dustPoints.renderOrder = 5;
    this.scene.add(this.dustPoints);
  }

  
  setGame(game) {
    this.clearGame();
    this.game = game;
    const b = game.block, n = b.n;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const tones = new Float32Array(n);
    const cell = new Float32Array(n * 3), kind = new Float32Array(n), mat = new Float32Array(n), fox = new Float32Array(n), clue = new Float32Array(n * 3);
    const survey = !!game.level.survey;
    const near = this.treasureDistance();
    for (let i = 0; i < n; i++) {
      const [x, y, z] = b.xyz(i);
      cell[i * 3] = x; cell[i * 3 + 1] = y; cell[i * 3 + 2] = z;
      kind[i] = game.original[i] === TREASURE ? 1 : 0;
      tones[i] = kind[i] ? game.spec.cells(x, y, z).tone || 0 : 0;
      mat[i] = game.originalMat[i];
      fox[i] = survey || kind[i] ? 0 : near[i] === 1 ? 0.8 : near[i] === 2 ? 0.28 : 0;
      if (survey) { clue[i * 3] = b.countAlong(x, y, z, 0); clue[i * 3 + 1] = b.countAlong(x, y, z, 1); clue[i * 3 + 2] = b.countAlong(x, y, z, 2); }
    }
    const inst = (a, k) => new THREE.InstancedBufferAttribute(a, k);
    geo.setAttribute('aCell', inst(cell, 3));
    geo.setAttribute('aKind', inst(kind, 1));
    geo.setAttribute('aTone', inst(tones, 1));
    geo.setAttribute('aMat', inst(mat, 1));
    geo.setAttribute('aFox', inst(fox, 1));
    geo.setAttribute('aClue', inst(clue, 3));
    this.stress = inst(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.flags = inst(new Float32Array(n * 2), 2).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aStress', this.stress);
    geo.setAttribute('aFlags', this.flags);
    this.occData = new Uint8Array(n);
    this.occ = new THREE.Data3DTexture(this.occData, b.nx, b.ny, b.nz);
    this.occ.format = THREE.RedFormat; this.occ.type = THREE.UnsignedByteType;
    this.occ.minFilter = this.occ.magFilter = THREE.LinearFilter;
    this.occ.wrapS = this.occ.wrapT = this.occ.wrapR = THREE.ClampToEdgeWrapping;
    this.occ.unpackAlignment = 1;

    this.uniforms = {
      ...this.shared,
      uOcc: { value: this.occ },
      uDigits: { value: this.digits },
      uDims: { value: new THREE.Vector3(b.nx, b.ny, b.nz) },
      uPigment: { value: rgb(game.level.pigment) },
      uAccent: { value: rgb(game.level.accent || game.level.pigment) },
      uEye: { value: rgb(game.level.eye || game.level.pigment) },
      uSurvey: { value: survey ? 1 : 0 },
      uHover: { value: -1 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: CUBE_VERT, fragmentShader: CUBE_FRAG, uniforms: this.uniforms });
    this.cubes = new THREE.InstancedMesh(geo, material, n);
    this.cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cubes.frustumCulled = false;
    this.scene.add(this.cubes);

    const outline = new THREE.ShaderMaterial({ vertexShader: OUTLINE_VERT, fragmentShader: OUTLINE_FRAG, side: THREE.BackSide, uniforms: { uInk: this.shared.uInk, uGrow: { value: OUTLINE } } });
    this.outline = new THREE.InstancedMesh(geo, outline, n);
    this.outline.instanceMatrix = this.cubes.instanceMatrix;
    this.outline.frustumCulled = false;
    this.scene.add(this.outline);

    this.ghostUniforms = { uPigment: this.uniforms.uPigment, uStrength: { value: survey ? 0 : 1 } };
    const ghost = new THREE.ShaderMaterial({ vertexShader: GHOST_VERT, fragmentShader: GHOST_FRAG, uniforms: this.ghostUniforms, transparent: true, depthTest: false, depthWrite: false });
    this.ghost = new THREE.InstancedMesh(geo, ghost, n);
    this.ghost.instanceMatrix = this.cubes.instanceMatrix;
    this.ghost.frustumCulled = false;
    this.ghost.renderOrder = 4;
    this.ghost.visible = !survey;
    this.scene.add(this.ghost);

    this.makeBench();
    this.makeCradle();
    this.exposedCache = new Uint8Array(n);
    this.looseMark = new Uint8Array(n);
    this.lastRock = -1;
    this.refreshStructure();
    this.refreshStress();
    this.fitShadow();
    this.resize();
    this.syncCubes();
  }

  clearGame() {
    if (!this.game) return;
    for (const m of [this.cubes, this.outline, this.ghost]) { this.scene.remove(m); m.material.dispose(); }
    this.cubes.geometry.dispose();
    this.cubes.dispose();
    this.occ.dispose();
    this.scene.remove(this.bench); this.bench.geometry.dispose(); this.bench.material.dispose();
    this.scene.remove(this.cradle);
    this.cradle.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.game = null;
  }

  
  treasureDistance() {
    const { game } = this, b = game.block;
    const out = new Uint8Array(b.n);
    const tested = [];
    for (let i = 0; i < b.n; i++) if (game.original[i] === TREASURE) tested.push(b.xyz(i));
    for (let i = 0; i < b.n; i++) {
      if (game.original[i] !== ROCK) continue;
      const [x, y, z] = b.xyz(i);
      let best = 9;
      for (const t of tested) {
        const d = Math.abs(x - t[0]) + Math.abs(y - t[1]) + Math.abs(z - t[2]);
        if (d < best) best = d;
        if (best === 1) break;
      }
      out[i] = best;
    }
    return out;
  }

  makeBench() {
    const R = this.game.radius;
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const reach = R * 3.4;
    g.scale(reach * 2.2, 1, reach * 2.2);
    const m = new THREE.ShaderMaterial({
      vertexShader: BENCH_VERT, fragmentShader: BENCH_FRAG, transparent: true, depthWrite: false,
      uniforms: { ...this.shared, uReach: { value: reach } },
    });
    this.bench = new THREE.Mesh(g, m);
    this.bench.position.y = this.game.benchY;
    this.bench.renderOrder = -1;
    this.scene.add(this.bench);
  }

  
  
  makeCradle() {
    
    
    
    const { game } = this, b0 = game.block, tube = 0.07 + game.radius * 0.01;
    const gap = 0.22 + game.radius * 0.012;
    const R0 = Math.hypot(b0.nx, b0.nz) / 2 + 0.35;
    const R1 = Math.max(R0 + gap, game.radius * 0.92), R2 = R1 + gap;
    this.ringRadius = R2 + tube;
    const brass = (ticks, tone = '#c49a3c') => new THREE.ShaderMaterial({
      vertexShader: BRASS_VERT, fragmentShader: BRASS_FRAG,
      transparent: true,
      uniforms: { uInk: this.shared.uInk, uLight: this.shared.uLight, uBrass: { value: rgb(tone) }, uTicks: { value: ticks }, uRockR: { value: Math.max(b0.nx, b0.ny, b0.nz) * 0.58 } },
    });
    const dark = brass(0, '#9d7a2e'), plain = brass(0);
    const torus = (r, ticks) => new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 120), brass(ticks));
    const rod = (a, b, rad = tube * 0.62) => {
      const d = new THREE.Vector3().subVectors(b, a);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, d.length(), 10), dark);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      return m;
    };
    const stud = (x, y, z, r = tube * 1.5) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), plain); s.position.set(x, y, z); return s; };
    const v = (x, y, z) => new THREE.Vector3(x, y, z);

    this.cradle = new THREE.Group();
    this.scene.add(this.cradle);

    
    
    const yFoot = game.benchY;
    const Ra = R2 + gap;
    this.cradle.add(rod(v(0, yFoot, 0), v(0, -R2, 0), tube * 0.95));
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(R0 * 0.34, R0 * 0.4, tube * 1.6, 28), dark);
    foot.position.y = yFoot + tube * 0.8;
    this.cradle.add(foot);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(Ra, tube * 0.8, 8, 80, Math.PI).rotateZ(-Math.PI / 2).rotateY(Math.PI / 2), dark);
    this.cradle.add(arc);
    this.cradle.add(rod(v(0, R2, 0), v(0, Ra, 0)), stud(0, Ra, 0), stud(0, -Ra, 0));
    this.frameX = R2 + tube;
    this.frameTop = Ra + tube;

    this.gOuter = new THREE.Group();
    this.gMiddle = new THREE.Group();
    this.gInner = new THREE.Group();
    this.cradle.add(this.gOuter);
    this.gOuter.add(this.gMiddle);
    this.gMiddle.add(this.gInner);

    this.gOuter.add(torus(R2, 72), stud(0, R2, 0), stud(0, -R2, 0));
    this.gOuter.add(rod(v(R1, 0, 0), v(R2, 0, 0)), rod(v(-R1, 0, 0), v(-R2, 0, 0)), stud(R2, 0, 0), stud(-R2, 0, 0));

    const middle = torus(R1, 0);
    middle.rotation.x = Math.PI / 2;
    this.gMiddle.add(middle, stud(R1, 0, 0), stud(-R1, 0, 0));
    this.gMiddle.add(rod(v(0, 0, R0), v(0, 0, R1)), rod(v(0, 0, -R0), v(0, 0, -R1)));

    const inner = torus(R0, 36);
    inner.rotation.x = Math.PI / 2;
    this.gInner.add(inner, stud(0, 0, R0), stud(0, 0, -R0));
    const b = game.block;
    const pins = game.spec.pins;
    pins.forEach((p, k) => {
      const side = k === 0 ? -1 : 1;
      const py = p[1] - b.cy, pz = p[2] - b.cz, px = p[0] - b.cx;
      const zz = Math.max(-R0 * 0.8, Math.min(R0 * 0.8, pz));
      const xx = Math.sqrt(R0 * R0 - zz * zz) * side;
      this.gInner.add(rod(v(xx, 0, zz), v(px, py, pz)), stud(xx, 0, zz, tube * 1.25));
    });
  }

  
  fitShadow() {
    const R = this.game.radius * 2.9 + 3;
    const c = this.shadowCam;
    c.left = -R; c.right = R; c.top = R; c.bottom = -R;
    c.near = 1; c.far = R * 4;
    c.position.copy(LIGHT).multiplyScalar(R * 2);
    c.up.set(0, 1, 0);
    c.lookAt(0, 0, 0);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    this.shadowMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  }

  
  refreshStructure() {
    const { game } = this, b = game.block;
    for (let i = 0; i < b.n; i++) {
      this.occData[i] = b.kind[i] ? 255 : 0;
      this.exposedCache[i] = b.kind[i] && (b.kind[i] === TREASURE || b.exposed(i)) ? 1 : 0;
    }
    this.occ.needsUpdate = true;
    this.lastRock = b.rockLeft;
    this.lastTreasure = this.countTreasure();
    const fl = this.flags.array;
    for (let i = 0; i < b.n; i++) fl[i * 2 + 1] = b.kind[i] === TREASURE && b.exposed(i) ? 1 : fl[i * 2 + 1];
    this.flags.needsUpdate = true;
  }

  countTreasure() { const { kind, n } = this.game.block; let t = 0; for (let i = 0; i < n; i++) if (kind[i] === TREASURE) t++; return t; }

  
  refreshStress() {
    const { game } = this, b = game.block;
    b.refreshDamage();
    const s = this.stress.array;
    let worstRed = 0;
    for (let i = 0; i < b.n; i++) {
      if (!b.kind[i]) continue;
      if (b.kind[i] === TREASURE) {
        s[i * 3] = b.cracks[i] / 2;
        s[i * 3 + 1] = 0;
        s[i * 3 + 2] = 0;
        continue;
      }
      let u = 0;
      b.eachBond(i, (_j, k) => { if (b.util[k] > u) u = b.util[k]; });
      const d = b.damage[i];
      
      const red = Math.max(u, d);
      if (red > worstRed) worstRed = red;
      s[i * 3] = d;
      s[i * 3 + 1] = red;
      const full = MATERIALS[game.originalMat[i]].hp;
      s[i * 3 + 2] = full > 1 ? 1 - b.hp[i] / full : 0;
    }
    this.worstRed = worstRed;
    this.stress.needsUpdate = true;
  }

  
  syncCubes() {
    const { game } = this, b = game.block;
    const a = this.cubes.instanceMatrix.array;
    const [qx, qy, qz, qw] = game.q;
    const xx = qx * qx, yy = qy * qy, zz = qz * qz, xy = qx * qy, xz = qx * qz, yz = qy * qz, wx = qw * qx, wy = qw * qy, wz = qw * qz;
    const r00 = 1 - 2 * (yy + zz), r01 = 2 * (xy - wz), r02 = 2 * (xz + wy);
    const r10 = 2 * (xy + wz), r11 = 1 - 2 * (xx + zz), r12 = 2 * (yz - wx);
    const r20 = 2 * (xz - wy), r21 = 2 * (yz + wx), r22 = 1 - 2 * (xx + yy);
    const { u, p, n, nx, ny, cx, cy, cz, kind } = b;
    const show = this.exposedCache;
    for (let i = 0, m = 0; i < n; i++, m += 16) {
      if (!kind[i] || !show[i]) { a[m] = a[m + 1] = a[m + 2] = a[m + 4] = a[m + 5] = a[m + 6] = a[m + 8] = a[m + 9] = a[m + 10] = 0; a[m + 15] = 1; continue; }
      const z = (i / (nx * ny)) | 0, rest = i - z * nx * ny, y = (rest / nx) | 0, x = rest - y * nx;
      const ux = u[i * 3], uy = u[i * 3 + 1], uz = u[i * 3 + 2];
      const X = x - cx + ux + p[i * 3], Y = y - cy + uy + p[i * 3 + 1], Z = z - cz + uz + p[i * 3 + 2];
      
      const ta = uz * 0.9, tb = -ux * 0.9;
      const c0x = r00 + r01 * tb, c0y = r10 + r11 * tb, c0z = r20 + r21 * tb;
      const c1x = r01 - r00 * tb + r02 * -ta, c1y = r11 - r10 * tb + r12 * -ta, c1z = r21 - r20 * tb + r22 * -ta;
      const c2x = r02 + r01 * ta, c2y = r12 + r11 * ta, c2z = r22 + r21 * ta;
      a[m] = c0x * SCALE; a[m + 1] = c0y * SCALE; a[m + 2] = c0z * SCALE; a[m + 3] = 0;
      a[m + 4] = c1x * SCALE; a[m + 5] = c1y * SCALE; a[m + 6] = c1z * SCALE; a[m + 7] = 0;
      a[m + 8] = c2x * SCALE; a[m + 9] = c2y * SCALE; a[m + 10] = c2z * SCALE; a[m + 11] = 0;
      a[m + 12] = r00 * X + r01 * Y + r02 * Z; a[m + 13] = r10 * X + r11 * Y + r12 * Z; a[m + 14] = r20 * X + r21 * Y + r22 * Z; a[m + 15] = 1;
    }
    const fl = this.flags.array;
    let flagsChanged = false;
    game.loose.eachLoose((i, px, py, pz, x, y, z, w) => {
      const m = i * 16;
      const X = x * x, Y = y * y, Z = z * z, XY = x * y, XZ = x * z, YZ = y * z, WX = w * x, WY = w * y, WZ = w * z;
      a[m] = (1 - 2 * (Y + Z)) * SCALE; a[m + 1] = 2 * (XY + WZ) * SCALE; a[m + 2] = 2 * (XZ - WY) * SCALE; a[m + 3] = 0;
      a[m + 4] = 2 * (XY - WZ) * SCALE; a[m + 5] = (1 - 2 * (X + Z)) * SCALE; a[m + 6] = 2 * (YZ + WX) * SCALE; a[m + 7] = 0;
      a[m + 8] = 2 * (XZ + WY) * SCALE; a[m + 9] = 2 * (YZ - WX) * SCALE; a[m + 10] = (1 - 2 * (X + Y)) * SCALE; a[m + 11] = 0;
      a[m + 12] = px; a[m + 13] = py; a[m + 14] = pz; a[m + 15] = 1;
      if (!fl[i * 2]) { fl[i * 2] = 1; fl[i * 2 + 1] = 1; flagsChanged = true; }
    });
    if (flagsChanged) this.flags.needsUpdate = true;
    this.cubes.instanceMatrix.needsUpdate = true;
  }

  syncCradle() {
    const e = (this.euler ||= new THREE.Euler(0, 0, 0, 'YXZ'));
    const q = (this.qv ||= new THREE.Quaternion());
    q.set(...this.game.q);
    e.setFromQuaternion(q, 'YXZ');
    this.gOuter.rotation.set(0, e.y, 0);
    this.gMiddle.rotation.set(e.x, 0, 0);
    this.gInner.rotation.set(0, 0, e.z);
  }

  
  setStage(rect) { this.fitGoal = rect; if (!this.fit) this.fit = { ...rect }; }

  resize() {
    const W = innerWidth, H = innerHeight;
    this.W = W; this.H = H;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.coarse ? 2 : 2));
    this.renderer.setSize(W, H, false);
    this.dustPoints.material.uniforms.uPx.value = H * this.renderer.getPixelRatio() * 2;
    this.applyCamera();
  }

  
  
  applyCamera() {
    if (!this.game || !this.fit) return;
    const { W, H, fit } = this, cam = this.camera;
    const worldW = (this.frameX + 0.2) * 2;
    const top = this.frameTop + 0.2, bottom = this.game.benchY - 0.3;
    const worldH = top - bottom;
    const mid = (top + bottom) / 2;
    const px = Math.min(fit.w / worldW, fit.h / worldH) * this.zoom;
    const tanV = Math.tan((FOV / 2) * Math.PI / 180);
    const dist = H / (2 * tanV * px);
    cam.aspect = W / H;
    const shake = this.knock;
    const sx = shake ? (Math.sin(this.time * 91) * shake * 0.12) : 0, sy = shake ? (Math.cos(this.time * 77) * shake * 0.12) : 0;
    cam.position.set(sx, mid + Math.sin(TILT) * dist + sy, Math.cos(TILT) * dist);
    cam.lookAt(sx, mid + sy, 0);
    const ox = W / 2 - (fit.x + fit.w / 2), oy = H / 2 - (fit.y + fit.h / 2);
    cam.setViewOffset(W, H, ox, oy, W, H);
    cam.near = Math.max(1, dist - this.game.radius * 6);
    cam.far = dist + this.game.radius * 12;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  
  ray(clientX, clientY) {
    const v = new THREE.Vector3((clientX / this.W) * 2 - 1, -(clientY / this.H) * 2 + 1, 0.5).unproject(this.camera);
    const o = this.camera.position;
    const d = v.sub(o).normalize();
    return { origin: [o.x, o.y, o.z], dir: [d.x, d.y, d.z] };
  }
  pickAt(clientX, clientY) {
    if (!this.game) return null;
    const { origin, dir } = this.ray(clientX, clientY);
    return this.game.pick(origin, dir);
  }
  setHover(i) { if (this.uniforms) this.uniforms.uHover.value = i == null ? -1 : i; }

  
  axes() {
    const e = this.camera.matrixWorld.elements;
    return { right: [e[0], e[1], e[2]], up: [e[4], e[5], e[6]], back: [e[8], e[9], e[10]] };
  }

  addZoom(mult) { this.zoomGoal = Math.max(0.7, Math.min(3.2, this.zoomGoal * mult)); }

  puff(x, y, z, count, speed, size) {
    const D = this.dust;
    for (let k = 0; k < count; k++) {
      const i = D.at; D.at = (D.at + 1) % MAX_DUST;
      const a = Math.random() * 6.283, c = Math.random() * 2 - 1, s = Math.sqrt(1 - c * c), v = speed * (0.3 + Math.random());
      D.pos[i * 3] = x + (Math.random() - 0.5) * 0.7; D.pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.7; D.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.7;
      D.vel[i * 3] = Math.cos(a) * s * v; D.vel[i * 3 + 1] = c * v + speed * 0.4; D.vel[i * 3 + 2] = Math.sin(a) * s * v;
      D.size[i] = size * (0.5 + Math.random());
      D.life[i] = 0.5 + Math.random() * 0.7;
    }
  }

  
  handle(events) {
    for (const e of events) {
      if (e.type === 'dig') { this.puff(e.x, e.y, e.z, e.mallet ? 22 : 12, 3.4, 0.16); this.knock = Math.max(this.knock, e.mallet ? 0.5 : 0.14); }
      else if (e.type === 'chip') { this.puff(e.x, e.y, e.z, 6, 2.4, 0.12); this.knock = Math.max(this.knock, 0.1); }
      else if (e.type === 'burst') { this.puff(e.x, e.y, e.z, 34, 6.5, 0.2); this.knock = Math.max(this.knock, 0.6 * e.strength); }
      else if (e.type === 'clack') { if (e.strength > 0.14) this.puff(e.x, this.game.floorY + 0.2, e.z, 3 + (e.strength * 10) | 0, 2, 0.13); this.knock = Math.max(this.knock, e.strength * e.size > 2 ? 0.34 : 0); }
      else if (e.type === 'knock') { if (e.strength > 0.2) this.puff(e.x, e.y, e.z, 4, 2.2, 0.12); }
      else if (e.type === 'crack') { this.puff(e.x, e.y, e.z, 26, 5, 0.18); this.knock = Math.max(this.knock, 0.9); }
      else if (e.type === 'snap') { this.knock = Math.max(this.knock, 0.28); }
      else if (e.type === 'creak') { this.puff(e.x, e.y, e.z, 5, 0.9, 0.1); this.knock = Math.max(this.knock, 0.08); }
      else if (e.type === 'collapse') { this.knock = Math.max(this.knock, 1.5); }
    }
  }

  stepDust(dt) {
    const D = this.dust;
    for (let i = 0; i < MAX_DUST; i++) {
      if (D.life[i] <= 0) continue;
      D.life[i] -= dt;
      D.vel[i * 3 + 1] -= 9 * dt;
      D.pos[i * 3] += D.vel[i * 3] * dt; D.pos[i * 3 + 1] += D.vel[i * 3 + 1] * dt; D.pos[i * 3 + 2] += D.vel[i * 3 + 2] * dt;
      if (D.life[i] < 0) D.life[i] = 0;
    }
    const g = this.dustPoints.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.aLife.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
  }

  frame(dt) {
    const { game } = this;
    if (!game) return;
    this.time += dt;
    const k = Math.min(1, dt * 7);
    this.zoom += (this.zoomGoal - this.zoom) * k;
    const f = this.fit, g = this.fitGoal;
    for (const c of ['x', 'y', 'w', 'h']) f[c] += (g[c] - f[c]) * Math.min(1, dt * 5);
    this.knock *= Math.exp(-dt * 11);
    if (this.knock < 0.002) this.knock = 0;
    this.applyCamera();

    if (game.block.rockLeft !== this.lastRock || this.countTreasure() !== this.lastTreasure) this.refreshStructure();
    this.lastStress += dt;
    if (this.lastStress > 1 / STRESS_HZ) { this.lastStress = 0; this.refreshStress(); }
    this.syncCubes();
    this.syncCradle();
    this.stepDust(dt);

    const r = this.renderer;
    
    this.outline.visible = this.bench.visible = this.dustPoints.visible = false;
    const ghostOn = this.ghost.visible;
    this.ghost.visible = false;
    this.scene.overrideMaterial = this.depthMaterial;
    r.setRenderTarget(this.shadowTarget);
    r.clear();
    r.render(this.scene, this.shadowCam);
    r.setRenderTarget(null);
    this.scene.overrideMaterial = null;
    this.outline.visible = this.bench.visible = this.dustPoints.visible = true;
    this.ghost.visible = ghostOn;
    r.render(this.scene, this.camera);
  }

  
  setGhost(strength) { if (this.ghostUniforms) this.ghostUniforms.uStrength.value = strength; }
}

export const PAPER_COLOUR = PAPER;
