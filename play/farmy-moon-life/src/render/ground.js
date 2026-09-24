





import * as THREE from 'three';
import { makeCozy, loadPainter, paintTexture } from './material.js';
import * as MOON from 'moon/world/moonLayout.mjs';
import { PATH_FIELD, pathField } from 'moon/world/pathField.mjs';
import { LAND_MASK } from 'moon/play/landEdge.mjs';


const LAND_OFF = typeof location !== 'undefined' && new URLSearchParams(location.search).get('land') === '0';
import { seasonPalette, linear } from 'moon/palette/seasons.mjs';










export const landUniforms = {
  uFmlLandMap: { value: null },
  
  
  uFmlLandRect: { value: new THREE.Vector4(-1, -1, 1, LAND_MASK.reachM) },
  
  uFmlLandBand: { value: new THREE.Vector4(LAND_MASK.fullM, LAND_MASK.fadeM, LAND_MASK.whisper, LAND_MASK.strength) },
  uFmlLandShade: { value: new THREE.Vector3(...LAND_MASK.shadeMul) },
};

let landTexture = null;










export function setLandMask(mask) {
  if (!landTexture || landTexture.image.width !== mask.size) {
    if (landTexture) landTexture.dispose();
    landTexture = new THREE.DataTexture(new Uint8Array(mask.data), mask.size, mask.size, THREE.RGBAFormat);
    landTexture.name = 'land-mask';
    landTexture.wrapS = landTexture.wrapT = THREE.ClampToEdgeWrapping;
    landTexture.minFilter = landTexture.magFilter = THREE.LinearFilter;
    landTexture.generateMipmaps = false;
  } else {
    landTexture.image.data.set(mask.data);
  }
  landTexture.needsUpdate = true;
  landUniforms.uFmlLandMap.value = landTexture;
  landUniforms.uFmlLandRect.value.set(mask.originM, mask.originM, 1 / mask.spanM, mask.reachM);
  return landTexture;
}

const GROUND_PARS =  `
uniform float uFmlTopScale;
uniform sampler2D uFmlPathMap;
uniform float uFmlPathScale;
uniform sampler2D uFmlPathField;
uniform vec4 uFmlPathRect;
uniform int uFmlPathCount;
uniform float uFmlPathHalf;
uniform vec3 uFmlPathColor;
uniform float uFmlGrassLum;
uniform vec4 uFmlParcel;
uniform sampler2D uFmlLandMap;
uniform vec4 uFmlLandRect;
uniform vec4 uFmlLandBand;
uniform vec3 uFmlLandShade;
uniform float uFmlLandOn;
float fmlSegDist( vec2 p, vec2 a, vec2 b ) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
  return length( pa - ba * h );
}
`;

const GROUND_MAP =  `
#ifdef USE_MAP
  vec2 fmlUvA = vFmlWorld.xz / uFmlTopScale;
  vec2 fmlUvB = mat2( 0.8, -0.6, 0.6, 0.8 ) * vFmlWorld.xz / ( uFmlTopScale * 2.63 );
  vec4 sampledDiffuseColor = texture2D( map, fmlUvA ) * ( 0.62 + 0.42 * texture2D( map, fmlUvB ) );
  diffuseColor *= sampledDiffuseColor;
#endif
`;

