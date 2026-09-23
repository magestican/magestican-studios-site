

























import * as THREE from 'three';
import { CURVE_K } from 'moon/world/curve.mjs';
import { PASTEL_GLSL } from 'moon/palette/pastel.mjs';

export const curveUniforms = {
  uCurve: { value: CURVE_K },
  uCurveFocus: { value: new THREE.Vector3() },
};


export const cozyUniforms = {
  uFmlWrap: { value: 0.45 },
  uFmlShadeTint: { value: new THREE.Color(0.86, 0.82, 1.0) },
  
  uFmlShadeLift: { value: new THREE.Color(0.01, 0.008, 0.025) },
  uFmlRimColor: { value: new THREE.Color(0.5, 0.55, 0.6) },
  uFmlMottle: { value: 0.06 },
};














export const windUniforms = {
  uFmlTime: { value: 0 },
  uFmlWind: { value: 1 },
};















export const waterUniforms = {
  uFmlWater: { value: 1 },
};

export const EMISSIVE_IDS = Object.freeze(['glass', 'lamp-glow', 'fire']);
const EMISSIVE_DEFAULTS = { glass: ['#ffc774', 1.8], 'lamp-glow': ['#ffc473', 2.4], fire: ['#ff8f3a', 2.6] };
const emissiveFactor = { glass: 0, 'lamp-glow': 0, fire: 1 };
const resolved = new Map();















const SWELL_GLSL =  `
vec3 fmlSwellAt( vec2 p, float t ) {
  float a1 = t * 1.9 + p.x * 6.8 + p.y * 5.2;
  float a2 = t * 3.1 - p.x * 10.2 + p.y * 8.6;
  return vec3(
    0.6 * sin( a1 ) + 0.4 * sin( a2 ),
    0.6 * 6.8 * cos( a1 ) - 0.4 * 10.2 * cos( a2 ),
    0.6 * 5.2 * cos( a1 ) + 0.4 * 8.6 * cos( a2 ) );
}
`;

const BEND_PARS = SWELL_GLSL +  `
uniform float uCurve;
uniform vec3 uCurveFocus;
uniform float uFmlTime;
uniform float uFmlWind;
uniform float uFmlWater;
// W6: PER-MATERIAL SPEED on the flow term - fire licks and twists faster than
// water falls. Bound once per compiled program (material.userData.uFmlFlowRate,
// set at build() time in this file), not a second shader: every material still
// shares the one fmlFlowAt below, multiplying its own clock by its own rate.
// Water's rate is 1 (its arcs and jet keep the speed they always had).
uniform float uFmlFlowRate;
attribute float fmlSway;
attribute float fmlRipple;
// A FALLING STREAM (fmlRipple < 0): a wave travelling DOWN it - phase 6 t - 7 y,
// so 0.9 m of wavelength at 0.95 m/s - wags the ribbon sideways by |w| metres
// and pulses it up and down by half that. A straight tube of water is the thing
// that reads as dead; a ribbon with a wave in it reads as falling.
vec3 fmlFlowAt( vec3 p, float t, float w ) {
  float rt = t * uFmlFlowRate;
  float ph = rt * 6.0 - p.y * 7.0;
  return vec3( w * sin( ph ), w * 0.45 * sin( rt * 4.4 + p.y * 3.0 ), w * cos( ph * 0.83 + 1.7 ) );
}
// The whole water term for one vertex, in metres of world displacement.
vec3 fmlWaterAt( vec3 p, float t, float w ) {
  if ( w > 0.0 ) return vec3( 0.0, w * fmlSwellAt( p.xz, t ).x, 0.0 );
  if ( w < 0.0 ) return fmlFlowAt( p, t, -w );
  return vec3( 0.0 );
}
// Metres of sideways travel per unit of weight, in [-1, 1] on each axis: the
// sines sum to at most 1.75, and 0.57 keeps the magnitude inside 1 so a weight
// IS the most a vertex ever moves.
vec2 fmlWindAt( vec2 p, float t ) {
  float a = sin( t * 1.3 + p.x * 0.35 + p.y * 0.22 ) + 0.5 * sin( t * 2.7 - p.x * 0.6 + p.y * 0.9 ) + 0.25 * sin( t * 5.1 + p.y * 1.7 );
  float b = 0.6 * sin( t * 1.1 + p.x * 0.28 - p.y * 0.3 ) + 0.3 * sin( t * 3.3 + p.x * 1.1 );
  return vec2( 0.55 + 0.45 * a, b ) * 0.57;
}
`;

