

























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

export const EMISSIVE_IDS = Object.freeze(['glass', 'lamp-glow', 'fire']);
const EMISSIVE_DEFAULTS = { glass: ['#ffc774', 1.8], 'lamp-glow': ['#ffc473', 2.4], fire: ['#ff8f3a', 2.6] };
const emissiveFactor = { glass: 0, 'lamp-glow': 0, fire: 1 };
const resolved = new Map();

const BEND_PARS = 'uniform float uCurve;\nuniform vec3 uCurveFocus;\n';

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
${worldVarying ? 'vFmlWorld = fmlWorld.xyz;' : ''}
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

function bendVertex(shader, worldVarying) {
  shader.uniforms.uCurve = curveUniforms.uCurve;
  shader.uniforms.uCurveFocus = curveUniforms.uCurveFocus;
  let vs = BEND_PARS + (worldVarying ? 'varying vec3 vFmlWorld;\n' : '') + shader.vertexShader;
  vs = replaceOrThrow(vs, '#include <project_vertex>', bendChunk(worldVarying), 'project_vertex');
  if (vs.includes('#include <worldpos_vertex>')) vs = vs.replace('#include <worldpos_vertex>', WORLDPOS_BENT);
  shader.vertexShader = vs;
}

export function applyBend(material) {
  material.onBeforeCompile = (shader) => bendVertex(shader, false);
  material.customProgramCacheKey = () => 'fml-bend-v1';
  return material;
}

const COZY_PARS =  `
varying vec3 vFmlWorld;
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






export function makeCozy(material, { rim = 0.12, key = 'base', patch = null, uniforms = {}, keepNormals = false } = {}) {
  material.userData.uFmlRim = { value: rim };
  material.onBeforeCompile = (shader) => {
    bendVertex(shader, true);
    Object.assign(shader.uniforms, cozyUniforms, { uFmlRim: material.userData.uFmlRim }, uniforms);
    let fs = shader.fragmentShader;
    fs = replaceOrThrow(fs, '#include <common>', '#include <common>\n' + COZY_PARS, 'common');
    fs = replaceOrThrow(fs, '#include <color_fragment>', '#include <color_fragment>\n' + MOTTLE, 'color_fragment');
    fs = replaceOrThrow(fs, '#include <lights_physical_pars_fragment>', WRAPPED_PHYSICAL, 'lights_physical_pars_fragment');
    fs = replaceOrThrow(fs, '#include <lights_fragment_begin>', LIGHTS_BEGIN, 'lights_fragment_begin');
    fs = replaceOrThrow(fs, '#include <lights_fragment_end>', SHADE, 'lights_fragment_end');
    fs = replaceOrThrow(fs, '#include <opaque_fragment>', RIM, 'opaque_fragment');
    if (keepNormals) {
      fs = replaceOrThrow(fs, '#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifndef FLAT_SHADED\n  normal = normalize( vNormal );\n#endif', 'normal_fragment_begin');
    }
    if (patch) fs = patch(fs);
    shader.fragmentShader = fs;
  };
  material.customProgramCacheKey = () => `fml-cozy-v1-${key}`;
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
  });
  material.name = id;
  
  material.userData.emissiveBase = emissiveId ? (surface.emissiveIntensity || defIntensity) : (surface.emissiveIntensity ?? 0);
  material.emissiveIntensity = material.userData.emissiveBase * (emissiveId ? emissiveFactor[id] : 1);
  material.userData.depthMaterial = bentDepthMaterial({ map, alphaTest: surface.alphaTest ?? 0, side: material.side });
  return makeCozy(material, { rim: surface.rim ?? (id === 'fur' ? 0.35 : 0.12), key: id, keepNormals: id === 'grass' || id === 'petal' });
}