const GROUND_PATH =  `
if ( uFmlPathCount > 1 ) {
  // I1: ONE texture read (moon/world/pathField.mjs, pathDistance baked per texel),
  // not a loop over every segment - measured +17 % of a phone-tier frame at 69 points.
  float fmlPd = texture2D( uFmlPathField, ( vFmlWorld.xz - uFmlPathRect.xy ) * uFmlPathRect.z ).r * uFmlPathRect.w;
  // A ragged, crisp painted edge (three noise scales, a narrow blend) with a darker
  // border band just inside it: the art-director review read the old 24 cm
  // smoothstep as a blurry cut-out.
  float fmlEdge = uFmlPathHalf + ( fmlNoise( vec3( vFmlWorld.xz * 0.8, 3.1 ) ) - 0.5 ) * 0.45
    + ( fmlNoise( vec3( vFmlWorld.xz * 3.2, 8.2 ) ) - 0.5 ) * 0.22
    + ( fmlNoise( vec3( vFmlWorld.xz * 9.0, 5.7 ) ) - 0.5 ) * 0.1;
  float fmlW = 1.0 - smoothstep( fmlEdge - 0.05, fmlEdge + 0.03, fmlPd );
  vec3 fmlPathTex = texture2D( uFmlPathMap, vFmlWorld.xz / uFmlPathScale ).rgb;
  float fmlAO = clamp( dot( vColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) / uFmlGrassLum, 0.5, 1.1 );
  float fmlCentre = smoothstep( 0.0, uFmlPathHalf, fmlPd );
  float fmlBorder = smoothstep( fmlEdge - 0.4, fmlEdge - 0.04, fmlPd );
  vec3 fmlPathCol = fmlPathTex * uFmlPathColor * fmlAO * ( 1.06 - 0.08 * fmlCentre ) * ( 1.0 - 0.16 * fmlBorder );
  float fmlFringe = smoothstep( fmlEdge - 0.05, fmlEdge + 0.3, fmlPd ) * ( 1.0 - smoothstep( fmlEdge + 0.3, fmlEdge + 0.95, fmlPd ) );
  diffuseColor.rgb *= 1.0 - 0.13 * fmlFringe;
  diffuseColor.rgb = mix( diffuseColor.rgb, fmlPathCol, fmlW );
  vec2 fmlPc = vFmlWorld.xz;
  float fmlIn = smoothstep( uFmlParcel.x, uFmlParcel.x + 0.6, fmlPc.x ) * smoothstep( uFmlParcel.z, uFmlParcel.z - 0.6, fmlPc.x )
    * smoothstep( uFmlParcel.y, uFmlParcel.y + 0.6, fmlPc.y ) * smoothstep( uFmlParcel.w, uFmlParcel.w - 0.6, fmlPc.y );
  float fmlStripe = smoothstep( -0.3, 0.3, sin( fmlPc.x * 3.14159 / 1.25 ) );
  diffuseColor.rgb *= 1.0 + fmlIn * ( 1.0 - fmlW ) * ( 0.02 + 0.05 * fmlStripe );
}
`;




















const GROUND_LAND =  `
if ( uFmlLandOn > 0.5 ) {
  vec3 fmlLand = texture2D( uFmlLandMap, ( vFmlWorld.xz - uFmlLandRect.xy ) * uFmlLandRect.z ).rgb;
  float fmlLandFar = smoothstep( 9.0, 26.0, length( vViewPosition ) );
  float fmlLandD = fmlLand.r * uFmlLandRect.w
    + ( fmlM - 0.5 ) * 0.5 + ( fmlHue - 0.5 ) * 0.34
    + ( fmlNoise( vec3( vFmlWorld.xz * 2.4, 11.7 ) ) - 0.5 ) * 0.2 * ( 1.0 - fmlLandFar );
  float fmlVerge = 1.0 - smoothstep( uFmlLandBand.x - 0.35 * fmlLandFar, uFmlLandBand.y + 0.3 * fmlLandFar, fmlLandD );
  float fmlWhose = smoothstep( ${LAND_MASK.whoseLo.toFixed(3)}, ${LAND_MASK.whoseHi.toFixed(3)}, fmlLand.g );
  float fmlNear = uFmlLandBand.z + ( 1.0 - uFmlLandBand.z ) * ( 1.0 - smoothstep( ${LAND_MASK.nearLo.toFixed(3)}, ${LAND_MASK.nearHi.toFixed(3)}, fmlLand.b ) );
  diffuseColor.rgb *= mix( vec3( 1.0 ), uFmlLandShade, fmlVerge * fmlWhose * fmlNear * uFmlLandBand.w );
}
#include <alphamap_fragment>
`;



const PATH_TEXTURES = new Map();
function fieldTexture(data, size) {
  const t = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}