function bendChunk(worldVarying) {
  return  `
vec4 fmlWorld = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  fmlWorld = batchingMatrix * fmlWorld;
#endif
#ifdef USE_INSTANCING
  fmlWorld = instanceMatrix * fmlWorld;
#endif
fmlWorld = modelMatrix * fmlWorld;
fmlWorld.xz += fmlWindAt( fmlWorld.xz, uFmlTime ) * ( uFmlWind * fmlSway );
fmlWorld.xyz += fmlWaterAt( fmlWorld.xyz, uFmlTime, fmlRipple ) * uFmlWater;
${worldVarying ? 'vFmlWorld = fmlWorld.xyz;\n  vFmlRipple = fmlRipple;' : ''}
vec2 fmlD = fmlWorld.xz - uCurveFocus.xz;
fmlWorld.y -= dot( fmlD, fmlD ) * uCurve;
vec4 mvPosition = viewMatrix * fmlWorld;
gl_Position = projectionMatrix * mvPosition;
`;
}


const WORLDPOS_BENT =  `
#include <worldpos_vertex>
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  worldPosition = fmlWorld;
#endif
`;

function replaceOrThrow(src, find, replacement, what) {
  if (!src.includes(find)) throw new Error(`cozy material: '${what}' not found - three.js shader chunks changed`);
  return src.replace(find, replacement);
}





const NEUTRAL_OPEN = 'vec3 NeutralToneMapping( vec3 color ) {';
if (!THREE.ShaderChunk.tonemapping_pars_fragment.includes('fmlPastel')) {
  THREE.ShaderChunk.tonemapping_pars_fragment = replaceOrThrow(
    THREE.ShaderChunk.tonemapping_pars_fragment, NEUTRAL_OPEN, 'vec3 fmlNeutralBase( vec3 color ) {', 'NeutralToneMapping',
  ) + PASTEL_GLSL + 'vec3 NeutralToneMapping( vec3 color ) { return fmlPastel( fmlNeutralBase( color ) ); }\n';
}

function bendVertex(shader, worldVarying, flowRate) {
  shader.uniforms.uCurve = curveUniforms.uCurve;
  shader.uniforms.uCurveFocus = curveUniforms.uCurveFocus;
  shader.uniforms.uFmlTime = windUniforms.uFmlTime;
  shader.uniforms.uFmlWind = windUniforms.uFmlWind;
  shader.uniforms.uFmlWater = waterUniforms.uFmlWater;
  shader.uniforms.uFmlFlowRate = flowRate;
  let vs = BEND_PARS + (worldVarying ? 'varying vec3 vFmlWorld;\nvarying float vFmlRipple;\n' : '') + shader.vertexShader;
  vs = replaceOrThrow(vs, '#include <project_vertex>', bendChunk(worldVarying), 'project_vertex');
  if (vs.includes('#include <worldpos_vertex>')) vs = vs.replace('#include <worldpos_vertex>', WORLDPOS_BENT);
  if (vs.includes('#include <morphcolor_vertex>')) vs = vs.replace('#include <morphcolor_vertex>', MORPHCOLOR_FIXED);
  shader.vertexShader = vs;
}






const MORPHCOLOR_FIXED = THREE.ShaderChunk.morphcolor_vertex.replace('vColor += getMorph( gl_VertexID, i, 2 ).rgb', 'vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb');

