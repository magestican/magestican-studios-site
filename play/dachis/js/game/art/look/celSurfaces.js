








import * as THREE from 'three';
import * as R from './celRules.js';
import { NOISE, CEL_PARS_V, celMainV, CEL_PARS_F } from './celGlsl.js';

export const SURFACES = new Set(['ground', 'water', 'spring', 'lava']);
const lin = (h) => new THREE.Color(h); 
export const made = []; 






const GROUND_F =  `
uniform sampler2D uGClass; uniform sampler2D uGPal; uniform sampler2D uGPath;
uniform float uGN; uniform vec2 uGPalN; uniform vec3 uCelInk; uniform float uGInk;
vec4 gTile( vec2 i ) { return texture2D( uGClass, ( i + 0.5 ) / uGN ); }
float gCls( vec4 t ) { return floor( t.r * 255.0 + 0.5 ); }
vec3 gTone( float cls, float reg, float k ) {
  return texture2D( uGPal, vec2( ( cls + 0.5 ) / uGPalN.x, ( reg * 2.0 + k + 0.5 ) / uGPalN.y ) ).rgb;
}
float gSame( float a, float b ) { return a == b ? 1.0 : 0.0; }
vec4 celGround() {
  vec2 w = vCelW.xz;
  vec2 q = w + ( vec2( celNoise3( vec3( w * 0.55, 1.3 ) ), celNoise3( vec3( w * 0.55, 7.9 ) ) ) - 0.5 ) * 0.9
             + ( vec2( celNoise3( vec3( w * 2.1, 4.2 ) ), celNoise3( vec3( w * 2.1, 9.4 ) ) ) - 0.5 ) * 0.18;
  vec2 t = q - 0.5, i = floor( t ), f = t - i;
  vec4 A = gTile( i ), B = gTile( i + vec2( 1.0, 0.0 ) ), C = gTile( i + vec2( 0.0, 1.0 ) ), D = gTile( i + vec2( 1.0, 1.0 ) );
  float ca = gCls( A ), cb = gCls( B ), cc = gCls( C ), cd = gCls( D );
  float wa = ( 1.0 - f.x ) * ( 1.0 - f.y ), wb = f.x * ( 1.0 - f.y ), wc = ( 1.0 - f.x ) * f.y, wd = f.x * f.y;
  float sa = wa + wb * gSame( cb, ca ) + wc * gSame( cc, ca ) + wd * gSame( cd, ca );
  float sb = wb + wa * gSame( ca, cb ) + wc * gSame( cc, cb ) + wd * gSame( cd, cb );
  float sc = wc + wa * gSame( ca, cc ) + wb * gSame( cb, cc ) + wd * gSame( cd, cc );
  float sd = wd + wa * gSame( ca, cd ) + wb * gSame( cb, cd ) + wc * gSame( cc, cd );
  float best = sa, cls = ca, reg = A.g;
  if ( sb > best ) { best = sb; cls = cb; reg = B.g; }
  if ( sc > best ) { best = sc; cls = cc; reg = C.g; }
  if ( sd > best ) { best = sd; cls = cd; reg = D.g; }
  float second = 0.0;
  if ( ca != cls ) second = max( second, sa );
  if ( cb != cls ) second = max( second, sb );
  if ( cc != cls ) second = max( second, sc );
  if ( cd != cls ) second = max( second, sd );
  reg = floor( reg * 255.0 + 0.5 );
  float gap = best - second, fGap = fwidth( gap );
  // the path: a signed distance to its edge (groundPaths.js bakePathField: d = v * 2 - 0.6), gently ragged
  float pd = texture2D( uGPath, w / uGN ).r * 2.0 - 0.6;
  float pe = pd + ( celNoise3( vec3( w * 2.4, 3.1 ) ) - 0.5 ) * 0.1, fPe = fwidth( pe );
  // two flat tones in hard-edged blobs (the prototype's 0.9 / 3.1 noise pair)
  float blob = step( 0.55, celNoise3( vec3( w * 0.9, 0.0 ) ) * 0.7 + celNoise3( vec3( w * 3.1, 5.0 ) ) * 0.3 );
  if ( abs( pe ) < fPe * 1.6 ) return vec4( uCelInk, 1.0 );
  float pc = uGPalN.x - 1.0;
  if ( pe < 0.0 ) {
    // painted dashes down the middle of the wide roads (a city kid's road)
    float dash = ( pd < -0.5 && fract( ( w.x - w.y ) * 1.3 ) < 0.18 && celNoise3( vec3( w * 2.0, 2.0 ) ) > 0.35 ) ? 1.0 : 0.0;
    return vec4( gTone( pc, reg, dash ), 0.0 );
  }
  if ( second > 0.0 && gap < fGap * uGInk ) return vec4( uCelInk, 1.0 );
  return vec4( gTone( cls, reg, blob ), 0.0 );
}
`;
function groundFrom(src, info, U) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  m.name = 'cel:ground';
  const u = {
    uGClass: { value: info.classes }, uGPal: { value: info.palette }, uGPath: { value: info.field },
    uGN: { value: info.n }, uGPalN: { value: new THREE.Vector2(info.palette.image.width, info.palette.image.height) },
    uGInk: { value: R.GROUND_INK }, uCelSat: { value: 1 }, uCelSpec: { value: 2 },
  };
  m.userData = { cel: true, look: info, uniforms: u };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + CEL_PARS_V)
      .replace('#include <project_vertex>', '#include <project_vertex>\n' + celMainV(''));
    sh.fragmentShader = '#define CEL_CORRUPT 0\n' + sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CEL_PARS_F + GROUND_F)
      .replace('#include <opaque_fragment>', 'vec4 celG = celGround();\noutgoingLight = celG.a > 0.5 ? uCelInk : celShade( celG.rgb );\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'cel-ground';
  return m;
}


