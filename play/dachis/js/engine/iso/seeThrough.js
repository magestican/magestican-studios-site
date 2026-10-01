














import * as THREE from 'three';

export const SEE_MAX = 4;

export const seeUniforms = {
  uSee: { value: Array.from({ length: SEE_MAX }, () => new THREE.Vector4(0, 0, 0, 0)) }, 
  uSeeW: { value: new Array(SEE_MAX).fill(0) }, 
  uSeeAspect: { value: 1 },
  uSeeDepth: { value: 0.003 }, 
  uSeeActors: { value: 0 }, 
};


export const SEE_CORE = 0.88;


export const SEE_ACTOR = 0.7;

const PARS_V =  `
varying vec3 vSeeNdc;
`;
const MAIN_V =  `
vSeeNdc = gl_Position.xyz / gl_Position.w;
`;
const PARS_F =  `
varying vec3 vSeeNdc;
uniform vec4 uSee[ ${SEE_MAX} ];
uniform float uSeeW[ ${SEE_MAX} ];
uniform float uSeeAspect;
uniform float uSeeDepth;
uniform float uSeeActors;
float seeBayer( vec2 p ) { // 4x4 ordered dither threshold in (0, 1)
  vec2 q = mod( floor( p ), 4.0 );
  float i = q.x + q.y * 4.0;
  vec4 a = vec4( 0.0, 8.0, 2.0, 10.0 ), b = vec4( 12.0, 4.0, 14.0, 6.0 ), c = vec4( 3.0, 11.0, 1.0, 9.0 ), d = vec4( 15.0, 7.0, 13.0, 5.0 );
  vec4 row = q.y < 0.5 ? a : q.y < 1.5 ? b : q.y < 2.5 ? c : d;
  float v = q.x < 0.5 ? row.x : q.x < 1.5 ? row.y : q.x < 2.5 ? row.z : row.w;
  return ( v + 0.5 ) / 16.0;
}
float seeCut( float n ) { // n: how many of the windows apply (scenery: all; a character: the first uSeeActors)
  float m = 0.0;
  for ( int i = 0; i < ${SEE_MAX}; i ++ ) {
    if ( float( i ) >= n ) break;
    vec4 s = uSee[ i ];
    if ( uSeeW[ i ] <= 0.0 || s.w <= 0.0 ) continue;
    vec2 d = vSeeNdc.xy - s.xy; d.x *= uSeeAspect;
    float r = length( d ) / s.w;
    float nearer = smoothstep( uSeeDepth * 0.5, uSeeDepth * 1.5, s.z - vSeeNdc.z );
    m = max( m, ( 1.0 - smoothstep( 0.55, 1.0, r ) ) * nearer * uSeeW[ i ] );
  }
  return m * ${SEE_CORE.toFixed(3)};
}
`;
const MAIN_F = (n, k = 1) =>  `
if ( seeCut( ${n} ) * ${k.toFixed(3)} > seeBayer( gl_FragCoord.xy ) ) discard;
`;





export function patchSeeThrough(m, { actor = false } = {}) {
  if (m.userData.seeThrough) return m;
  m.userData.seeThrough = true;
  const MAIN = actor ? MAIN_F('uSeeActors', SEE_ACTOR) : MAIN_F(`float( ${SEE_MAX} )`);
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    Object.assign(sh.uniforms, seeUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + PARS_V)
      .replace('#include <fog_vertex>', '#include <fog_vertex>\n' + MAIN_V); 
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PARS_F)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + MAIN);
  };
  m.customProgramCacheKey = () => (prevKey ? prevKey.call(m) : '') + (actor ? '|seeA' : '|see');
  m.needsUpdate = true;
  return m;
}



const actorCopies = new WeakMap(), sceneryCopies = new WeakMap(), copySource = new WeakMap();
function seeCopy(src, actor) {
  const m = src.clone(); 
  m.userData = { ...src.userData }; m.defaultAttributeValues = src.defaultAttributeValues;
  m.onBeforeCompile = src.onBeforeCompile; m.customProgramCacheKey = src.customProgramCacheKey;
  patchSeeThrough(m, { actor });
  copySource.set(m, { src, kind: actor ? 'actor' : 'scenery' });
  return m;
}
export function seeActorMaterial(src) {
  let m = actorCopies.get(src);
  if (!m) actorCopies.set(src, m = seeCopy(src, true));
  return m;
}

export function seeSceneryMaterial(src) {
  let m = sceneryCopies.get(src);
  if (!m) sceneryCopies.set(src, m = seeCopy(src, false));
  return m;
}


export function seeSourceOf(m) { return copySource.get(m) || null; }

const eased = new Map(); 
const tmp = new THREE.Vector3();



export function setSeeTargets(stage, targets, dt = 1 / 60) {
  const cam = stage.camera, half = stage.viewHeight / 2, k = Math.min(1, dt * 7);
  cam.updateMatrixWorld(); 
  const live = new Set();
  for (const t of targets.slice(0, SEE_MAX)) {
    tmp.set(t.x, t.h, t.y).project(cam);
    let e = eased.get(t.id);
    if (!e) { e = { w: 0, v: new THREE.Vector4(), actor: false }; eased.set(t.id, e); }
    e.v.set(tmp.x, tmp.y, tmp.z, t.r / half);
    e.w += ((t.on === false ? 0 : 1) - e.w) * k;
    e.actor = !!t.actor;
    live.add(t.id);
  }
  for (const [id, e] of eased) if (!live.has(id)) { e.w += (0 - e.w) * k; if (e.w < 0.01) eased.delete(id); }
  
  const list = [...eased.values()].sort((a, b) => (b.actor - a.actor) || (b.w - a.w)).slice(0, SEE_MAX);
  let actors = 0;
  for (let i = 0; i < SEE_MAX; i++) {
    const e = list[i];
    if (e) { seeUniforms.uSee.value[i].copy(e.v); seeUniforms.uSeeW.value[i] = e.w; if (e.actor) actors = i + 1; } else seeUniforms.uSeeW.value[i] = 0;
  }
  seeUniforms.uSeeActors.value = actors;
  seeUniforms.uSeeAspect.value = stage.w / stage.h;
  
  seeUniforms.uSeeDepth.value = 0.45 * 2 / (cam.far - cam.near);
}