export function applyBend(material) {
  material.userData.uFmlFlowRate = material.userData.uFmlFlowRate || { value: 1 };
  material.onBeforeCompile = (shader) => bendVertex(shader, false, material.userData.uFmlFlowRate);
  material.customProgramCacheKey = () => 'fml-bend-v3';
  material.defaultAttributeValues = { ...(material.defaultAttributeValues || {}), fmlSway: [0], fmlRipple: [0] };
  return material;
}

const COZY_PARS = SWELL_GLSL +  `
varying vec3 vFmlWorld;
varying float vFmlRipple;
uniform float uFmlTime;
uniform float uFmlWater;
uniform float uFmlWrap;
uniform vec3 uFmlShadeTint;
uniform vec3 uFmlShadeLift;
uniform vec3 uFmlRimColor;
uniform float uFmlRim;
uniform float uFmlMottle;
float fmlSh = 1.0;
float fmlShadow = 1.0;
float fmlLitNL = 1.0;
float fmlHash( vec3 p ) {
  p = fract( p * 0.3183099 + 0.1 );
  p *= 17.0;
  return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}
float fmlNoise( vec3 x ) {
  vec3 i = floor( x );
  vec3 f = fract( x );
  f = f * f * ( 3.0 - 2.0 * f );
  return mix(
    mix( mix( fmlHash( i ), fmlHash( i + vec3( 1, 0, 0 ) ), f.x ), mix( fmlHash( i + vec3( 0, 1, 0 ) ), fmlHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
    mix( mix( fmlHash( i + vec3( 0, 0, 1 ) ), fmlHash( i + vec3( 1, 0, 1 ) ), f.x ), mix( fmlHash( i + vec3( 0, 1, 1 ) ), fmlHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
    f.z );
}
`;

const MOTTLE =  `
float fmlM = fmlNoise( vFmlWorld * 0.3 ) * 0.62 + fmlNoise( vFmlWorld * 1.05 + 7.3 ) * 0.38;
float fmlHue = fmlNoise( vFmlWorld * 0.19 + 19.1 );
diffuseColor.rgb *= ( 1.0 + uFmlMottle * clamp( ( fmlM * 2.0 - 1.0 ) * 1.7, -1.0, 1.0 ) )
  * mix( vec3( 1.025, 1.0, 0.965 ), vec3( 0.975, 0.995, 1.03 ), fmlHue );
// L1(c): A CREST IS LIGHTER THAN A TROUGH, +/- 12 % of value, on the same swell
// the normal is tilted by. This is the mottling above with a clock on it, and it
// is here because the tilt ALONE was measured at 0.11 % of the frame over a
// second (scripts/water-check.mjs, first run): the cozy material wraps its
// diffuse by 0.45 on purpose, which is exactly what makes a tilted normal a
// gentle change in light - lovely for a lawn, nearly invisible on a bowl of
// water 150 px across. Painted value is how a stylised pond has always read.
if ( vFmlRipple > 0.0 ) {
  diffuseColor.rgb *= 1.0 + 0.12 * uFmlWater * fmlSwellAt( vFmlWorld.xz, uFmlTime ).x;
}
`;





const DIFFUSE_LINE = 'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );';
const WRAPPED_PHYSICAL = replaceOrThrow(
  THREE.ShaderChunk.lights_physical_pars_fragment,
  DIFFUSE_LINE,
  'float fmlWrapNL = saturate( ( dot( geometryNormal, directLight.direction ) + uFmlWrap ) / ( 1.0 + uFmlWrap ) );\n\treflectedLight.directDiffuse += fmlWrapNL * directLight.color * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );',
  'RE_Direct_Physical diffuse',
);

