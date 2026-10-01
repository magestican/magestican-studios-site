




















import * as THREE from 'three';
import { horizonDip } from 'moon/world/curve.mjs';
import { ASTEROIDS, SKY_FURNITURE, SKY_PLANETS_MAX, skyOfId, skyPlanetsFrom, visibleAsteroids } from 'moon/world/space.mjs';

const VERT =  `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  gl_Position = p.xyww;
}
`;

const FRAG =  `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uBelow;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uStars;
uniform float uTime;
uniform float uHorizonY;
uniform vec3 uPlanetDir;
uniform float uPlanetSize;
uniform vec3 uMoonDir;
uniform float uMoonSize;
uniform float uSpace;
// xyz: direction, w: angular radius (0 = unused slot).
uniform vec4 uBodies[ ${SKY_PLANETS_MAX} ];
uniform vec3 uBodyColor[ ${SKY_PLANETS_MAX} ];
uniform float uBodyNext[ ${SKY_PLANETS_MAX} ];
uniform int uBodyCount;
uniform vec4 uRocks[ ${ASTEROIDS.maxDrawn} ];
uniform vec2 uRockSpin[ ${ASTEROIDS.maxDrawn} ];
uniform int uRockCount;
varying vec3 vDir;

float sHash( vec3 p ) {
  p = fract( p * 0.3183099 + 0.1 );
  p *= 17.0;
  return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}
float sNoise( vec3 x ) {
  vec3 i = floor( x ); vec3 f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( sHash( i ), sHash( i + vec3( 1, 0, 0 ) ), f.x ), mix( sHash( i + vec3( 0, 1, 0 ) ), sHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( sHash( i + vec3( 0, 0, 1 ) ), sHash( i + vec3( 1, 0, 1 ) ), f.x ), mix( sHash( i + vec3( 0, 1, 1 ) ), sHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
float sFbm( vec3 p ) {
  return sNoise( p ) * 0.5 + sNoise( p * 2.03 ) * 0.28 + sNoise( p * 4.1 ) * 0.14 + sNoise( p * 8.3 ) * 0.08;
}

// Tangent-plane coordinates of d around centre c, in units of angular radius.
vec2 sLocal( vec3 d, vec3 c, float size ) {
  vec3 t = normalize( cross( vec3( 0.0, 1.0, 0.0 ), c ) );
  vec3 b = cross( c, t );
  float z = max( dot( d, c ), 1e-4 );
  return vec2( dot( d, t ), dot( d, b ) ) / z / size;
}

void main() {
  vec3 d = normalize( vDir );
  float e = d.y - uHorizonY;
  vec3 col = e > 0.0
    ? mix( uHorizon, uZenith, pow( smoothstep( 0.0, 0.3, e ), 0.6 ) )
    : mix( uHorizon, uBelow, smoothstep( 0.0, 0.3, -e ) );
  float sunward = pow( max( dot( d, uSunDir ), 0.0 ), 5.0 );
  col += uSunColor * sunward * 0.18 * ( 1.0 - smoothstep( 0.0, 0.5, abs( e ) ) );
  // The flight: the pastel gradient gives way to the blackness of space.
  col = mix( col, vec3( 0.012, 0.010, 0.030 ), uSpace );
  float starLight = max( uStars, uSpace );

  // Night: nebula wash then stars.
  if ( starLight > 0.001 ) {
    float neb = sFbm( d * 2.3 + vec3( 3.1, 0.0, 1.7 ) );
    float neb2 = sFbm( d * 3.1 + vec3( 9.0, 4.0, 2.0 ) );
    vec3 wash = mix( vec3( 0.55, 0.22, 0.52 ), vec3( 0.16, 0.42, 0.55 ), smoothstep( 0.35, 0.65, neb2 ) );
    col += wash * pow( smoothstep( 0.42, 0.78, neb ), 1.6 ) * 0.22 * starLight;
    vec3 cell = floor( d * 120.0 );
    float h = sHash( cell );
    if ( h > 0.974 ) {
      vec3 jitter = vec3( sHash( cell + 1.7 ), sHash( cell + 3.1 ), sHash( cell + 5.3 ) ) - 0.5;
      vec3 centre = normalize( ( cell + 0.5 + jitter * 0.6 ) / 120.0 );
      float dist = length( d - centre ) * 120.0;
      float twinkle = 0.7 + 0.3 * sin( uTime * ( 1.5 + h * 3.0 ) + h * 80.0 );
      float big = step( 0.992, h );
      float star = smoothstep( 0.32 + big * 0.2, 0.0, dist ) * twinkle;
      vec3 tint = mix( vec3( 1.0, 0.92, 0.8 ), vec3( 0.8, 0.88, 1.0 ), sHash( cell + 9.9 ) );
      col += tint * star * starLight * ( 0.85 + big * 0.7 );
    }
  }

  // The ringed planet.
  vec2 q = sLocal( d, uPlanetDir, uPlanetSize );
  if ( dot( d, uPlanetDir ) > 0.0 && length( q ) < 3.0 ) {
    float ang = 0.36;
    vec2 r = mat2( cos( ang ), sin( ang ), -sin( ang ), cos( ang ) ) * q;
    float rr = length( q );
    float aa = max( fwidth( rr ), 0.004 ) * 1.5;
    float disc = 1.0 - smoothstep( 1.0 - aa, 1.0 + aa, rr );
    float ringE = length( vec2( r.x, r.y * 3.6 ) );
    float ringAa = max( fwidth( ringE ), 0.004 ) * 1.5;
    float ring = smoothstep( 1.38, 1.38 + ringAa, ringE ) * ( 1.0 - smoothstep( 2.1 - ringAa, 2.1, ringE ) );
    ring *= 0.55 + 0.25 * sin( ringE * 26.0 ) + 0.2 * smoothstep( 1.6, 1.7, ringE ) * ( 1.0 - smoothstep( 1.75, 1.8, ringE ) );
    vec3 ringCol = vec3( 0.98, 0.9, 0.78 );
    float behind = step( 0.0, r.y ) * disc;
    col = mix( col, mix( ringCol, uHorizon, 0.25 ), ring * 0.8 * ( 1.0 - behind ) * ( 1.0 - disc ) );
    vec3 n = vec3( q, sqrt( max( 0.0, 1.0 - rr * rr ) ) );
    float lit = smoothstep( -0.35, 0.75, dot( n, normalize( vec3( -0.55, 0.5, 0.65 ) ) ) );
    float bands = sin( r.y * 7.5 + sNoise( vec3( r * 3.0, 1.0 ) ) * 1.6 );
    vec3 pcol = mix( vec3( 0.98, 0.52, 0.36 ), vec3( 0.5, 0.36, 0.86 ), smoothstep( -0.6, 0.8, bands ) );
    pcol = mix( pcol, vec3( 1.0, 0.82, 0.6 ), smoothstep( 0.75, 1.0, sin( r.y * 3.0 + 1.0 ) ) * 0.55 );
    pcol *= 0.5 + 0.5 * lit;
    pcol = mix( pcol, uHorizon, 0.12 + 0.3 * pow( rr, 5.0 ) );
    col = mix( col, pcol, disc );
    col = mix( col, mix( ringCol, uHorizon, 0.2 ) * ( 0.75 + 0.25 * lit ), ring * 0.85 * ( 1.0 - step( 0.0, r.y ) ) * step( rr, 1.05 ) );
    col = mix( col, mix( ringCol, uHorizon, 0.25 ), ring * 0.8 * ( 1.0 - step( 0.0, r.y ) ) * ( 1.0 - step( rr, 1.05 ) ) * disc );
  }

  // The little second moon.
  vec2 m = sLocal( d, uMoonDir, uMoonSize );
  float mr = length( m );
  if ( dot( d, uMoonDir ) > 0.0 && mr < 1.5 ) {
    float maa = max( fwidth( mr ), 0.01 ) * 1.5;
    float mdisc = 1.0 - smoothstep( 1.0 - maa, 1.0 + maa, mr );
    vec3 mn = vec3( m, sqrt( max( 0.0, 1.0 - mr * mr ) ) );
    float mlit = smoothstep( -0.2, 0.7, dot( mn, normalize( vec3( 0.6, 0.45, 0.66 ) ) ) );
    float craters = smoothstep( 0.55, 0.7, sNoise( vec3( m * 2.6, 4.0 ) ) ) * 0.12;
    vec3 mcol = vec3( 1.0, 0.97, 0.93 ) * ( 0.55 + 0.45 * mlit ) - craters;
    mcol = mix( mcol, uHorizon, 0.18 );
    col = mix( col, mcol, mdisc );
    col += vec3( 1.0, 0.95, 0.9 ) * 0.08 * ( 1.0 - smoothstep( 1.0, 1.5, mr ) ) * ( 1.0 - mdisc ) * uStars;
  }

  // G8: THE OTHER PLANETS of the system. A lit disc in its own season's colour,
  // hazed toward the sky the way distance hazes anything, so in daylight it sits
  // IN the sky rather than on top of it. The destination - the one a double tap
  // goes to - carries a soft halo, which is the only hint the player gets on the
  // ground about where the button leads.
  for ( int i = 0; i < ${SKY_PLANETS_MAX}; i ++ ) {
    if ( i >= uBodyCount ) break;
    vec4 body = uBodies[ i ];
    if ( body.w <= 0.0 || dot( d, body.xyz ) <= 0.0 ) continue;
    vec2 b = sLocal( d, body.xyz, body.w );
    float br = length( b );
    if ( br > 2.4 ) continue;
    float baa = max( fwidth( br ), 0.006 ) * 1.5;
    float bdisc = 1.0 - smoothstep( 1.0 - baa, 1.0 + baa, br );
    vec3 bn = vec3( b, sqrt( max( 0.0, 1.0 - min( br, 1.0 ) * min( br, 1.0 ) ) ) );
    float blit = smoothstep( -0.45, 0.8, dot( bn, normalize( vec3( -0.5, 0.42, 0.75 ) ) ) );
    // Continents: a low-frequency wash of its own colour, darker and lighter.
    float land = sNoise( vec3( b * 1.5 + float( i ) * 4.0, 2.0 ) );
    vec3 bcol = uBodyColor[ i ] * ( 0.82 + 0.34 * smoothstep( 0.4, 0.62, land ) );
    bcol *= 0.34 + 0.66 * blit;
    // Hazed into the sky by day, crisp against space at night.
    bcol = mix( bcol, uHorizon, 0.34 * ( 1.0 - starLight ) + 0.08 );
    col = mix( col, bcol, bdisc );
    // The destination's halo, and a rim light on its lit edge.
    float halo = ( 1.0 - smoothstep( 1.0, 2.4, br ) ) * ( 1.0 - bdisc );
    col += uBodyColor[ i ] * halo * ( 0.05 + 0.16 * uBodyNext[ i ] ) * ( 0.35 + 0.65 * starLight );
  }

  // G8: THE ASTEROIDS, at night only. A lumpy grey rock tumbling about its own
  // axis: the silhouette is a unit circle warped by noise in the rock's OWN
  // rotating frame, so the lumps turn with it instead of swimming.
  if ( starLight > 0.02 ) {
    for ( int i = 0; i < ${ASTEROIDS.maxDrawn}; i ++ ) {
      if ( i >= uRockCount ) break;
      vec4 rock = uRocks[ i ];
      if ( rock.w <= 0.0 || dot( d, rock.xyz ) <= 0.0 ) continue;
      vec2 q = sLocal( d, rock.xyz, rock.w );
      if ( length( q ) > 1.8 ) continue;
      float spin = uRockSpin[ i ].x;
      vec2 r = mat2( cos( spin ), sin( spin ), -sin( spin ), cos( spin ) ) * q;
      float ang = atan( r.y, r.x );
      float shape = uRockSpin[ i ].y;
      float lump = 0.74 + 0.2 * sin( ang * 3.0 + shape * 2.1 ) + 0.12 * sin( ang * 5.0 - shape * 3.3 );
      float rr = length( r ) / lump;
      float raa = max( fwidth( rr ), 0.05 ) * 1.5;
      float disc = 1.0 - smoothstep( 1.0 - raa, 1.0 + raa, rr );
      vec3 rn = vec3( r, sqrt( max( 0.0, 1.0 - min( rr, 1.0 ) * min( rr, 1.0 ) ) ) );
      float rlit = smoothstep( -0.3, 0.85, dot( rn, normalize( vec3( 0.55, 0.5, 0.67 ) ) ) );
      vec3 rcol = mix( vec3( 0.16, 0.15, 0.20 ), vec3( 0.74, 0.70, 0.66 ), rlit );
      col = mix( col, rcol, disc * starLight );
    }
  }

  gl_FragColor = vec4( col, 1.0 );
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const setLinear = (c, rgb) => c.setRGB(rgb[0], rgb[1], rgb[2], THREE.LinearSRGBColorSpace);

function dirFrom(azimuth, elevationSin) {
  const e = Math.asin(Math.max(-0.99, Math.min(0.99, elevationSin)));
  return new THREE.Vector3(Math.sin(azimuth) * Math.cos(e), Math.sin(e), -Math.cos(azimuth) * Math.cos(e));
}

export function createSky() {
  const uniforms = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uBelow: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uStars: { value: 0 },
    uTime: { value: 0 },
    uHorizonY: { value: 0 },
    uPlanetDir: { value: new THREE.Vector3(0, 0, -1) },
    uPlanetSize: { value: SKY_FURNITURE.ringedPlanet.size },
    uMoonDir: { value: new THREE.Vector3(0, 0, -1) },
    uMoonSize: { value: SKY_FURNITURE.secondMoon.size },
    
    
    uSpace: { value: 0 },
    uBodies: { value: Array.from({ length: SKY_PLANETS_MAX }, () => new THREE.Vector4(0, 1, 0, 0)) },
    uBodyColor: { value: Array.from({ length: SKY_PLANETS_MAX }, () => new THREE.Color()) },
    uBodyNext: { value: new Array(SKY_PLANETS_MAX).fill(0) },
    uBodyCount: { value: 0 },
    uRocks: { value: Array.from({ length: ASTEROIDS.maxDrawn }, () => new THREE.Vector4(0, 1, 0, 0)) },
    uRockSpin: { value: Array.from({ length: ASTEROIDS.maxDrawn }, () => new THREE.Vector2()) },
    uRockCount: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), material);
  mesh.name = 'sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;

  return {
    mesh,
    uniforms,
    
    anchorYaw: 0,
    
    
    
    planetId: null,
    space: 0,
    update(cycle, camera, focus, seconds, curve) {
      mesh.position.copy(camera.position);
      setLinear(uniforms.uZenith.value, cycle.skyZenith);
      setLinear(uniforms.uHorizon.value, cycle.skyHorizon);
      setLinear(uniforms.uBelow.value, cycle.skyBelow);
      setLinear(uniforms.uSunColor.value, cycle.keyColor);
      uniforms.uSunDir.value.set(...cycle.keyDirection);
      uniforms.uStars.value = cycle.stars;
      uniforms.uTime.value = seconds;
      const dist = Math.hypot(camera.position.x - focus.x, camera.position.z - focus.z);
      const dip = horizonDip(camera.position.y - focus.y, dist, curve);
      uniforms.uHorizonY.value = dip;
      
      
      
      const furniture = (f) => dirFrom(this.anchorYaw + f.azimuth, dip + f.rise);
      uniforms.uPlanetDir.value.copy(furniture(SKY_FURNITURE.ringedPlanet));
      uniforms.uMoonDir.value.copy(furniture(SKY_FURNITURE.secondMoon));

      
      uniforms.uSpace.value = this.space;
      const bodies = this.planetId === null ? [] : skyPlanetsFrom(this.planetId);
      uniforms.uBodyCount.value = Math.min(bodies.length, SKY_PLANETS_MAX);
      bodies.slice(0, SKY_PLANETS_MAX).forEach((b, i) => {
        
        
        
        const dir = dirFrom(this.anchorYaw + b.azimuth, dip + b.rise);
        uniforms.uBodies.value[i].set(dir.x, dir.y, dir.z, b.size);
        uniforms.uBodyColor.value[i].set(b.colour);
        uniforms.uBodyNext.value[i] = b.next ? 1 : 0;
      });
      
      const rocks = cycle.stars > 0.02 || this.space > 0.02 ? visibleAsteroids(seconds, { horizonY: dip, ...skyOfId(this.planetId) }) : []; 
      uniforms.uRockCount.value = Math.min(rocks.length, ASTEROIDS.maxDrawn);
      rocks.slice(0, ASTEROIDS.maxDrawn).forEach((r, i) => {
        uniforms.uRocks.value[i].set(r.dir[0], r.dir[1], r.dir[2], r.size);
        uniforms.uRockSpin.value[i].set(r.spin, r.shape);
      });
    },
  };
}
