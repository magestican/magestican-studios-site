





export const NOISE =  `
float celHash13( vec3 p3 ) { p3 = fract( p3 * .1031 ); p3 += dot( p3, p3.zyx + 31.32 ); return fract( ( p3.x + p3.y ) * p3.z ); }
float celNoise3( vec3 p ) { vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( celHash13( i ), celHash13( i + vec3( 1, 0, 0 ) ), f.x ), mix( celHash13( i + vec3( 0, 1, 0 ) ), celHash13( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( celHash13( i + vec3( 0, 0, 1 ) ), celHash13( i + vec3( 1, 0, 1 ) ), f.x ), mix( celHash13( i + vec3( 0, 1, 1 ) ), celHash13( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z ); }
`;


export const CEL_PARS_V =  `
varying vec3 vCelN; varying vec3 vCelW; varying vec3 vCelO;
`;


export const celMainV = (poseN = '') =>  `
vec4 celW = vec4( transformed, 1.0 );
vec3 celN = normal;
${poseN}
#ifdef USE_INSTANCING
celW = instanceMatrix * celW; celN = mat3( instanceMatrix ) * celN;
#endif
vCelW = ( modelMatrix * celW ).xyz; vCelO = position;
vCelN = normalize( mat3( modelMatrix ) * celN );
`;

export const CEL_PARS_F =  `
uniform vec3 uCelSun; uniform vec3 uCelShade; uniform float uCelSat; uniform float uCelCell;
uniform float uCelCrackScale; uniform float uCelSpec;
varying vec3 vCelN; varying vec3 vCelW; varying vec3 vCelO;
${NOISE}
vec3 celShade( vec3 base ) {
  float g = dot( base, vec3( 0.2126, 0.7152, 0.0722 ) ); base = max( mix( vec3( g ), base, uCelSat ), 0.0 );
#ifdef CEL_GLOW
  return base * 1.6 + 0.2;
#else
#ifdef FLAT_SHADED
  vec3 N = normalize( cross( dFdx( vCelW ), dFdy( vCelW ) ) );
#else
  vec3 N = normalize( vCelN );
  if ( ! gl_FrontFacing ) N = - N;
#endif
  float nl = dot( N, uCelSun );
#if CEL_CORRUPT > 0
  float c = abs( celNoise3( vCelO * uCelCrackScale ) - 0.5 ) + abs( celNoise3( vCelO * uCelCrackScale * 2.15 + 3.0 ) - 0.5 ) * 0.5;
#if CEL_CORRUPT == 1
  base = mix( vec3( 0.07, 0.03, 0.10 ), base * 0.25, 0.3 ); // violet-black body
  if ( c < 0.07 ) return vec3( 1.0, 0.022, 0.033 ); // hard red crack (sRGB 1, .16, .2)
#else
  base *= 0.82; // a boss keeps its own colours
  if ( c < 0.045 ) return vec3( 1.0, 0.022, 0.033 );
  if ( c < 0.075 ) base *= 0.35; // scorched rim round the crack
#endif
#endif
  float lit = step( 0.12, nl );
  vec3 col = base * ( 0.88 + 0.12 * lit );
  vec3 shade = base * uCelShade; // the shade band: a flat violet multiply, never black
  vec2 f = fract( gl_FragCoord.xy / uCelCell ) - 0.5; // halftone dots, bigger as the surface turns away
  float r = clamp( ( 0.12 - nl ) * 1.1 + 0.18, 0.0, 0.75 );
  vec3 sh = mix( shade, shade * 0.62, step( length( f ), r * 0.72 ) );
  col = lit > 0.5 ? col : sh;
  vec3 H = normalize( uCelSun + normalize( cameraPosition - vCelW ) ); // hard specular chip
  if ( lit > 0.5 && dot( N, H ) > uCelSpec ) col = mix( col, vec3( 1.0 ), 0.55 );
  return col;
#endif
}
`;
export const CEL_MAIN_F =  `
outgoingLight = celShade( diffuseColor.rgb );
`;






export const hullVertex = (pose = { pars: '', p: '', n: '' }) =>  `
#include <common>
uniform vec2 uCelRes; uniform float uCelPx; uniform float uHullW;
#ifdef HULL_ATTR
attribute float hw;
#endif
${pose.pars}
void main() {
  vec3 p = position; vec3 n = normal;
  ${pose.p}
  ${pose.n}
  // an inkless decal (dachiModel NO_INK_UV: a human's eyes and mouth) gets no outline: dropped past the far plane
  if ( abs( uv.x - ${(9.5 / 32).toFixed(6)} ) < 1e-4 && abs( uv.y - ${(1 - 23.5 / 32).toFixed(6)} ) < 1e-4 ) { gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); return; }
  vec4 w = modelMatrix * vec4( p, 1.0 );
  vec4 c = projectionMatrix * viewMatrix * w;
  vec2 cn = ( projectionMatrix * viewMatrix * vec4( normalize( mat3( modelMatrix ) * n ), 0.0 ) ).xy;
#ifdef HULL_ATTR
  float k = hw * 0.1 * uCelPx;
#else
  float k = uHullW * uCelPx;
#endif
  c.xy += normalize( cn + 1e-6 ) * k * 2.0 / uCelRes * c.w;
  c.z += 0.0004 * c.w;
  gl_Position = c;
  vec4 mvPosition = viewMatrix * w;
  #include <fog_vertex>
}
`;
export const HULL_FRAG =  `
#include <common>
#include <clipping_planes_pars_fragment>
uniform vec3 uInk;
void main() {
  #include <clipping_planes_fragment>
  gl_FragColor = vec4( uInk, 1.0 );
}
`;