const DIR_SHADOW_LINE = 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;';
const LIGHTS_BEGIN = replaceOrThrow(
  replaceOrThrow(
    THREE.ShaderChunk.lights_fragment_begin,
    DIR_SHADOW_LINE,
    DIR_SHADOW_LINE.replace('directLight.color *=', 'fmlSh =') + '\n\t\tdirectLight.color *= fmlSh;\n\t\tfmlShadow = min( fmlShadow, fmlSh );',
    'directional shadow line',
  ),
  'getDirectionalLightInfo( directionalLight, directLight );',
  'getDirectionalLightInfo( directionalLight, directLight );\n\t\tfmlLitNL = min( fmlLitNL, saturate( ( dot( geometryNormal, directLight.direction ) + uFmlWrap * 0.5 ) / ( 1.0 + uFmlWrap * 0.5 ) ) );',
  'directional light info',
);

const SHADE =  `
#include <lights_fragment_end>
float fmlLit = fmlLitNL * fmlShadow;
// Bright, low-saturation albedo (snow, cream plaster) takes a much gentler shade:
// full strength turned shadows on snow royal blue (Lane T winter review).
float fmlPeak = max( max( diffuseColor.r, diffuseColor.g ), diffuseColor.b );
float fmlSat = fmlPeak - min( min( diffuseColor.r, diffuseColor.g ), diffuseColor.b );
float fmlPale = smoothstep( 0.4, 0.8, fmlPeak ) * ( 1.0 - smoothstep( 0.08, 0.3, fmlSat ) );
reflectedLight.indirectDiffuse *= mix( mix( uFmlShadeTint, vec3( 1.0 ), 0.65 * fmlPale ), vec3( 1.0 ), fmlLit );
reflectedLight.indirectDiffuse += ( 1.0 - fmlLit ) * uFmlShadeLift * ( 1.0 - 0.75 * fmlPale );
float fmlIndL = dot( reflectedLight.indirectDiffuse, vec3( 0.2126, 0.7152, 0.0722 ) );
reflectedLight.indirectDiffuse = mix( reflectedLight.indirectDiffuse, vec3( fmlIndL ) * vec3( 1.0, 0.95, 1.1 ), 0.45 * fmlPale * ( 1.0 - fmlLit ) );
`;

const RIM =  `
float fmlFres = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
outgoingLight += uFmlRimColor * fmlFres * uFmlRim * ( 0.4 + 0.6 * diffuseColor.rgb );
#include <opaque_fragment>
`;














const WATER_TINT =  `
diffuseColor.rgb *= mix( 0.72, 1.0, clamp( vFmlRipple / 0.02, 0.0, 1.0 ) );
`;
const WATER_ALPHA =  `
diffuseColor.a = clamp( diffuseColor.a * mix( 0.85, 1.2, fmlFres ), 0.0, 1.0 );
#include <opaque_fragment>
`;
function waterPatch(fs) {
  fs = replaceOrThrow(
    fs,
    'diffuseColor.rgb *= 1.0 + 0.12 * uFmlWater * fmlSwellAt( vFmlWorld.xz, uFmlTime ).x;\n}',
    'diffuseColor.rgb *= 1.0 + 0.12 * uFmlWater * fmlSwellAt( vFmlWorld.xz, uFmlTime ).x;\n}' + WATER_TINT,
    'water: the crest/trough line (anchor for the depth tint)',
  );
  return replaceOrThrow(fs, '#include <opaque_fragment>', WATER_ALPHA, 'water: opaque_fragment (the fresnel alpha)');
}

const KEEP_NORMALS =  `
#ifndef FLAT_SHADED
  normal = normalize( vNormal );
#endif`;














const WATER_NORMAL =  `
if ( vFmlRipple > 0.0 ) {
  vec3 fmlSwell = fmlSwellAt( vFmlWorld.xz, uFmlTime );
  float fmlTilt = 0.07 * uFmlWater * clamp( vFmlRipple / 0.02, 0.0, 1.5 );
  vec3 fmlSlope = ( viewMatrix * vec4( fmlSwell.y, 0.0, fmlSwell.z, 0.0 ) ).xyz;
  normal = normalize( normal - fmlSlope * fmlTilt );
}`;






