























import * as THREE from 'three';
import { PALETTE } from '../palette.js';










import { installShaderEdit } from '../../../../web-engine/render/shaderChain.js';
import { shadowsFor } from '../../../../web-engine/render/shadowRoles.js';
import { createMaterialCache } from '../../../../web-engine/render/materialCache.js';
import { EXPOSURE } from '../../../../web-engine/render/lookGrade.js';
import {
  ENV_INTENSITY, PAINT_ENV_INTENSITY, RUBBER_ENV_INTENSITY, DRIVER_ENV_INTENSITY,
} from '../../../../web-engine/render/lightRig.js';




























function installToneMapping() {
  if (THREE.ShaderChunk.tonemapping_pars_fragment.includes('FARMY_TONEMAP')) return;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `#define FARMY_TONEMAP
    // The ACES fit everyone uses (Narkowicz), which is a very close match to
    // the full curve at a fraction of the cost.
    vec3 farmyACES( vec3 x ) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp( ( x * ( a * x + b ) ) / ( x * ( c * x + d ) + e ), 0.0, 1.0 );
    }
    vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      vec3 mapped = farmyACES( color );
      // Push the chroma back out around the mapped luminance. Clamped, so a
      // saturated highlight cannot be pushed back out of gamut and wrap.
      float lum = dot( mapped, vec3( 0.2126, 0.7152, 0.0722 ) );
      return clamp( mix( vec3( lum ), mapped, 1.32 ), 0.0, 1.0 );
    }`,
  );
}









export function configureRenderer(renderer) {
  installToneMapping();
  renderer.toneMapping = THREE.CustomToneMapping;
  
  
  
  
  renderer.toneMappingExposure = EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  
  
  
  
  
  
  
  
  
  
  clearMaterialCache();
  return renderer;
}



























let QUALITY = 'high';










export function detectQuality() {
  if (typeof navigator === 'undefined') return 'high';
  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  
  if (mem <= 2 && cores <= 4) return 'low';
  return 'high';
}


export function setQuality(level) {
  QUALITY = level === 'low' ? 'low' : 'high';
  
  
  
  
  clearMaterialCache();
}
export function getQuality() { return QUALITY; }





















function addRim(material, { colour = 0xffe9c4, strength = 0.28, power = 2.6 } = {}) {
  const tint = new THREE.Color(colour);
  material.userData.rim = { value: new THREE.Vector4(tint.r, tint.g, tint.b, strength) };
  material.userData.rimPower = { value: power };
  
  
  
  
  
  
  
  installShaderEdit(material, `rim${power}`, (shader) => {
    shader.uniforms.uRim = material.userData.rim;
    shader.uniforms.uRimPower = material.userData.rimPower;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec4 uRim;
        uniform float uRimPower;`)
      
      
      
      .replace('#include <dithering_fragment>', `
        {
          // vViewPosition is the vector from the fragment to the camera, in
          // view space, and the shaded normal is already in that same space,
          // so the two are directly comparable and no matrix work is needed.
          float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
          float rim = pow(1.0 - facing, uRimPower);
          // Faded out where the surface is already dark. A rim on the shadowed
          // side of an object reads as a glow and looks like a bug; it should
          // only ever lift an edge that is plausibly catching the sky.
          float lit = clamp(dot(gl_FragColor.rgb, vec3(0.33)) * 2.2, 0.0, 1.0);
          gl_FragColor.rgb += uRim.rgb * (rim * uRim.a * lit);
        }
        #include <dithering_fragment>`);
  });
  
  
  
  
  
  
  return material;
}











function makeSurface({ rim, roughness, metalness, envMapIntensity, ...opts }) {
  if (QUALITY === 'low') {
    
    
    
    
    
    return new THREE.MeshLambertMaterial(opts);
  }
  const mat = new THREE.MeshStandardMaterial({
    roughness: roughness ?? 0.82,
    metalness: metalness ?? 0.0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    envMapIntensity: envMapIntensity ?? ENV_INTENSITY,
    ...opts,
  });
  if (rim !== false) addRim(mat, rim || undefined);
  return mat;
}







const materialCache = createMaterialCache(makeSurface);


export function clearMaterialCache() { materialCache.clear(); }





















export const materialCacheSize = () => materialCache.size();













export function surface(opts = {}) {
  return materialCache.get(opts);
}










export const paintedSurface = (opts = {}) => surface({
  roughness: 0.42, metalness: 0.08, envMapIntensity: PAINT_ENV_INTENSITY, ...opts,
  rim: { strength: 0.38, power: 2.2, ...(opts.rim || {}) },
});