const WATER_V =  `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_F =  `
uniform sampler2D uDepth; uniform float uMapN; uniform float uCelTime; uniform float uCelCell; uniform vec3 uCelInk;
uniform vec3 uWC[ 4 ]; uniform float uWA[ 4 ]; uniform vec3 uWEdge;
varying vec3 vW;
${NOISE}
void main() {
  vec2 p = vW.xz, uv = p / uMapN; float t = uCelTime;
  float depth = ( uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0 ) ? 1.0 : texture2D( uDepth, uv ).r;
  // the band edges breathe a little, so the shore foam laps
  float d = depth + ( celNoise3( vec3( p * 0.7, t * 0.15 ) ) - 0.5 ) * 0.08 + sin( t * 1.3 + p.x * 0.5 + p.y * 0.4 ) * 0.012;
  float e = d - ${R.WATER_BANDS[0][0].toFixed(3)}, fe = fwidth( e );
  // gleams: white shapes stretched along screen-horizontal, drifting and turning over slowly
  vec2 s = vec2( dot( p, vec2( 0.7071, -0.7071 ) ) * 1.3, dot( p, vec2( 0.7071, 0.7071 ) ) * 4.6 ) + vec2( t * 0.08, t * 0.03 );
  float g = celNoise3( vec3( s, t * 0.07 ) ), fg = fwidth( g );
  vec2 cell = fract( gl_FragCoord.xy / uCelCell ) - 0.5;
  vec3 col; float a;
  if ( d < ${R.WATER_BANDS[0][0].toFixed(3)} ) { col = uWC[ 0 ]; a = uWA[ 0 ]; }
  else if ( d < ${R.WATER_BANDS[1][0].toFixed(3)} ) { col = uWC[ 1 ]; a = uWA[ 1 ]; }
  else if ( d < ${R.WATER_BANDS[2][0].toFixed(3)} ) { col = uWC[ 2 ]; a = uWA[ 2 ]; }
  else { col = uWC[ 3 ]; a = uWA[ 3 ]; if ( length( cell ) < 0.2 ) col = mix( col, uWC[ 2 ], 0.55 ); } // halftone in the deep
  if ( abs( e ) < fe * 1.4 ) { col = uCelInk; a = 1.0; } // ink round the foam
  else if ( d > 0.12 ) {
    if ( g > 0.81 ) { col = vec3( 1.0 ); a = 1.0; }
    else if ( g > 0.81 - fg * 1.5 ) { col = uWEdge; a = 1.0; }
  }
  gl_FragColor = vec4( col, a );
  #include <colorspace_fragment>
}`;
function waterFrom(src, info, U) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uDepth: src.uniforms.uDepth, uMapN: src.uniforms.uMapN, uCelTime: U.uCelTime, uCelCell: U.uCelCell, uCelInk: U.uCelInk,
      uWC: { value: R.WATER_BANDS.map(([, h]) => lin(h)) }, uWA: { value: R.WATER_ALPHA.slice() }, uWEdge: { value: lin(R.WATER_EDGE) },
    },
    vertexShader: WATER_V, fragmentShader: WATER_F,
  });
  m.name = 'cel:water'; m.userData = { cel: true, look: info };
  return m;
}


const DISC_V =  `
varying vec2 vL;
void main() { vL = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`;
const SPRING_F =  `
uniform float uCelTime; uniform float uRad; uniform vec3 uSB; uniform vec3 uSR; uniform vec3 uSRing;
varying vec2 vL;
void main() {
  float r = length( vL ) / uRad, fr = fwidth( r * 3.0 );
  vec3 col = r > 0.84 ? uSR : uSB;
  float ring = fract( r * 3.0 - uCelTime * 0.35 );
  if ( r < 0.8 && ring < fr * 2.2 + 0.03 ) col = uSRing;
  if ( length( ( vL / uRad - vec2( -0.42, -0.12 ) ) * vec2( 1.0, 2.4 ) ) < 0.15 ) col = uSRing; // a gleam on the far side
  gl_FragColor = vec4( col, 1.0 );
  #include <colorspace_fragment>
}`;
const LAVA_F =  `
uniform float uCelTime; uniform float uRad; uniform vec3 uLB; uniform vec3 uLH; uniform vec3 uLC; uniform vec3 uCelInk;
varying vec2 vL;
${NOISE}
void main() {
  vec2 p = vL; float t = uCelTime, r = length( p ) / uRad, fr = fwidth( r );
  vec2 dr = vec2( sin( t * 0.13 ) * 0.3, t * 0.05 );
  float c1 = abs( celNoise3( vec3( p * 1.7 + dr, 0.5 ) ) - 0.5 ), c2 = abs( celNoise3( vec3( p * 3.6 - dr * 1.3, 4.0 ) ) - 0.5 );
  float f1 = fwidth( c1 ), f2 = fwidth( c2 );
  float heat = celNoise3( vec3( p * 1.5, t * 0.25 ) ) * 0.65 + celNoise3( vec3( p * 4.0, t * 0.4 + 2.0 ) ) * 0.35 + sin( t * 1.7 ) * 0.03;
  vec3 col = heat > 0.7 ? uLC : heat > 0.58 ? uLH : uLB;
  if ( c1 < 0.014 + f1 || c2 < 0.007 + f2 || r > 1.0 - fr * 2.5 ) col = uCelInk; // ink cracks, an inked rim
  gl_FragColor = vec4( col, 1.0 );
  #include <colorspace_fragment>
}`;
function discFrom(info, U, frag, uniforms, name) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uCelTime: U.uCelTime, uCelInk: U.uCelInk, uRad: { value: info.radius || 1 }, ...uniforms },
    vertexShader: DISC_V, fragmentShader: frag,
  });
  m.name = name; m.userData = { cel: true, look: info };
  return m;
}


export function tintWater(hexes) {
  const cols = hexes || R.WATER_BANDS.map(([, h]) => h);
  for (const m of made) if (m.name === 'cel:water') cols.forEach((h, i) => m.uniforms.uWC.value[i].set(lin(h)));
}


export function surfaceFrom(src, U) {
  const info = src.userData.look;
  let m = null;
  if (info.role === 'ground') m = groundFrom(src, info, U);
  else if (info.role === 'water') m = waterFrom(src, info, U);
  else if (info.role === 'spring') m = discFrom(info, U, SPRING_F, { uSB: { value: lin(R.SPRING.base) }, uSR: { value: lin(R.SPRING.rim) }, uSRing: { value: lin(R.SPRING.ring) } }, 'cel:spring');
  else if (info.role === 'lava') m = discFrom(info, U, LAVA_F, { uLB: { value: lin(R.LAVA.base) }, uLH: { value: lin(R.LAVA.hot) }, uLC: { value: lin(R.LAVA.core) } }, 'cel:lava');
  if (m) made.push(m);
  return m;
}