export function makeCozy(material, { rim = 0.12, key = 'base', patch = null, uniforms = {}, keepNormals = false, flowRate = 1 } = {}) {
  material.userData.uFmlRim = { value: rim };
  material.userData.uFmlFlowRate = { value: flowRate };
  material.onBeforeCompile = (shader) => {
    bendVertex(shader, true, material.userData.uFmlFlowRate);
    Object.assign(shader.uniforms, cozyUniforms, { uFmlRim: material.userData.uFmlRim }, uniforms);
    let fs = shader.fragmentShader;
    fs = replaceOrThrow(fs, '#include <common>', '#include <common>\n' + COZY_PARS, 'common');
    fs = replaceOrThrow(fs, '#include <color_fragment>', '#include <color_fragment>\n' + MOTTLE, 'color_fragment');
    fs = replaceOrThrow(fs, '#include <lights_physical_pars_fragment>', WRAPPED_PHYSICAL, 'lights_physical_pars_fragment');
    fs = replaceOrThrow(fs, '#include <lights_fragment_begin>', LIGHTS_BEGIN, 'lights_fragment_begin');
    fs = replaceOrThrow(fs, '#include <lights_fragment_end>', SHADE, 'lights_fragment_end');
    fs = replaceOrThrow(fs, '#include <opaque_fragment>', RIM, 'opaque_fragment');
    fs = replaceOrThrow(
      fs, '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>' + (keepNormals ? KEEP_NORMALS : '') + WATER_NORMAL, 'normal_fragment_begin',
    );
    if (patch) fs = patch(fs);
    shader.fragmentShader = fs;
  };
  material.customProgramCacheKey = () => `fml-cozy-v3-${key}`;
  material.defaultAttributeValues = { ...(material.defaultAttributeValues || {}), fmlSway: [0], fmlRipple: [0] };
  return material;
}

export function bentDepthMaterial({ map = null, alphaTest = 0, side = THREE.FrontSide } = {}) {
  const depth = new THREE.MeshDepthMaterial({ map: alphaTest ? map : null, alphaTest, side });
  return applyBend(depth);
}

export function cozyMaterial(id) {
  if (!resolved.has(id)) resolved.set(id, build(id));
  return resolved.get(id);
}


















export async function soloEmissive(id) {
  if (!EMISSIVE_IDS.includes(id)) throw new Error(`soloEmissive('${id}'): not an emissive id (${EMISSIVE_IDS.join(', ')})`);
  const base = await cozyMaterial(id);
  const solo = new THREE.MeshStandardMaterial({
    color: base.color.clone(),
    vertexColors: base.vertexColors,
    map: base.map,
    roughness: base.roughness,
    metalness: base.metalness,
    side: base.side,
    alphaTest: base.alphaTest,
    alphaToCoverage: base.alphaToCoverage,
    emissive: base.emissive.clone(),
    emissiveMap: base.emissiveMap,
  });
  solo.name = `${id}-solo`;
  solo.userData.emissiveBase = base.userData.emissiveBase;
  solo.userData.depthMaterial = base.userData.depthMaterial;
  solo.emissiveIntensity = 0;
  return makeCozy(solo, { rim: base.userData.uFmlRim.value, key: id });
}


export function setEmissiveFactors(factors) {
  Object.assign(emissiveFactor, factors);
  for (const id of EMISSIVE_IDS) {
    const p = resolved.get(id);
    if (!p) continue;
    p.then((m) => { m.emissiveIntensity = m.userData.emissiveBase * emissiveFactor[id]; }, () => {});
  }
}





export function bleedTransparent(data) {
  let r = 0, g = 0, b = 0, n = 0, cut = false;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 127) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; } else if (data[i + 3] < 32) cut = true;
  }
  if (!cut || !n) return;
  r /= n; g /= n; b /= n;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) { data[i] = r; data[i + 1] = g; data[i + 2] = b; }
  }
}