export const rubberSurface = (opts = {}) => surface({
  roughness: 0.95, metalness: 0.0, envMapIntensity: RUBBER_ENV_INTENSITY, ...opts,
  rim: { strength: 0.12, power: 3.2 },
});

















export function dressImported(material, { envMapIntensity = DRIVER_ENV_INTENSITY, rim } = {}) {
  if (!material || QUALITY === 'low') return material;
  if (material.userData?.dressed) return material;
  if ('envMapIntensity' in material) material.envMapIntensity = envMapIntensity;
  if (rim !== false) addRim(material, rim || { strength: 0.22, power: 2.4 });
  material.userData.dressed = true;
  material.needsUpdate = true;
  return material;
}











export function applyShadows(root, role) {
  const { cast, receive } = shadowsFor(role, QUALITY);
  root.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    o.castShadow = cast;
    o.receiveShadow = receive;
  });
  return root;
}











export const NOISE_GLSL = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // THREE OCTAVES, NOT FIVE. Measured: five octaves on the ground and the sky
  // - which between them cover essentially every pixel on screen - more than
  // doubled the frame cost, and the fourth and fifth contribute detail finer
  // than a cloud edge or a patch of dirt has any business showing. The 2.03
  // multiplier is not exactly 2 so the octaves do not line up and print a
  // visible grid through the result.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;


















const SKIES = {
  day: { top: 0x2f74d8, horizon: 0xbcdcf7, haze: 0xd8e9f6, cloud: 0.55, cloudTint: 0xffffff, cloudShade: 0xa8c2da },
  snow: { top: 0x5f8fc4, horizon: 0xdcebf8, haze: 0xe9f2fb, cloud: 0.72, cloudTint: 0xf2f6fb, cloudShade: 0xc0d3e6 },
  overcast: { top: 0x7d90a2, horizon: 0xc4ccd4, haze: 0xc9cdd2, cloud: 0.88, cloudTint: 0xdfe4e9, cloudShade: 0x99a4b0 },
  dusk: { top: 0x38407e, horizon: 0xf0a978, haze: 0xe8b892, cloud: 0.60, cloudTint: 0xffd9b0, cloudShade: 0xc08e78 },
  
  
  
  
  
  rain: { top: 0x5b6874, horizon: 0x98a4ae, haze: 0xa8b1b8, cloud: 0.96, cloudTint: 0xb9c2c9, cloudShade: 0x74808b },
};
















export function skyPalette(kind = 'day') {
  const c = SKIES[kind] || SKIES.day;
  return { top: c.top, horizon: c.horizon, haze: c.haze };
}




































export const WAVE_GLSL = `
  // amplitude, wavelength, speed, direction (unit)
  const vec3 WAVE_A = vec3(0.22, 0.09, 0.03);
  const vec3 WAVE_L = vec3(26.0, 7.4, 2.1);
  const vec3 WAVE_S = vec3(0.62, 1.37, 2.71);
  // The scale argument is PER BAND, not one number, and that is what lets a caller fade the
  // short waves out with distance. A 2.1 m ripple evaluated per fragment 200 m
  // away is far below one sample per wavelength and prints a moire corduroy
  // across the whole surface - measured, on the lagoon, and it reads as woven
  // fabric rather than as water. The vertex stage uses it for the opposite
  // reason: at WATER_COLS resolution the mesh cannot carry the two short bands
  // at all, so it displaces with the swell and leaves them to the fragment.
  float waveAt(vec2 p, float t, vec3 scale, out vec3 nrm) {
    // 21, 43 and 78 degrees. Two trains at a right angle print a grid and two
    // at 60 print a hex, both of which are instantly readable as a pattern from
    // directly above a lake; 22 and 35 degrees apart is neither.
    vec2 d0 = vec2(0.9336, 0.3583);   // 21 deg
    vec2 d1 = vec2(0.7314, 0.6820);   // 43 deg
    vec2 d2 = vec2(0.2079, 0.9781);   // 78 deg
    vec3 k = 6.28318530718 / WAVE_L;
    vec3 amp = WAVE_A * scale;
    vec3 phase = vec3(
      dot(p, d0) * k.x + t * WAVE_S.x * k.x,
      dot(p, d1) * k.y - t * WAVE_S.y * k.y,
      dot(p, d2) * k.z + t * WAVE_S.z * k.z);
    vec3 s = sin(phase);
    vec3 c = cos(phase);
    float h = dot(amp, s);
    // dh/dx and dh/dz, exactly. The normal of a height field y = h(x,z) is
    // normalize(-dh/dx, 1, -dh/dz); there is no approximation anywhere in it.
    float dx = amp.x * c.x * k.x * d0.x + amp.y * c.y * k.y * d1.x + amp.z * c.z * k.z * d2.x;
    float dz = amp.x * c.x * k.x * d0.y + amp.y * c.y * k.y * d1.y + amp.z * c.z * k.z * d2.y;
    nrm = normalize(vec3(-dx, 1.0, -dz));
    return h;
  }
`;