function pathFieldTexture(layout) {
  const extra = typeof layout.extraPaths === 'function' ? layout.extraPaths() : [];
  const key = extra.length ? `${layout === MOON ? 'moon' : 'planet'}|${layout.extraPathsSig()}` : layout;
  if (!PATH_TEXTURES.has(key)) {
    const f = pathField(extra.length ? { PATHS: [...layout.PATHS, ...extra], pathDistance: layout.pathDistance } : layout);
    PATH_TEXTURES.set(key, fieldTexture(f.data, f.size));
  }
  return PATH_TEXTURES.get(key);
}
let BLANK = null;
const blankField = () => (BLANK ||= fieldTexture(new Uint8Array(1).fill(255), 1));




export async function groundMaterial({ season = 'summer', paths = true, layout = MOON } = {}) {
  const { PATHS, PATH_HALF_WIDTH, PARCEL } = layout;
  const winter = season === 'winter';
  const [top, path] = await Promise.all([loadPainter(winter ? 'snow' : 'grass'), loadPainter('soil')]);
  const [topMap, pathMap] = await Promise.all([paintTexture(top, top.SURFACE.size), paintTexture(path, path.SURFACE.size)]);
  const pal = seasonPalette(season);
  const count = PATHS.reduce((n, line) => n + line.length, 0);
  const pathMask = paths && count > 1 ? pathFieldTexture(layout) : blankField();
  const g1 = linear(pal.grass[1]);
  const uniforms = {
    uFmlTopScale: { value: top.SURFACE.worldScale || 3 },
    uFmlPathMap: { value: pathMap },
    uFmlPathScale: { value: path.SURFACE.worldScale || 3 },
    uFmlPathField: { value: pathMask },
    uFmlPathRect: { value: new THREE.Vector4(PATH_FIELD.originM, PATH_FIELD.originM, 1 / PATH_FIELD.spanM, PATH_FIELD.maxM) },
    uFmlPathCount: { value: paths ? count : 0 },
    uFmlPathHalf: { value: PATH_HALF_WIDTH },
    uFmlPathColor: { value: new THREE.Color().setRGB(...linear(pal.path), THREE.LinearSRGBColorSpace) },
    uFmlGrassLum: { value: 0.2126 * g1[0] + 0.7152 * g1[1] + 0.0722 * g1[2] },
    uFmlParcel: { value: paths ? new THREE.Vector4(PARCEL.minX, PARCEL.minZ, PARCEL.maxX, PARCEL.maxZ) : new THREE.Vector4(1e4, 1e4, 1e4, 1e4) },
    
    
    
    
    
    
    
    
    
    
    
    
    uFmlLandOn: { value: paths && layout === MOON && !LAND_OFF ? 1 : 0 },
    ...landUniforms,
  };
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: topMap, roughness: top.SURFACE.roughness ?? 0.95 });
  material.name = `ground-${season}`;
  return makeCozy(material, {
    rim: 0.03,
    key: 'ground',
    uniforms,
    patch: (fs) => {
      for (const anchor of ['#include <map_fragment>', '#include <alphamap_fragment>']) {
        if (!fs.includes(anchor)) throw new Error(`ground material: '${anchor}' not found`);
      }
      return fs
        .replace('#include <common>', `#include <common>\n${GROUND_PARS}`)
        .replace('#include <map_fragment>', GROUND_MAP)
        .replace('#include <alphamap_fragment>', GROUND_PATH + GROUND_LAND);
    },
  });
}





export async function viewerGround(season = 'summer') {
  const geometry = new THREE.RingGeometry(0.05, 60, 96, 60).rotateX(-Math.PI / 2);
  const n = geometry.attributes.position.count;
  const colours = new Float32Array(n * 3);
  const c = linear(seasonPalette(season).grass[1]);
  for (let i = 0; i < n; i++) colours.set(c, i * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const mesh = new THREE.Mesh(geometry, await groundMaterial({ season, paths: false }));
  mesh.receiveShadow = true;
  mesh.name = 'viewer-ground';
  return mesh;
}