export async function paintTexture(mod, size) {
  const img = mod.paint({ size });
  bleedTransparent(img.data);
  const map = new THREE.DataTexture(img.data, img.width, img.height, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 4;
  map.needsUpdate = true;
  return map;
}


















const PAINTERS = Object.freeze({
  bark: () => import('moon/paint/bark.mjs'),
  blossom: () => import('moon/paint/blossom.mjs'),
  bottle: () => import('moon/paint/bottle.mjs'),
  canvas: () => import('moon/paint/canvas.mjs'),
  cloth: () => import('moon/paint/cloth.mjs'),
  copper: () => import('moon/paint/copper.mjs'),
  eye: () => import('moon/paint/eye.mjs'),
  fire: () => import('moon/paint/fire.mjs'),
  fruit: () => import('moon/paint/fruit.mjs'),
  fur: () => import('moon/paint/fur.mjs'),
  gem: () => import('moon/paint/gem.mjs'),
  glass: () => import('moon/paint/glass.mjs'),
  gold: () => import('moon/paint/gold.mjs'),
  grass: () => import('moon/paint/grass.mjs'),
  'lamp-glow': () => import('moon/paint/lamp-glow.mjs'),
  leaf: () => import('moon/paint/leaf.mjs'),
  metal: () => import('moon/paint/metal.mjs'),
  paper: () => import('moon/paint/paper.mjs'),
  petal: () => import('moon/paint/petal.mjs'),
  plank: () => import('moon/paint/plank.mjs'),
  roof: () => import('moon/paint/roof.mjs'),
  skin: () => import('moon/paint/skin.mjs'),
  snow: () => import('moon/paint/snow.mjs'),
  soil: () => import('moon/paint/soil.mjs'),
  stone: () => import('moon/paint/stone.mjs'),
  water: () => import('moon/paint/water.mjs'),
  wood: () => import('moon/paint/wood.mjs'),
});


export const PAINTER_IDS = Object.freeze(Object.keys(PAINTERS));

export async function loadPainter(id) {
  const load = PAINTERS[id];
  if (!load) return {};
  try {
    return await load();
  } catch {
    
    return {};
  }
}

async function build(id) {
  const mod = await loadPainter(id);
  const surface = mod.SURFACE || {};
  const map = mod.paint ? await paintTexture(mod, surface.size || 512) : null;
  const emissiveId = EMISSIVE_IDS.includes(id);
  const [defColour, defIntensity] = EMISSIVE_DEFAULTS[id] || ['#000000', 0];
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    map,
    roughness: surface.roughness ?? 0.9,
    metalness: surface.metalness ?? 0,
    side: surface.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    alphaTest: surface.alphaTest ?? 0,
    alphaToCoverage: Boolean(surface.alphaTest),
    emissive: new THREE.Color(surface.emissive || defColour),
    emissiveMap: emissiveId ? map : null,
    transparent: Boolean(surface.transparent),
    opacity: surface.opacity ?? 1,
    depthWrite: !surface.transparent,
  });
  material.name = id;
  
  material.userData.emissiveBase = emissiveId ? (surface.emissiveIntensity || defIntensity) : (surface.emissiveIntensity ?? 0);
  material.emissiveIntensity = material.userData.emissiveBase * (emissiveId ? emissiveFactor[id] : 1);
  material.userData.depthMaterial = bentDepthMaterial({ map, alphaTest: surface.alphaTest ?? 0, side: material.side });
  return makeCozy(material, {
    rim: surface.rim ?? (id === 'fur' ? 0.35 : 0.12),
    key: id,
    keepNormals: id === 'grass' || id === 'petal',
    patch: id === 'water' ? waterPatch : null,
    
    
    
    flowRate: id === 'fire' ? 3.5 : 1,
  });
}