export function buildSkyMaterial(kind = 'day', sunDir = new THREE.Vector3(-0.6, 0.5, 0.42), { ground = null } = {}) {
  const c = SKIES[kind] || SKIES.day;
  const uniforms = {
    uTop: { value: new THREE.Color(c.top) },
    uHorizon: { value: new THREE.Color(c.horizon) },
    uHaze: { value: new THREE.Color(c.haze) },
    uCloudTint: { value: new THREE.Color(c.cloudTint) },
    uCloudShade: { value: new THREE.Color(c.cloudShade ?? c.cloudTint) },
    uCloud: { value: c.cloud },
    uSunDir: { value: sunDir.clone().normalize() },
    uTime: { value: 0 },
    
    
    
    
    uGround: { value: new THREE.Color(ground ?? c.haze) },
    uGroundMix: { value: ground === null ? 0 : 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    
    
    
    fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uHaze, uCloudTint, uCloudShade, uSunDir, uGround;
      uniform float uCloud, uTime, uGroundMix;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;

        // GRADIENT. The exponent is what stops this reading as a two-colour
        // ramp: most of the change happens in the first fifteen degrees above
        // the horizon, which is where it happens in a real sky.
        vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.42));
        // Below the horizon the dome is behind the ground almost everywhere,
        // but not quite - over a crest it shows, and it has to be haze rather
        // than a hard edge.
        col = mix(uHaze, col, smoothstep(-0.10, 0.06, h));

        // SUN GLOW ONLY - see the note above about there being two suns once.
        float sd = max(dot(dir, uSunDir), 0.0);
        col += uCloudTint * pow(sd, 6.0) * 0.30;
        col += uCloudTint * pow(sd, 42.0) * 0.55;

        // CLOUDS. Projecting onto a plane above the viewer gives cloud shapes
        // that stretch toward the horizon the way real ones do; sampling the
        // direction vector directly gives evenly-sized blobs pasted on a dome.
        float dome = max(h, 0.055);
        vec2 p = dir.xz / dome * 1.4 + vec2(uTime * 0.0035, uTime * 0.0012);
        float n = fbm(p * 1.15);
        // Two thresholds rather than one: the lower makes a soft edge, the
        // upper a bright core, and the difference is what makes a cloud look
        // lit from one side instead of like a grey stain.
        //
        // THE THRESHOLDS WERE SET ABOVE THE RANGE THE NOISE PRODUCES. fbm()
        // is three octaves whose amplitudes sum to at most 0.875 and which
        // centre near 0.44, so smoothstep(0.52, 0.78, n) fired only in the top
        // tail and smoothstep(0.66, 0.92, n) almost never fired at all. The
        // clouds were being drawn where they could not show - which is most of
        // why 23% of the frame measured a spread of ten luma levels.
        // (No back-ticks in this comment: it lives inside a JS template
        // literal, and one would end the shader source mid-string.)
        float body = smoothstep(0.40, 0.63, n) * uCloud;
        float core = smoothstep(0.55, 0.80, n) * uCloud;
        // Faded out at the horizon, where the projection stretches to infinity
        // and any noise turns into streaks - but NOT as hard as it was. The
        // band the chase camera actually shows is elevation 4 to 20 degrees
        // (h 0.073-0.335), and smoothstep(0.02, 0.30, h) was still only at
        // 0.06 at the bottom of it, so the visible sky was the one part with
        // no cloud in it.
        float fade = smoothstep(0.015, 0.16, h);
        // SHADE FIRST, THEN THE LIT CORE. A cloud reads because its underside
        // is DARKER than the sky behind it; the bright top is the accent on
        // that, not the whole cloud. White on a 213-luma horizon is invisible.
        col = mix(col, uCloudShade, body * fade * 0.62);
        col = mix(col, uCloudTint, core * fade * 0.70);

        // THE GROUND, FOR THE ENVIRONMENT BAKE ONLY (uGroundMix is 0 on the
        // sky you can see). Without it the PMREM probe is the sky shader all
        // the way round, so everything below the horizon is uHaze - and the
        // FK-04 analysis pass measured what that does: integrated
        // cosine-weighted about each normal, the probe's irradiance was luma
        // 0.328 facing UP and 0.796 facing DOWN. The ambient light in this
        // game was 2.4x brighter from below than from above. That is not weak
        // lighting, it is INVERTED lighting, and it lands hardest on exactly
        // the curved surfaces the chase camera looks at - every underside and
        // side of every kart and animal was ambient-lit harder than its top.
        // Re-integrating with the lower hemisphere blended to the ground
        // colour leaves the up-facing number at 0.328 (so the road, field and
        // verge plateau does not move at all) and takes the down-facing one to
        // 0.134.
        col = mix(col, uGround, uGroundMix * (1.0 - smoothstep(-0.16, 0.02, h)));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  material.userData.uniforms = uniforms;
  
  
  
  
  
  
  
  material.userData.skyKind = kind;
  material.userData.sunDir = uniforms.uSunDir.value.clone();
  return material;
}










const ENV_GROUND = {
  day: PALETTE.grassDark,
  snow: PALETTE.packedSnow,
  overcast: PALETTE.mud,
  dusk: PALETTE.grassDark,
};


















export function buildEnvironment(renderer, skyMaterial) {
  
  
  if (QUALITY === 'low') return null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const scene = new THREE.Scene();
  
  
  
  
  const kind = skyMaterial?.userData?.skyKind ?? 'day';
  const bakeMaterial = buildSkyMaterial(
    kind,
    skyMaterial?.userData?.sunDir ?? new THREE.Vector3(-0.6, 0.5, 0.42),
    { ground: ENV_GROUND[kind] ?? ENV_GROUND.day },
  );
  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), bakeMaterial);
  scene.add(dome);
  const target = pmrem.fromScene(scene, 0.04);
  dome.geometry.dispose();
  bakeMaterial.dispose();
  pmrem.dispose();
  
  
  
  
  
  
  
  
  target.texture.userData.renderTarget = target;
  return target.texture;
}






export function releaseEnvironment(texture) {
  const target = texture?.userData?.renderTarget;
  if (target) {
    target.dispose();
    texture.userData.renderTarget = null;
  } else if (texture?.dispose) {
    texture.dispose();
  }
}






















export function addGroundDetail(material, { scale = 0.035, strength = 0.22, fade = 240 } = {}) {
  
  
  
  if (QUALITY === 'low') return material;
  material.userData.groundDetail = {
    uScale: { value: scale },
    uStrength: { value: strength },
    uFade: { value: fade },
  };
  
  
  
  
  installShaderEdit(material, `ground${scale}${strength}`, (shader) => {
    Object.assign(shader.uniforms, material.userData.groundDetail);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGroundWorld;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGroundWorld;
        uniform float uScale, uStrength, uFade;
        ${NOISE_GLSL}`)
      
      
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float dist = length(vViewPosition);
          // Detail fades out with distance because past a certain point the
          // texel is smaller than the pixel and detail can only alias into
          // moire. The BRANCH matters as much as the fade: the road and the
          // field are the two largest surfaces in the scene and most of their
          // pixels are far away, so skipping the noise outright for those is
          // most of the cost of this effect saved.
          float near = 1.0 - smoothstep(uFade * 0.35, uFade, dist);
          if (near > 0.004) {
            vec2 gp = vGroundWorld.xz * uScale;
            // Two scales, done by hand rather than through fbm: the broad one
            // hides the tile repeat, the fine one puts grain back in the near
            // field so the ground does not look like painted plastic up close.
            // Three noise lookups, where calling fbm twice cost six.
            float broad = vnoise(gp * 0.25) * 0.66 + vnoise(gp * 0.53) * 0.34 - 0.5;
            float fine = vnoise(gp * 3.1) - 0.5;
            // The fine grain is dropped sooner than the broad variation - it
            // is the one that aliases, and it is invisible past about a lorry
            // length anyway.
            float grain = 1.0 - smoothstep(uFade * 0.06, uFade * 0.22, dist);
            float v = (broad + fine * 0.45 * grain) * uStrength * near;
            diffuseColor.rgb *= (1.0 + v);
          }
        }`);
  });
  return material;
}
